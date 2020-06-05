<script>
let gotFile = false

let files = null

// export let state
export let process

let filePicker

// function onFileSet(e) {
//   console.log('got file')
//   gotFile = true
//   console.log('file', file)
// }

function submit(e) {
  console.log('submit')
  e.preventDefault()
  // state = 'processing'
  process(files)
}

</script>

<style>

#choose {
  margin: 2em;
  grid-area: content;
}

#choose h2 {
  margin-bottom: 0.3em;
}

#choose button {
  font-size: 150%;
  margin: 1em;
} 

#choose p {
  max-width: 800px;
}

p {
  line-height: 1.4;
}

button {
  border: 0;
  padding: 1em 2em;
}

button:not(:disabled) {
  background-color: #F9C22E;
}
button:not(:disabled):hover {
  background-color: #ecae06;
}
button:not(:disabled).softDisable {
  background-color: #eee;
}
button:disabled {
  /* color: red; */
  
  background-color: #eee;
  color: #888;
}

input[type=file] {
  margin: 1em 1em;
}

</style>

<form on:submit={submit} id="choose">

  <label for="mboxfile">
    <h2>Choose files to load</h2>
    <p>
      You can use any mbox files, or individually saved email files. But that said, I've mostly only tested with email exported from google takeout.
      <a href="https://github.com/josephg/mbox-viewer/blob/master/README.md">Learn more about this mail viewer and file issues here!</a>
    </p>
  </label>
  <input
    type="file"
    bind:this={filePicker}
    id="mboxfile"
    accept=".mbox,.eml,.msg,.txt,application/mbox,message/rfc822"
    multiple
    bind:files
  >
    <!-- on:change={onFileSet} -->

  <div>
    <button on:click={e => { filePicker.click(); e.preventDefault()}} class:softDisable={files != null}>
      1. Select files (eml or mbox)
    </button>
    <button disabled={files == null}>
      2. Open 'er up!
    </button>
  </div>
</form>
