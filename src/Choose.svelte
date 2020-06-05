<script>
let gotFile = false

let files = null

// export let state
export let process

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

</style>

<form on:submit={submit} id="choose">

  <label for="mboxfile">
    <h2>Choose files to load</h2>
    <p>
      You can use any mbox files, or individually saved email files. But that said, I've mostly only tested with email exported from google takeout. Please file an issue if you run into trouble!
    </p>
  </label>
  <input
    type="file"
    id="mboxfile"
    accept=".mbox,.eml,.msg,.txt,application/mbox,message/rfc822"
    multiple
    bind:files
  >
    <!-- on:change={onFileSet} -->

  <div>
    <button disabled={files == null}>
      Open 'er up!
    </button>
  </div>
</form>
