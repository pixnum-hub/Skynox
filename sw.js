/* ================================
   Skynox Weather PWA – Service Worker
   Fixed & Stable Version
================================ */

const CACHE_VERSION = "skynox-v13";   // 🔁 CHANGE THIS ON EVERY UPDATE
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

/* App shell – cache-first */
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
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting(); // 🚀 activate immediately
});

/* ---------- ACTIVATE ---------- */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (
            key !== STATIC_CACHE &&
            key !== RUNTIME_CACHE
          ) {
            return caches.delete(key); // 🧹 remove old caches
          }
        })
      )
    )
  );
  self.clients.claim(); // 👑 take control instantly
});

/* ---------- FETCH ---------- */
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  /* ⛅ Weather & AQI APIs — NETWORK FIRST */
  if (
    url.hostname.includes("open-meteo.com")
  ) {
    event.respondWith(networkFirst(req));
    return;
  }

  /* 🧠 App shell — CACHE FIRST */
  event.respondWith(
    caches.match(req).then(res => {
      return res || fetch(req);
    })
  );
});

/* ---------- STRATEGY ---------- */
async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    return caches.match(req);
  }
}
