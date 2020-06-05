import App from './App.svelte'
import * as mod from 'mime-to-jmap'

;(async () => {
  console.log(mod)
  await mod.ready
  console.log('wasm loaded')
})()

console.log('document body is', document.body)

var app = new App({
  target: document.body,
});

export default app;
