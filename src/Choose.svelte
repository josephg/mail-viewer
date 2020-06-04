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
  process(files[0])
}

</script>

<form on:submit={submit}>

  <label for="mboxfile">
    <div>Choose an mbox file to load</div>
  </label>
  <input
    type="file"
    id="mboxfile"
    accept="application/mbox,.mbox"
    bind:files
  >
    <!-- on:change={onFileSet} -->

  <div>
    <button disabled={files == null}>
      Open 'er up!
    </button>
  </div>
</form>
