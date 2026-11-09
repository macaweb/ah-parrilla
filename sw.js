// Se desactiva el Service Worker para evitar que los celulares sigan mostrando
// versiones antiguas de la carta. El sitio se servirá directamente desde GitHub Pages.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres.map(nombre => caches.delete(nombre)));
    await self.registration.unregister();
    await self.clients.claim();
  })());
});
