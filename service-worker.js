const CACHE_NAME = "plutoo-cache-v24";
const urlsToCache = [
  "./",
  "./index.html?v=24",
  "./style.css?v=24",
  "./app.js?v=24",
  "./dog1.jpg","./dog2.jpg","./dog3.jpg","./dog4.jpg",
  "./logo-32.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});
self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((res) => res || fetch(event.request)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});
