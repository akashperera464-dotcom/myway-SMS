const MYWAY_PWA_VERSION = "2026-09-28-2";

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.mode === "navigate" || request.destination === "script" || request.destination === "style") {
    event.respondWith(fetch(request, { cache: "no-store" }));
  }
});