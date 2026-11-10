const CACHE_NAME = 'customization-v2';
const PRECACHE_ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  // Never intercept API or auth endpoints in Service Worker
  if (
    event.request.method !== 'GET' ||
    !event.request.url.startsWith('http') ||
    event.request.url.includes('/api/')
  ) {
    return;
  }

  // Network-first strategy
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (event.request.mode === 'navigate') {
          const indexFallback = await caches.match('/index.html');
          if (indexFallback) return indexFallback;
          return caches.match('/');
        }
      }),
  );
});
