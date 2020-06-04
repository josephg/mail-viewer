<script>

export let thread // jmap json object
export let onClick

$: console.log('thread', thread)

// let from
// $: from = firstEmail.from
//   .map(f => f.name || f.email).join(', ')


</script>

<style>
.item {
  /* margin-top: 5px;
  margin-bottom: 5px; */
  background-color: #eee;
  border-bottom: 1px solid #aaa;
  cursor: pointer;

  height: 52px;
  padding: 3px 0;
}

.mailtop {
  font-weight: bolder;
  padding: 0 0.5em;
}

.from {
  display: inline-block;
  width: 25%;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 84%;
}

.subject {
  display: inline-block;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  width: 70%;
}

.preview {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 84%;
  font-weight: lighter;
  color: #5b4462;

  margin-top: 3px;
  padding: 0 1em;
}

</style>
<div class="item" on:click={onClick} >
  <div class="mailtop">
    <span class="from">{thread.participants.join(', ')}</span>
    <span class="subject">{thread.subject}</span>
  </div>
  <div class="preview">
    {#if thread.hasAttachments}
      📎
    {/if}
    {thread.preview || ''}
  </div>
</div>