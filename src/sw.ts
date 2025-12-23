// Simple service worker for offline cache
const CACHE_NAME = "ucev-cache-v1";
const ASSETS = ["/", "/index.html"];

self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((k) =>
            k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()
          )
        )
      )
  );
});

self.addEventListener("fetch", (event: any) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
    )
  );
});
