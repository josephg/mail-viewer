<script>

import Process from './Process.svelte'
import Choose from './Choose.svelte'
import Inbox from './Inbox.svelte'
import {scanEmails} from './processMail'

// State is one of 'choose', 'processing', 'list', 'message'.
let state = 'choose'


let loadState = null
let loadProgress = 0

let data = null

function getBuf(file) {
  return new Promise((resolve, reject) => {
    console.log('process', file)
    loadProgress = 0


    loadState = `Reading file ${file.name}`

    const reader = new FileReader()
    reader.onabort = () => { console.log('aborted') }
    reader.onerror = (e) => {
      console.error('error:', e)
      reject(e)
    }
    reader.onload = e => {
      // console.log('buffer', reader.result)
      resolve({buf: reader.result, name: file.name, lastModified: file.lastModified})
    }
    reader.onprogress = e => {
      // console.log('loadProgress', e.loaded)
      loadProgress = e.loaded / file.size * 100
    }

    reader.readAsArrayBuffer(file)
  })
}

async function process(files) {
  state = 'processing'

  // I could use Promise.all here but I want to load the files into memory one at a time.
  const bufs = [] // list of {buf, name, lastModified}
  for (const f of files) bufs.push(await getBuf(f))
  // const buf = await getBuf(file)

  loadState = 'Parsing emails'
  loadProgress = 0

  //.....
  data = await scanEmails(bufs, (m, p) => {
    loadState = m
    loadProgress = p * 100
  })

  state = 'list'

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

#another {
  height: 25px;
  margin: 5px 1em;
}

.ghlink {
  /* display: inline-block; */
  float: right;
  color: #F9C22E;
  margin: auto 1em;
  height: 100%;
}

.ghlink > a {
  text-decoration: none;
  vertical-align: middle;
  vertical-align: -moz-middle-with-baseline;
  color: white;
}
.ghlink > a:visited {
  color: #F9C22E;
}
.ghlink > a:hover {
  text-decoration: underline;
}

</style>

<div class="container">
  <div class="header">
    {#if state !== 'choose'}
      <button id="another" on:click={() => {
        state = 'choose'
        data = null
        loadProgress = 0
      }}>&lt; Open another</button>
    {/if}

    <span class="ghlink"><a href="https://github.com/josephg/mbox-viewer">View on Github</a></span>
  </div>

  {#if state === 'choose'}
    <Choose process={process} />
  {:else if state === 'processing'}
    <Process {loadState} progress={loadProgress} />
  {:else if state === 'list' || state === 'message'}
    <Inbox {data} />
  {:else}
    Invalid state {state}
  {/if}
</div>