// sw.js - Service Worker Corregido para Desarrollo
const CACHE_NAME = 'tupresupuestoar-dev-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './img/logo-pintura.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando archivos:', urlsToCache);
        return cache.addAll(urlsToCache).catch(error => {
          console.warn('[Service Worker] Error cacheando algunos archivos:', error);
          // Continuamos aunque falle algún archivo
        });
      })
      .then(() => {
        // Fuerza la activación inmediata
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Toma el control de todas las pestañas
      return self.clients.claim();
    })
  );
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
  // Solo manejamos peticiones GET
  if (event.request.method !== 'GET') return;
  
  // Excluimos algunas peticiones del cache
  const url = new URL(event.request.url);
  
  // No cacheamos peticiones a APIs externas
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Para desarrollo, priorizamos la red sobre el cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Solo cacheamos respuestas exitosas
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentamos servir del cache
        return caches.match(event.request)
          .then(response => response || new Response('Offline'));
      })
  );
});