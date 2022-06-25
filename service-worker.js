import * as idbKeyval from 'https://cdn.skypack.dev/idb-keyval';

const store = idbKeyval.createStore('_static-server', 'store');


self.addEventListener('fetch', function (event) {
  let url = new URL(event.request.url);
  let referrer = event.request.referrer && new URL(event.request.referrer);

  if (url.origin === 'https://cdn.skypack.dev') {
    event.respondWith(
      caches.open('skypack').then(function (cache) {
        return cache.match(event.request).then(function (response) {
          return (
            response ||
            fetch(event.request).then(function (response) {
              cache.put(event.request, response.clone());
              return response;
            })
          );
        });
      }),
    );
  } else if (url.origin === location.origin) {
    // console.log(referrer?.pathname + ' [requests] ' + url.pathname);
    const configurePrefix = '/.configure';

    if (url.pathname.startsWith(configurePrefix)) {
      event.respondWith(fetch(url.pathname.substring(configurePrefix.length) || '/'));
    } else if ((referrer?.pathname === configurePrefix) && (url.pathname !== '/')) { // <-- tmp
      event.respondWith(fetch(url.pathname));
    } else {
      let response = (async () => {
        let config = await idbKeyval.get('config', store);

        if (!config) {
          return Response.redirect(configurePrefix, 302);
        }

        if ((await config.handle.queryPermission()) !== 'granted') {
          // console.log('Not granted');
          return Response.redirect(configurePrefix, 302);
        }

        let segments = decodeURI(url.pathname).split('/').filter((segment) => segment.length > 0);
        let targetHandle = (await findFileHandle(config.handle, segments)) ?? (await findFileHandle(config.handle, [...segments, 'index.html']));

        if (!targetHandle || (targetHandle.kind !== 'file')) {
          return new Response(`File at ${url.pathname} not found`, { status: 404, statusText: 'Not Found' });
        }

        let file = await targetHandle.getFile();
        return new Response(file);
      })();

      event.respondWith(response);
    }
  }
});


async function findFileHandle(handle, path) {
  if (path.length < 1) {
    return (handle.kind === 'file')
      ? handle
      : null;
  }

  if (handle.kind !== 'directory') {
    return null;
  }

  for await (const entry of handle.values()) {
    if (entry.name === path[0]) {
      return await findFileHandle(entry, path.slice(1));
    }
  }

  return null;
}
