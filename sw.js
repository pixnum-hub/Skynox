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
          if (!key.startsWith(CACHE_VERSION)) return caches.delete(key);
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

  // Network-first for APIs
  if(url.hostname.includes("open-meteo.com")) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Cache-first for app shell
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});

/* ---------- NETWORK FIRST STRATEGY ---------- */
async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  } catch(e) {
    return caches.match(req);
  }
}

/* ---------- MESSAGE LISTENER FOR AQI NOTIFICATIONS ---------- */
self.addEventListener("message", event => {
  if(event.data?.type === "AQI_NOTIFY" && self.registration.showNotification){
    const {aqi, location} = event.data;
    self.registration.showNotification(⚠️ Poor Air Quality", {
      body: `AQI is ${aqi} in ${location}. Limit outdoor activity.`,
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      requireInteraction: true,
      silent: false
    });
  }
});
