import mod from 'mime-to-jmap'

const parseOpts = {
  fetchHTMLBodyValues: true,
  want_headers: [
    'header:X-Gmail-Labels:asText',
    'header:X-GM-THRID:asText',
  ]
}
const gmailToJMAPKeywords: {[k: string]: string} = {
  Important: '$important',
  Starred: '$flagged',
}

interface Thread {
  messages: string[]
  participants: string[]
  subject: string
  preview: string
  hasAttachments: boolean
  lastDate: number // Date of most recent email
}

export async function scanEmails(buf: ArrayBuffer, setProgress?: (p: number) => void) {
  await mod.ready
  console.log('mod', mod)

  let emailBytes = new Map<string, Uint8Array>() // Raw bytes for message
  let emails = new Map<string, any>() // map from ID => JSON
  let threads = new Map<string, Thread>()
  // let emailsForThread = new Map() // map from thread ID => sorted list of email IDs
  const mailboxThreads = {} as {[k: string]: Set<string>} // string -> set of thread ids

  for await (const {msg, progress} of mod.mbox_each_progress([new Uint8Array(buf)])) {
    // console.log('msg', msg, 'progress', progress)
    const {body, mboxFromAddress, receivedAt} = mod.mbox_to_eml(msg, true)

    // TODO: Restrict this to get way fewer fields
    const {json} = mod.envelope_to_jmap(body, parseOpts)
    // console.log('body', body.byteOffset, body.byteLength)
    const id = json.id = 'M' + json.blobId //'MG' + mboxFromAddress.split('@')[0]
    emailBytes.set(id, body)

    // Everything else is just pre-scanning and stuff...

    // TODO: This only works for gmail messages.
    const threadId = json.threadId = 'TG' + json['header:X-GM-THRID:asText']
    delete json['header:X-GM-THRID:asText']
    json.receivedAt = receivedAt

    const msgKeywords = json.keywords = {} as {[k: string]: true}
    const msgMailboxes = json.mailboxes = {} as {[k: string]: true}
    
    const labels = json['header:X-Gmail-Labels:asText'].split(',')
    delete json['header:X-Gmail-Labels:asText']
    let seen = true
    for (const k of labels) {
      // Handle unread state below, since its inverted.
      if (k === 'Unread') seen = false
      else { 
        const keyword = gmailToJMAPKeywords[k]
        if (keyword) msgKeywords[keyword] = true
        else msgMailboxes[k] = true
      }
    }
    if (seen) msgKeywords['$seen'] = seen

    // console.log(json)

    emails.set(id, json)

    // console.log('mailboxes', msgMailboxes, 'msgKeywords', msgKeywords)
    let thread = threads.get(threadId)
    if (thread == null) {
      threads.set(threadId, thread = {
        subject: '', // Filled in with the subject of the first message
        preview: json.preview,
        participants: [],
        messages: [],
        hasAttachments: false,
        lastDate: 0,
      })
    }
    thread.messages.push(id)
    if (Object.keys(json.attachments).length) thread.hasAttachments = true
    thread.lastDate = Math.max(thread.lastDate, +new Date(json.receivedAt || json.sentAt))

    // TODO: Participants

    for (const k in msgMailboxes) {
      let m = mailboxThreads[k]
      if (m == null) mailboxThreads[k] = m = new Set()
      m.add(threadId)
    }

    if (setProgress) setProgress(progress / buf.byteLength)

    await new Promise(resolve => {setTimeout(resolve, 0)})
  }

  // Sort all the messages in each thread
  for (const [id, thread] of threads) {
    thread.messages.sort((a, b) => {
      const ma = emails.get(a)
      const mb = emails.get(b)
      const da = new Date(ma.sentAt || ma.receivedAt)
      const db = new Date(mb.sentAt || mb.receivedAt)

      return (da < db) ? -1
        : (da == db) ? 0
        : 1
    })

    const firstMessage = emails.get(thread.messages[0])
    thread.subject = firstMessage.subject
    if (firstMessage.preview != null) thread.preview = firstMessage.preview

    const participantSet = new Set<string>()
    // debugger
    for (const mid of thread.messages) {
      const from = emails.get(mid).from[0]
      if (from) participantSet.add(from.name || from.email)
    }
    thread.participants = Array.from(participantSet)
  }

  return {
    emailBytes,
    // emails,
    threads,
    mailboxThreads
  }
}