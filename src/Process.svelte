<script>

export let loadState
export let progress

</script>

<div>
  Processing...
</div>
<div>
  <label for="progress">{loadState}:</label>
  <progress id="progress" max="100" value={progress}></progress>
  {Math.round(progress * 10)/10} % complete
</div>