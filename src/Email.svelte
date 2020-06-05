<script>
import {onMount, onDestroy} from 'svelte'
import {drawHTML} from './sandboxhtml'
import mod from 'mime-to-jmap'

// export let message
export let raw

console.log('raw', raw)
// Marking it as message/rfc822 downloads the file .. is that what we want?
// let rawMessageBlob = new Blob([raw], {type: 'message/rfc822'})
let rawMessageBlob = new Blob([raw], {type: 'text/plain'})
let rawMessageURL = URL.createObjectURL(rawMessageBlob)

// Get message attachments... and maybe the message itself?
const {
  json: message,
  attachments: attachmentData
} = mod.envelope_to_jmap(raw, {with_attachments: true})
console.log('attachments', attachmentData)

console.log('rendering message', message)

const attachments = []
const urlForCid = {}
const showTypes = new Set([
  'image/gif',
  'image/png',
  'image/jpeg',
  'text/plain',
  'text/html',
])
for (const {name, blobId, type, cid} of message.attachments) {
  const data = attachmentData[blobId]
  console.log('attachment', name, blobId, type, data.byteLength)
  const url = URL.createObjectURL(new Blob([data], {type: type}))
  attachments.push({name: name || blobId, type, url})
  if (cid != null) urlForCid[cid] = url
}

onDestroy(() => {
  URL.revokeObjectURL(rawMessageURL)
  for (const {url} of attachments) {
    // console.log('revoke', url)
    URL.revokeObjectURL(url)
  }
})

let bodyContainer

let bodyObj = message.htmlBody[0]
let bodyData = message.bodyValues[bodyObj.partId].value

onMount(() => {
  if (bodyObj.type === 'text/html') {
    let html = drawHTML(bodyData, urlForCid)
    // console.log('htmlBody', message.htmlBody[0], message.bodyValues[message.htmlBody[0].partId])

    // Wire up inline images
    const images = html.getElementsByTagName('img')
    for (const img of images) {
      const src = img.src
      if (src.startsWith('cid:')) {
        const cid = src.slice('cid:'.length)
        img.src = urlForCid[cid]
      }
    }

    bodyContainer.appendChild(html);
  }
});

</script>

<style>

.email {
  margin: 2em 1em;
  max-width: 800px;
  background-color: #eee;
}

.info {
  background-color: rgb(216, 216, 216);
  border-bottom: 1px solid black;
  margin-bottom: 1em;
  padding: 0.2em 1em;
}

.body {
  line-height: 1.3;
  padding: 0.5em;
}

</style>

<div class="email">
  <div class="info">
    <h2 class="subject">{message.subject}</h2>
    <!-- {message.preview} -->
    <div>From: 
      {#each message.from as from}
        <span>{from.name}</span> <a href={'mailto:' + from.email}>{from.email}</a>
      {/each}
    </div>
    <!-- <div>From: {message.from.map(f => f.name || f.email).join(', ')}</div> -->
    <div>Sent at: {(new Date(message.sentAt)).toLocaleString()}</div>
    
    <div>
      {#each attachments as att}
        {#if showTypes.has(att.type)}
          <a href={att.url} target="_blank">{att.name}</a>
        {:else}
          <a href={att.url} download={att.name}>{att.name}</a>
        {/if}
        
      {/each}
    </div>

    <a href={rawMessageURL} target="_blank">View raw message</a>
  </div>

  <div class="body" bind:this={bodyContainer}>
    {#if bodyObj.type !== 'text/html'}
      <pre>{bodyData}</pre>
    {/if}
  </div>
  <!-- </pre> -->
</div>

