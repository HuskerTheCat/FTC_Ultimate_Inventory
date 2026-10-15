// Website only: keeps the app's files on the device so it opens with no internet, e.g. at a competition venue.
// The team's data is kept offline by Firestore itself (see firebase.js).
// vite.config.js fills in the build's files and id, so each deploy gets a fresh cache.
const FILES = __FILES__;
const CACHE = `app-${__BUILD_ID__}`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

// Network first, so the newest version shows whenever the device is online; the cached files only when it isn't.
// Requests that ask for no caching (the update check in status.js) and other sites (Firebase) are left alone.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.cache === 'no-store' || new URL(request.url).origin !== location.origin) return;
  event.respondWith(fetch(request)
    .then((response) => {
      const copy = response.clone();
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, copy));
      return response;
    })
    .catch(() => caches.match(request, { ignoreSearch: true })));
});
