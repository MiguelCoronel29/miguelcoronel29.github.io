const CACHE_NAME = 'colectivos-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './bus.png',
  'https://api.mapbox.com/mapbox-gl-js/v3.5.0/mapbox-gl.js',
  'https://api.mapbox.com/mapbox-gl-js/v3.5.0/mapbox-gl.css',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});