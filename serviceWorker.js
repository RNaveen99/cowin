const CowinAssests = 'Cowin';
// const assets = ['index.html', './js/index.js'];
const assets = [];

self.addEventListener('install', (installEvent) => {
  installEvent.waitUntil(
    caches.open(CowinAssests).then((cache) => {
      cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', function (event) {
  //   console.log(event.request.url);
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});
