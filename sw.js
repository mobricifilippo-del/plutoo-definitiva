// sw.js - Service Worker minimale per Plutoo

self.addEventListener("install", (event) => {
  console.log("✅ Service Worker installato");
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker attivato");
});

self.addEventListener("fetch", (event) => {
  // In futuro qui si può aggiungere il caching delle risorse
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate',  (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {}); // nessun caching
