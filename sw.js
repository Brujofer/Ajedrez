// Cache de la app para que funcione sin conexión.
// Subí la versión cada vez que cambies algún archivo, así el celu baja la versión nueva.
const CACHE = 'ajedrez-v5';
const FILES = [
  './', 'index.html', 'style.css', 'app.js', 'chess-engine.js', 'ai.js', 'pieces.js', 'audio.js',
  'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Red primero (para recibir cambios), cache si no hay conexión
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
