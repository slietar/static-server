import * as idbKeyval from 'https://cdn.skypack.dev/idb-keyval';


self.addEventListener('fetch', function (event) {
  let url = new URL(event.request.url);

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
    console.log(event.request.referrer, 'requests', url.pathname);

    if (url.pathname.startsWith('/local')) {
      let response = (async () => {
        let handle = await idbKeyval.get('handle');
        let targetPath = url.pathname.slice(7);
        let targetHandle = await findHandle(handle, targetPath.split('/'));
        console.log(targetHandle);

        if (!targetHandle) {
          return new Response(`File at ${targetPath} not found`, { status: 404, statusText: 'Not Found' });
        }

        let file = await targetHandle.getFile();

        return new Response(file);

        // return new Response('<h1>Hello</h1>', {
        //   headers: {
        //     'Content-Type': 'text/html'
        //   }
        // });
      })();

      event.respondWith(response);
    }
  }
});


async function findHandle(handle, path) {
  if (path.length < 1) {
    return handle;
  }

  if (handle.kind !== 'directory') {
    return null;
  }

  for await (const entry of handle.values()) {
    if (entry.name === path[0]) {
      return await findHandle(entry, path.slice(1));
    }
  }

  return null;
}
