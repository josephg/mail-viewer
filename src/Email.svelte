<script>
import {onMount} from 'svelte'
import {drawHTML} from './sandboxhtml'

export let message

let bodyContainer

let bodyObj = message.htmlBody[0]
let bodyData = message.bodyValues[bodyObj.partId].value

onMount(() => {
  if (bodyObj.type === 'text/html') {
    let html = drawHTML(bodyData)
    console.log('htmlBody', message.htmlBody[0], message.bodyValues[message.htmlBody[0].partId])
    bodyContainer.appendChild(html);
  }
});

</script>

<style>

.email {
  margin-top: 2em;
  margin-bottom: 2em;
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
}

</style>

<div class="email">
  <div class="info">
    <h2 class="subject">{message.subject}</h2>
    <!-- {message.preview} -->
    <div>From: {message.from.map(f => f.name || f.email).join(', ')}</div>
    <div>Sent at: {message.sentAt}</div>
  </div>

  <div class="body" bind:this={bodyContainer}>
    {#if bodyObj.type !== 'text/html'}
      <pre>{bodyData}</pre>
    {/if}
  </div>
  <!-- </pre> -->
</div>

