const CACHE_NAME = 'geotracker-v1';
const STATIC_ASSETS = [
  '/',
  '/login/',
  '/dashboard/',
  '/favicon.ico',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Failed to cache some assets during install:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy for API calls and dynamic content
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external API requests using hostname checks
  try {
    const url = new URL(event.request.url);
    const hostname = url.hostname;
    if (
      hostname.endsWith('.firebaseapp.com') ||
      hostname.endsWith('.googleapis.com') ||
      hostname === 'api.ipify.org'
    ) {
      return;
    }
  } catch {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request).then((cached) => {
          return cached || new Response('Offline', { status: 503 });
        });
      })
  );
});
