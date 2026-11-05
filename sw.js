const CACHE_NAME = 'ah-parrilla-offline-v4';
const ARCHIVOS_ESENCIALES = ['./','./index.html','./styles.css','./script.js','./portada-ah-parrilla.png','./imagenes/desayunos.png','./imagenes/almuerzos.png','./imagenes/platos_fuertes.png','./imagenes/sopas.jpg','./imagenes/jugos.jpg','./imagenes/bebidas.jpg'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(ARCHIVOS_ESENCIALES.map(async archivo => { try { await cache.add(archivo); } catch (error) { /* Recurso opcional no disponible. */ } }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres.filter(nombre => nombre.startsWith('ah-parrilla-offline-') && nombre !== CACHE_NAME).map(nombre => caches.delete(nombre)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const solicitud = event.request;
  if (solicitud.method !== 'GET') return;
  const url = new URL(solicitud.url);
  if (url.origin !== self.location.origin) return;
  if (solicitud.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const respuesta = await fetch(solicitud);
        const cache = await caches.open(CACHE_NAME);
        await cache.put('./index.html', respuesta.clone());
        return respuesta;
      } catch (error) { return (await caches.match('./index.html')) || Response.error(); }
    })());
    return;
  }
  event.respondWith((async () => {
    const esCodigo = url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
    if (esCodigo) {
      try {
        const respuesta = await fetch(solicitud, { cache: 'no-cache' });
        if (respuesta.ok) { const cache = await caches.open(CACHE_NAME); await cache.put(solicitud, respuesta.clone()); }
        return respuesta;
      } catch (error) {
        return (await caches.match(solicitud, { ignoreSearch: true })) || Response.error();
      }
    }
    const guardada = await caches.match(solicitud, { ignoreSearch: true });
    if (guardada) return guardada;
    try {
      const respuesta = await fetch(solicitud);
      if (respuesta.ok) { const cache = await caches.open(CACHE_NAME); await cache.put(solicitud, respuesta.clone()); }
      return respuesta;
    } catch (error) { return Response.error(); }
  })());
});
