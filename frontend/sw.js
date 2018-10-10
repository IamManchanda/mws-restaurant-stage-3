let staticCacheName = 'restaurant-review-static-v2';

self.addEventListener('install', function (event) {
  event.waitUntill(
    caches.open(staticCacheName)
      .then(function (cache) {
        return cache.addAll([
          '/',
          '/restaurant.html',
          'css/styles.css',
          'js/dbhelper.js',
          'js/main.js',
          'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
          'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
        ]);
      }),
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntill(
    caches.keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function (cacheName) {
              return cacheName.startsWith('restaurant-review-static-') && cacheName != staticCacheName;
            })
            .map(function (cacheName) {
              return cache.delete(cacheName);
            }),
        );
      })
      .catch(function (error) {
        console.log(error);
      }),
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) return response;
        return fetch(event.request);
      }),
  );
});