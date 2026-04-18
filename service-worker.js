const CACHE_NAME = 'fracciones-v1.0.0';
const FILES_TO_CACHE = [
  './', './index.html', './js/game.js', './css/estilos.css',
  './data/pizza_rush.json', './data/tetris.json', './data/chef_fraccion.json',
  './manifest.json', './assets/icon-192.png', './assets/icon-512.png'
];
self.addEventListener('install', (evt) => {
  evt.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', (evt) => {
  evt.waitUntil(caches.keys().then((keyList) => Promise.all(keyList.map((key) => {
    if (key!== CACHE_NAME) return caches.delete(key);
  }))));
  self.clients.claim();
});
self.addEventListener('fetch', (evt) => {
  evt.respondWith(caches.match(evt.request).then((response) => response || fetch(evt.request)));
});