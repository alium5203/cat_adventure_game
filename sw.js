const CACHE_NAME = 'coriander-arcade-v5';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg',
  './src/vendor/phaser-3.55.2.js',
  './src/main.js',
  './src/navigation.js',
  './src/gameScene.js',
  './src/trafficRunnerScene.js',
  './src/starPawsShooterScene.js',
  './src/big2Scene.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (!response || response.status !== 200) {
          return response;
        }

        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return caches.match(request);
      })
  );
});
