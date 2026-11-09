const CACHE_NAME = 'ah-parrilla-offline-v6';
const ARCHIVOS_ESENCIALES = ['./','./index.html','./styles.css','./script.js','./portada-ah-parrilla.png','./imagenes/desayunos.png','./imagenes/almuerzos.png','./imagenes/platos_fuertes.png','./imagenes/sopas.jpg','./imagenes/jugos.jpg','./imagenes/bebidas.jpg'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(ARCHIVOS_ESENCIALES.map(async archivo => {
      try {
        const respuesta = await fetch(archivo, { cache: 'no-cache' });
        if (respuesta.ok) await cache.put(archivo, respuesta);
      } catch (error) { /* Se conserva la posibilidad de instalar sin recursos opcionales. */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres
      .filter(nombre => nombre.startsWith('ah-parrilla-offline-') && nombre !== CACHE_NAME)
      .map(nombre => caches.delete(nombre)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const solicitud = event.request;
  if (solicitud.method !== 'GET') return;

  const url = new URL(solicitud.url);
  if (url.origin !== self.location.origin) return;

  // La landing de enlaces siempre se entrega directamente desde GitHub Pages.
  if (url.pathname.includes('/enlaces/')) return;

  // Estrategia: primero red para que el celular reciba los cambios publicados;
  // si no hay conexión, se utiliza la copia guardada para modo sin conexión.
  event.respondWith((async () => {
    try {
      const respuesta = await fetch(solicitud, { cache: 'no-cache' });
      if (respuesta && respuesta.ok) {
        const cache = await caches.open(CACHE_NAME);
        const destino = solicitud.mode === 'navigate' ? './index.html' : solicitud;
        await cache.put(destino, respuesta.clone());
      }
      return respuesta;
    } catch (error) {
      const guardada = await caches.match(solicitud, { ignoreSearch: true });
      if (guardada) return guardada;
      if (solicitud.mode === 'navigate') {
        return (await caches.match('./index.html')) || Response.error();
      }
      return Response.error();
    }
  })());
});
