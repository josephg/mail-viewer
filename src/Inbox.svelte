<script>

import EmailListItem from './EmailListItem.svelte'
import Email from './Email.svelte'

// export const mailboxes = [
//   'Inbox',

// ]

export let data

const sortOrder = {
  All: 1,
  Inbox: 2,
  Unread: 3,
  Sent: 4,
  Archived: 5,
  Spam: 6,
  'Has attachments': 10,
  'Category Promotions': 100,
  'Category Updates': 100,
  'Category Forums': 100,
  'Category Social': 100,
}

let mailboxes = Object.keys(data.mailboxes).sort((a, b) => (sortOrder[a] || 50) - (sortOrder[b] || 50))

let activeMailbox = mailboxes[0] // string
let activeThreadId = null // string

if (data.threads.size === 1) activeThreadId = data.threads.keys().next().value

function selectMbox(e) {
  activeMailbox = e.target.dataset.name
  activeThreadId = null
}

</script>

<style>

/* palette

whiteish - #dceff4

Yellow - #F9C22E

black purple - #0C090D
light black purple - #5b4462
*/

.selectedMailboxLabel {
  background-color: #F9C22E;
  color: #0C090D;
}


#mailboxes {
  grid-area: sidebar;
  background-color: #0C090D;
  color: #dceff4;
  border-right: 10px solid #F9C22E;
  padding-top: 0.5em;
  overflow: scroll;
}

#mailboxes > * {
  padding: 0.5em 0 0.5em 1em;
  border-bottom: 1px solid #dceff4;
  cursor: pointer;
}
#mailboxes > *:not(.selectedMailboxLabel):hover {
  background-color: #5b4462;
  /* color: #0C090D; */
}

#content {
  grid-area: content;
  background-color: #53B3CB;
  color: #0C090D;
  overflow: scroll;
}

</style>

<div id="mailboxes">
  {#each mailboxes as mailbox}
    <div on:click={selectMbox} class:selectedMailboxLabel={activeMailbox === mailbox} data-name={mailbox}>{mailbox}</div>
  {/each}
</div>

<div id="content">
  {#if activeMailbox == null}
    Select a mailbox from the list on the left
  {:else if activeThreadId == null}
    {#each data.mailboxes[activeMailbox] as threadId (threadId)}
      <EmailListItem thread={data.threads.get(threadId)} onClick={() => {activeThreadId = threadId}} />
    {/each}
  {:else}
    <button on:click={() => {activeThreadId = null}}>Back</button>
    <div style="overflow: scroll;">
      {#each data.threads.get(activeThreadId).messages as mid}
        <Email raw={data.emailBytes.get(mid)} />
      {/each}
    </div>
  {/if}
</div>
