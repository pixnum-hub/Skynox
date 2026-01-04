const CACHE_VERSION = "skynox-v7";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

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
    caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

/* ---------- ACTIVATE ---------- */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (!key.startsWith(CACHE_VERSION)) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* ---------- FETCH ---------- */
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // Weather & AQI APIs — network first, cache fallback
  if (
    url.hostname.includes("open-meteo.com") ||
    url.hostname.includes("air-quality-api.open-meteo.com") ||
    url.hostname.includes("geocoding-api.open-meteo.com")
  ) {
    event.respondWith(networkFirst(req));
    return;
  }

  // App shell & assets — cache first
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});

/* ---------- STRATEGY ---------- */
async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await caches.match(req);
    if (cached) return cached;

    // Fallback for offline: return last cached weather data if available
    if (req.url.includes("open-meteo.com") || req.url.includes("air-quality-api.open-meteo.com")) {
      const data = await caches.match("./index.html");
      return data || new Response("Offline", {status:503, statusText:"Offline"});
    }

    return new Response("Offline", {status:503, statusText:"Offline"});
  }
}
