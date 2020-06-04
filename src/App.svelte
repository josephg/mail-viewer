<script>

import Process from './Process.svelte'
import Choose from './Choose.svelte'
import Inbox from './Inbox.svelte'
import {scanEmails} from './processMail'

// State is one of 'choose', 'processing', 'list', 'message'.
let state = 'choose'

let uiProgress = 0
let loadState = null

let data = null

function process(file) {
  // const r = file.stream()

  // ;(async () => {
  //   for await (const blob of r) {
      
  //   }
  // })()

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

async function parseEmails(buf) {
  loadState = 'Parsing emails'
  uiProgress = 0

  //.....
  data = await scanEmails(buf, p => {uiProgress = p * 100})

  state = 'list'

  // data = {
  //   emails,
  //   emailsForThread,
  //   mailboxThreads
  // }

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