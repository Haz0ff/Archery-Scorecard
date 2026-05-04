const CACHE_NAME = 'archery-scorecard-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

/* Install Event - Cache Assets */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        /* Gracefully handle if some assets can't be cached */
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json'
        ]);
      });
    })
  );
  self.skipWaiting();
});

/* Activate Event - Clean Old Caches */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/* Fetch Event - Serve from Cache, Fall Back to Network */
self.addEventListener('fetch', event => {
  /* Skip non-GET requests */
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      /* Return cached response if available */
      if (response) {
        return response;
      }

      /* Try to fetch from network */
      return fetch(event.request).then(response => {
        /* Don't cache non-200 responses */
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        /* Clone the response before caching */
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        /* Return a fallback if both cache and network fail */
        return caches.match('/index.html');
      });
    })
  );
});
