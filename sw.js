const CACHE_NAME = "skynox-v4";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

/* ---------- INSTALL ---------- */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

/* ---------- ACTIVATE ---------- */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))
      )
    )
  );
  self.clients.claim();
});

/* ---------- FETCH ---------- */
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  /* API RUNTIME CACHE */
  if (
    url.origin.includes("open-meteo.com") ||
    url.origin.includes("air-quality-api")
  ) {
    event.respondWith(networkFirst(req));
    return;
  }

  /* APP SHELL */
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});

/* ---------- STRATEGIES ---------- */
async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    return caches.match(req);
  }
}
