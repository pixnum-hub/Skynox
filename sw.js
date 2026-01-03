const CACHE = "skynox-v10";
const ASSETS = ["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.map(k=>k!==CACHE&&caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch",e=>{
  if(e.request.url.includes("open-meteo"))
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
  else
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
