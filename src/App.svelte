<script>

import Process from './Process.svelte'
import Choose from './Choose.svelte'
import Inbox from './Inbox.svelte'

import mod from 'mime-to-jmap'


// State is one of 'choose', 'processing', 'list', 'message'.
let state = 'choose'

let uiProgress = 0
let loadState = null

let data = null

function process(file) {
  console.log('process', file)
  uiProgress = 0
  state = 'processing'

  loadState = 'Reading file'

  const reader = new FileReader()
  reader.onabort = () => { console.log('aborted') }
  reader.onerror = (e) => { console.error('error:', e) }
  reader.onload = e => {
    console.log('buffer', reader.result)
    parseEmails(reader.result)
  }
  reader.onprogress = e => {
    // console.log('uiProgress', e.loaded)
    uiProgress = e.loaded / file.size * 100
  }

  reader.readAsArrayBuffer(file)

}

const parseOpts = {
  fetchHTMLBodyValues: true,
  want_headers: [
    'header:X-Gmail-Labels:asText',
    'header:X-GM-THRID:asText',
  ]
}
const gmailToJMAPKeywords = {
  Important: '$important',
  Starred: '$flagged',
}

async function parseEmails(buf) {
  loadState = 'Parsing emails'
  uiProgress = 0
  await mod.ready
  console.log('mod', mod)

  let emails = new Map() // map from ID => JSON
  let emailsForThread = new Map() // map from thread ID => sorted list of email IDs
  const mailboxThreads = {} // string -> set of thread ids

  for await (const {msg, progress} of mod.mbox_each_progress([new Uint8Array(buf)])) {
    // console.log('msg', msg, 'progress', progress)
    const {body, mboxFromAddress, receivedAt} = mod.mbox_to_eml(msg)
    const {json} = mod.envelope_to_jmap(body, parseOpts)
    const id = json.id = 'MG' + mboxFromAddress.split('@')[0]
    const threadId = json.threadId = 'TG' + json['header:X-GM-THRID:asText']
    delete json['header:X-GM-THRID:asText']
    json.receivedAt = receivedAt

    const msgKeywords = json.keywords = {}// as {[k: string]: true}
    const msgMailboxes = json.mailboxes = {}// as {[k: string]: true}
    
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

    console.log(json)


    emails.set(id, json)

    console.log('mailboxes', msgMailboxes, 'msgKeywords', msgKeywords)
    let thread = emailsForThread.get(threadId)
    if (thread == null) {
      emailsForThread.set(threadId, thread = [])
    }
    thread.push(id)

    for (const k in msgMailboxes) {
      let m = mailboxThreads[k]
      if (m == null) mailboxThreads[k] = m = new Set()
      m.add(threadId)
    }

    uiProgress = progress / buf.byteLength * 100
    await new Promise(resolve => {setTimeout(resolve, 0)})
  }

  state = 'list'

  data = {
    emails,
    emailsForThread,
    mailboxThreads
  }

}


</script>

<style>

.container {
  display: grid;
  grid: "header header" 40px "sidebar content" 1fr
    / minmax(200px, 20%) 1fr;

  width: 100%;
  height: 100%;
}

.header {
  grid-area: header;
  background-color: #0C090D;
  border-bottom: 4px solid #F9C22E;
}

</style>

<div class="container">
  <div class="header">
    {#if state !== 'choose'}
      <button on:click={() => {
        state = 'choose'
        data = null
        uiProgress = 0
      }}>Open another mbox file</button>
    {/if}
  </div>

  {#if state === 'choose'}
    <Choose process={process} />
  {:else if state === 'processing'}
    <Process {loadState} progress={uiProgress} />
  {:else if state === 'list' || state === 'message'}
    <Inbox {data} />
  {:else}
  Invalid state {state}
  {/if}
</div>