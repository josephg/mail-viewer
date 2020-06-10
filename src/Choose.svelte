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

p {
  margin: 1em 1em;
}

input[type=file] {
  display: block;
  margin: 1em 1em;
}

</style>

<form on:submit={submit} id="choose">

  <h2>Choose files to load</h2>
  <p>
    Open mbox files, or load individual emails. You can add multiple files.
  </p>
  <p>
    Your email is processed in your web browser. Your data never leaves your computer.
  </p>
  <p>
    <a href="https://github.com/josephg/mbox-viewer/blob/master/README.md">Please file issues here if you run into problems!</a>
  </p>
  <div>
    <button on:click={e => { filePicker.click(); e.preventDefault()}} class:softDisable={files != null}>
      1. Select files (eml or mbox)
    </button>
    <button disabled={files == null}>
      2. Open 'er up!
    </button>

    <input
      type="file"
      bind:this={filePicker}
      id="mboxfile"
      accept=".mbox,.eml,.msg,.txt,application/mbox,message/rfc822"
      multiple
      bind:files
    >
  </div>
</form>
