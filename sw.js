// sw.js - Service Worker Corregido y Mejorado para Desarrollo
const CACHE_NAME = 'tupresupuestoar-dev-v3';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './js/app.js',
  './img/logo-pintura.png',
  './manifest.json',
  './clear-cache.html'
];

// =====================
// INSTALACIÓN
// =====================
self.addEventListener('install', event => {
  console.log('[SW] Instalando v3...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cacheando archivos principales');
        return cache.addAll(urlsToCache).catch(error => {
          console.warn('[SW] Error cacheando algunos archivos:', error);
          // Continuar incluso si falla algún archivo
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[SW] Instalación completada, saltando espera');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Error en instalación:', error);
      })
  );
});

// =====================
// ACTIVACIÓN
// =====================
self.addEventListener('activate', event => {
  console.log('[SW] Activando v3...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      console.log('[SW] Caches encontrados:', cacheNames);
      return Promise.all(
        cacheNames.map(cacheName => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[SW] Activación completada, tomando control');
      return self.clients.claim();
    })
    .catch(error => {
      console.error('[SW] Error en activación:', error);
    })
  );
});

// =====================
// FETCH (ESTRATEGIA: NETWORK FIRST CON FALLBACK A CACHE)
// =====================
self.addEventListener('fetch', event => {
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Solo manejar peticiones del mismo origen
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Si la respuesta es válida, actualizar cache
          if (response.ok || response.status === 0) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback al cache
          return caches.match(event.request)
            .then(response => {
              // Si no está en cache, servir index.html para rutas SPA
              if (response) {
                return response;
              }
              
              // Para rutas SPA, servir index.html
              if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
              }
              
              return new Response('Sin conexión', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
  }
  
  // Para recursos de terceros (CDNs), usar cache only si está disponible
  if (url.origin.includes('cdnjs.cloudflare.com') || 
      url.origin.includes('fonts.googleapis.com') ||
      url.origin.includes('fonts.gstatic.com')) {
    
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          // Si no está en cache, intentar obtenerlo de la red
          return fetch(event.request)
            .then(response => {
              // Si es exitoso, cachearlo para futuras visitas
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // Si falla la red y no está en cache, mostrar error
              return new Response('Recurso no disponible', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
  }
});

// =====================
// MENSAJES SIMPLIFICADOS
// =====================
self.addEventListener('message', event => {
  console.log('[SW] Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Saltando espera por mensaje');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'UPDATE_CACHE') {
    console.log('[SW] Actualizando cache manualmente');
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => {
          return cache.addAll(urlsToCache);
        })
        .then(() => {
          event.source.postMessage({
            type: 'CACHE_UPDATED',
            message: 'Cache actualizado correctamente'
          });
        })
    );
  }
});

// =====================
// BACKGROUND SYNC (OPCIONAL)
// =====================
self.addEventListener('sync', event => {
  if (event.tag === 'update-prices') {
    console.log('[SW] Sincronización en background solicitada');
    event.waitUntil(
      // Aquí iría la lógica para actualizar precios en background
      Promise.resolve()
    );
  }
});

// =====================
// PUSH NOTIFICATIONS (OPCIONAL)
// =====================
self.addEventListener('push', event => {
  console.log('[SW] Push recibido:', event);
  
  const options = {
    body: event.data ? event.data.text() : '¡Nuevas actualizaciones disponibles!',
    icon: './img/logo-pintura.png',
    badge: './img/logo-pintura.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver actualizaciones',
        icon: './img/icon-check.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: './img/icon-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('TuPresupuestoAR', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[SW] Notificación clickeada:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('https://tupresupuesto.ar')
    );
  }
});