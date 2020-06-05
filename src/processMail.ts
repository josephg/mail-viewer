import mod from 'mime-to-jmap'

const parseOpts: mod.JMAPMailOpts = {
  want_headers: [
    'header:X-Gmail-Labels:asText',
    // 'header:X-GM-THRID:asText',
  ]
}
// const gmailToJMAPKeywords: {[k: string]: string} = {
//   Important: '$important',
//   Starred: '$flagged',
// }

interface Thread {
  messages: string[]
  participants: string[]
  subject: string
  preview: string
  hasAttachments: boolean
  lastDate: number // Date of most recent email
  mailboxes: string[]
}


let nextThreadId = 1000
// Its a little complex to find all the threads. This class is a container for all that logic.
class ThreadGroups {

  threadIdForMsgId: Map<string, string> // msg id => thread id
  msgIdsForThread: Map<string, string[]> // thread id => list of message ids (may be duplicates)

  // idsForThread: Map<string, string[]> // thread id => list of (our) ids.
  idForMsgId: Map<string, string> // id => msg id

  mailboxesForId: Map<string, string[]>

  constructor() {
    this.threadIdForMsgId = new Map() // Maps messageId => thread id.
    this.msgIdsForThread = new Map()
    this.idForMsgId = new Map()
    this.mailboxesForId = new Map()
  }

  add(id: string, json: any, mailboxes: string[]) {
    // Figure out which thread to put the message in

    const msgId = json.messageId && json.messageId.length ? json.messageId[0] : id
    const refs = [msgId] // May be duplicates.
    if (json.inReplyTo) refs.push(...json.inReplyTo)
    if (json.references) refs.push(...json.references)

    this.idForMsgId.set(msgId, id)
    this.mailboxesForId.set(id, mailboxes)

    let candidates = new Set<string>()
    let threadId: string

    for (const m of refs) {
      const tid = this.threadIdForMsgId.get(m)
      if (tid) candidates.add(tid)
    }

    // console.log('refs', refs, 'candidates', candidates)
    // 3 cases:
    if (candidates.size === 0) {
      // No thread found. Make a new one.
      threadId = `T${nextThreadId++}`
      this.msgIdsForThread.set(threadId, refs)
    } else if (candidates.size === 1) {
      // Join the existing thread.
      // console.log('join existing')
      threadId = candidates.values().next().value
      this.msgIdsForThread.get(threadId)!.push(...refs)
    } else {
      // Yikes - merge thread IDs.
      // console.warn('Merging threads!')
      threadId = candidates.values().next().value
      const msgIds = this.msgIdsForThread.get(threadId)!
      msgIds.push(...refs)

      // We need to move over all the messages in the other candidate threads into this one.
      for (const t of candidates) {
        if (t === threadId) continue

        for (const m of this.msgIdsForThread.get(t)!) {
          this.threadIdForMsgId.set(m, threadId)
          msgIds.push(m)
        }
        this.msgIdsForThread.delete(t)
      }
    }

    // Anything we reference must be in the thread.
    for (const m of refs) {
      this.threadIdForMsgId.set(m, threadId)
    }

    // json.threadId = threadId // unneeded
    // console.log('message', id, json.messageId, 'in thread', threadId)
  }

  finalize(emails: Map<string, any>): Map<string, Thread> {
    let threads = new Map<string, Thread>()
    // Sort all the messages in each thread
    for (const [threadid, msgIds] of this.msgIdsForThread) {
      const idSet = new Set<string>()
      for (const m of msgIds) {
        const id = this.idForMsgId.get(m)
        if (id != null) idSet.add(id)
      }

      const messages = Array.from(idSet).sort((a, b) => {
        const ma = emails.get(a)
        const mb = emails.get(b)
        const da = new Date(ma.sentAt || ma.receivedAt)
        const db = new Date(mb.sentAt || mb.receivedAt)

        return (da < db) ? -1
          : (da == db) ? 0
          : 1
      })

      const firstMessage = emails.get(messages[0])

      let lastDate: number = 0
      let hasAttachments = false
      
      const participantSet = new Set<string>()
      const mailboxSet = new Set<string>()
      // debugger
      for (const mid of messages) {
        const json = emails.get(mid)
        const from = json.from[0]
        if (from) participantSet.add(from.name || from.email)
        if (Object.keys(json.attachments).length) hasAttachments = true
        lastDate = Math.max(lastDate, +new Date(json.receivedAt || json.sentAt))
        
        for (const m of this.mailboxesForId.get(mid)!) mailboxSet.add(m)
      }

      const thread: Thread = {
        subject: firstMessage.subject,
        preview: firstMessage.preview || '',
        messages,
        hasAttachments,
        lastDate,
        participants: Array.from(participantSet),
        mailboxes: Array.from(mailboxSet),
      }

      threads.set(threadid, thread)
    }

    // console.log('threads', threads)
    return threads
  }
}

// Yield back to the UI thread
const yieldUI = () => new Promise(resolve => {setTimeout(resolve, 0)})

const isProbablyMbox = (buf: Uint8Array) => {
  return buf[0] === 0x0a // File starts with 'From '
    && buf[1] === 0x46
    && buf[2] === 0x72
    && buf[3] === 0x6f
    && buf[4] === 0x6d
}

async function *eachEmailIn(buf: Uint8Array, lastModified: number) {
  if (isProbablyMbox(buf)) {
    console.log('Parsing as mbox file')
    for await (const {msg, progress} of mod.mbox_each_progress([buf])) {
      // console.log('msg', msg, 'progress', progress)
      const {body, mboxFromAddress, receivedAt} = mod.mbox_to_eml(msg, true)

  
      // TODO: Restrict this to get way fewer fields
      const {json} = mod.envelope_to_jmap(body, parseOpts)
      json.receivedAt = receivedAt

      yield {json, progress, body}
    }
  } else {
    console.log('Parsing as single email')
    const {json} = mod.envelope_to_jmap(buf, parseOpts)
    json.receivedAt = lastModified
    yield {json, progress: buf.length, body: buf}
  }
}

export async function scanEmails(files: {buf: ArrayBuffer, name: string, lastModified: number}[], setProgress?: (label: string, p: number) => void) {
  await mod.ready

  // The buffers contain all the files opened by the user.
  const bufs = files.map(({buf}) => new Uint8Array(buf))
  const totalLength = bufs.reduce((a, b) => a + b.byteLength, 0)

  const emailBytes = new Map<string, Uint8Array>() // Raw bytes for message
  const emails = new Map<string, any>() // map from ID => JSON
  // let emailsForThread = new Map() // map from thread ID => sorted list of email IDs
  
  const threadGroup = new ThreadGroups()

  const messagesForThread = new Map<string, string[]>()
  
  let processedLength = 0
  for (let i = 0; i < bufs.length; i++) {
    const buf = bufs[i]
    const {name, lastModified} = files[i]
    for await (const {json, progress, body} of eachEmailIn(buf, lastModified)) {
      // console.log('body', body.byteOffset, body.byteLength)
      // console.log('mr', json.messageId, json.inReplyTo, json.references)
  
      // console.log('email', json)
  
      // So emails have a few different 'id'-like properties:
      // - There's the json.blobId, which is always guaranteed to be on the
      //   message from cyrus. This is a content-addressable SHA1 hash of the
      //   content.
      // - In mbox files from gmail, mboxFromAddress.split('@')[0] contains the
      //   gmail ID of the email object, which you can use to cross-reference the
      //   email in other parts of the gmail API
      // - Emails usually contain json.messageId[0] - which is a reference used to
      //   refer to the email when replying, for threading.
      const id = json.id = 'M' + json.blobId
      emailBytes.set(id, body)
  
      // Everything else is just pre-scanning and stuff...
  
      // TODO: This only works for gmail messages.
      // const threadId = json.threadId = 'TG' + json['header:X-GM-THRID:asText']
      // delete json['header:X-GM-THRID:asText']
  
      // const msgKeywords = json.keywords = {} as {[k: string]: true}
      // const msgMailboxes = json.mailboxes = {} as {[k: string]: true}
      
      const msgMailboxes: string[] = ['All']
  
      const gmailLabels = json['header:X-Gmail-Labels:asText']
      if (gmailLabels) {
        const labels = gmailLabels.split(',')
        // delete json['header:X-Gmail-Labels:asText']
    
        for (const k of labels) {
          msgMailboxes.push(k)
        }
      }
  
      // console.log(json)
  
      emails.set(id, json)
  
      threadGroup.add(id, json, msgMailboxes)
  
      if (emails.size % 20 === 0) {
        if (setProgress) setProgress('Indexing file ' + name, (progress + processedLength) / totalLength)
        await yieldUI()
      }
    }

    processedLength += buf.length
  }

  if (setProgress) setProgress('Threading messages', 0)
  await yieldUI()

  const threads = threadGroup.finalize(emails)

  if (setProgress) setProgress('Adding messages to mailboxes', 0)
  await yieldUI()

  const mailboxThreadSets = new Map<string, Set<string>>() // string -> set of thread ids

  for (const [tid, thread] of threads) {
    if (thread.hasAttachments) thread.mailboxes.push('Has attachments')
    for (const m of thread.mailboxes) {
      let mailbox = mailboxThreadSets.get(m)
      if (!mailbox) mailboxThreadSets.set(m, mailbox = new Set())
      mailbox.add(tid)
    }
  }

  const mailboxes = {} as {[k: string]: string[]}
  for (const [mailbox, threadIds] of mailboxThreadSets) {
    mailboxes[mailbox] = Array.from(threadIds)
      .sort((a, b) => {
        const ta = threads.get(a)!.lastDate
        const tb = threads.get(b)!.lastDate
        return tb - ta
      })
  }

  return {
    emailBytes,
    // emails,
    threads,
    mailboxes,
  }
}