/* Service worker: riceve il PDF condiviso (da WhatsApp, su Android) e lo passa alla pagina */
const CACHE = 'turni-shell-v1';
const SHARED = 'turni-shared';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(['./', './index.html', './manifest.webmanifest', './icon-192.png']))
      .catch(() => { })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);

  if (req.method === 'POST' && url.pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      try {
        const fd = await req.formData();
        const f = fd.get('pdf');
        if (f && typeof f === 'object' && f.size) {
          const c = await caches.open(SHARED);
          await c.put('shared-pdf', new Response(f, {
            headers: { 'Content-Type': 'application/pdf', 'X-Nome': encodeURIComponent(f.name || 'turni.pdf') }
          }));
        }
      } catch (err) { /* la pagina mostrerà il messaggio di errore */ }
      return Response.redirect(new URL('./?condiviso=1', self.registration.scope).href, 303);
    })());
    return;
  }

  if (req.method === 'GET' && url.origin === location.origin) {
    e.respondWith(fetch(req).catch(() => caches.match(req, { ignoreSearch: true })));
  }
});
