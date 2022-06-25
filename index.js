import * as idbKeyval from 'https://cdn.skypack.dev/idb-keyval';

await navigator.serviceWorker.register('/service-worker.js', { type: 'module' });


const configurePrefix = '/.configure';

if (![configurePrefix, configurePrefix + '/'].includes(location.pathname)) {
  location.replace(configurePrefix);
}


const store = idbKeyval.createStore('_static-server', 'store');

let button = document.querySelector('button');
let pre = document.querySelector('pre');


let writeConfig = async () => {
  let config = await idbKeyval.get('config', store);
  let granted = (await config?.handle.queryPermission()) === 'granted';

  pre.innerText = `Configuration: ${config ? 'active' : 'none'}` + (config ? `\nPermission: ${granted ? 'granted' : 'denied'}` : '');
};

await writeConfig();


button.addEventListener('click', () => {
  (async () => {
    let handle = await window.showDirectoryPicker();
    await idbKeyval.set('config', { handle }, store);
    await writeConfig();

    location.replace('/');
  })();
});
