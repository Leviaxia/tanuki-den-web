// Service Worker — Tanuki Den Image Cache
// Intercepts image requests and caches them indefinitely in the browser.
// This bypasses Supabase Storage's missing/short Cache-Control headers.

const CACHE_NAME = 'tanuki-img-v1';

// On install: take control immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// On activate: delete old caches, claim all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// On fetch: serve images from cache, fall back to network and cache the result
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET image requests (Supabase storage or local /assets/)
  if (request.method !== 'GET') return;
  if (request.destination !== 'image') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached; // ← serve from cache instantly

      try {
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone()); // ← store for next visit
        }
        return response;
      } catch {
        // Offline fallback — return empty 404
        return new Response('', { status: 404 });
      }
    })
  );
});
