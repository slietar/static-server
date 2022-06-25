// await new Promise(())
import * as idbKeyval from 'https://cdn.skypack.dev/idb-keyval';

await navigator.serviceWorker.register('/service-worker.js', { type: 'module' });

let handle = await idbKeyval.get('handle');

if (!handle || ((await handle.queryPermission()) !== 'granted')) {
  await new Promise((resolve) => {
    document.querySelector('button').addEventListener('click', () => {
      resolve();
    });
  });

  await handle.requestPermission();
}

if (!handle) {
  handle = await window.showDirectoryPicker();
  await idbKeyval.set('handle', handle);
}

window.handle = handle;
console.log(handle);
