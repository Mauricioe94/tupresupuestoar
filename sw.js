// sw.js - Service Worker Corregido y Mejorado para Desarrollo
const CACHE_NAME = 'tupresupuestoar-dev-v2'; // Incrementamos versión por cambios
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './img/logo-pintura.png',
  './manifest.json',       // Agregado: importante para PWA
  './style.css',           // Agregado: por si hay estilos en raíz
  './clear-cache.html'     // Agregado: página de utilidad
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando versión v2...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando archivos:', urlsToCache);
        return cache.addAll(urlsToCache).catch(error => {
          console.warn('[Service Worker] Error cacheando algunos archivos:', error);
          // Continuamos aunque falle algún archivo - no rechazamos la instalación
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[Service Worker] Instalación completada');
        // Fuerza la activación inmediata
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Error en instalación:', error);
        // Aún así permitimos que el SW se instale
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando versión v2...');
  
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
    })
    .then(() => {
      console.log('[Service Worker] Cache limpiado');
      // Toma el control de todas las pestañas
      return self.clients.claim();
    })
    .then(() => {
      // Notificar a las pestañas abiertas sobre la actualización
      return self.clients.matchAll();
    })
    .then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_UPDATED',
          message: 'Nueva versión disponible',
          version: 'v2',
          timestamp: new Date().toISOString()
        });
      });
      console.log('[Service Worker] Notificación enviada a clientes');
    })
    .catch(error => {
      console.error('[Service Worker] Error en activación:', error);
    })
  );
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
  // Solo manejamos peticiones GET
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Estrategias diferentes según el tipo de recurso
  
  // 1. Para desarrollo: priorizamos la red sobre el cache (estrategia Network First)
  if (url.origin === self.location.origin) {
    // Recursos locales
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Solo cacheamos respuestas exitosas (200-299)
          if (response.ok) {
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
            .then(response => {
              if (response) {
                console.log('[Service Worker] Sirviendo desde cache:', event.request.url);
                return response;
              }
              // Si no está en cache, página offline genérica
              return caches.match('./index.html');
            });
        })
    );
  } else {
    // 2. Para recursos externos (no los cacheamos en desarrollo)
    // Puedes implementar estrategias diferentes aquí si lo necesitas
    return;
  }
});

// Manejo de mensajes desde la aplicación
self.addEventListener('message', event => {
  console.log('[Service Worker] Mensaje recibido:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME)
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;
      
    case 'GET_CACHE_INFO':
      caches.open(CACHE_NAME)
        .then(cache => cache.keys())
        .then(keys => {
          event.ports[0].postMessage({ 
            cacheName: CACHE_NAME,
            cachedItems: keys.length,
            urls: keys.map(req => req.url)
          });
        });
      break;
  }
});

// Manejo de sync (para futuras funcionalidades)
self.addEventListener('sync', event => {
  console.log('[Service Worker] Sync event:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Aquí puedes implementar sincronización de datos
      Promise.resolve().then(() => {
        console.log('[Service Worker] Sincronización completada');
      })
    );
  }
});

// Manejo de push notifications (para futuras funcionalidades)
self.addEventListener('push', event => {
  console.log('[Service Worker] Push notification recibida');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva actualización disponible',
    icon: './img/logo-pintura.png',
    badge: './img/logo-pintura.png',
    vibrate: [200, 100, 200],
    data: {
      url: self.location.origin
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('TuPresupuestoAR', options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notificación clickeada');
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Si ya hay una ventana abierta, la enfocamos
      for (let client of windowClients) {
        if (client.url === self.location.origin && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrimos una nueva
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin);
      }
    })
  );
});