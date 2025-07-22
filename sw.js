const CACHE_NAME = '12-week-goals-v1';
const urlsToCache = [
  '/12-week-goals-pwa/',
  '/12-week-goals-pwa/index.html',
  '/12-week-goals-pwa/styles.css',
  '/12-week-goals-pwa/app.js',
  '/12-week-goals-pwa/manifest.json',
  '/12-week-goals-pwa/icons/icon.svg',
  '/12-week-goals-pwa/icons/icon-192x192.svg',
  '/12-week-goals-pwa/icons/icon-512x512.svg'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devolver desde cache si existe
        if (response) {
          return response;
        }

        // Si no está en cache, hacer fetch
        return fetch(event.request).then(
          (response) => {
            // Solo cachear respuestas válidas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar respuesta para cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Actualizar Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
