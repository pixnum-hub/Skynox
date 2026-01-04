const CACHE_VERSION="skynox-v7";
const STATIC_CACHE=`${CACHE_VERSION}-static`;
const RUNTIME_CACHE=`${CACHE_VERSION}-runtime`;

const APP_SHELL=["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];

self.addEventListener("install",e=>{e.waitUntil(caches.open(STATIC_CACHE).then(c=>c.addAll(APP_SHELL)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>{if(!k.startsWith(CACHE_VERSION))return caches.delete(k);})));self.clients.claim();});
self.addEventListener("fetch",e=>{const req=e.request;const url=new URL(req.url);if(url.hostname.includes("open-meteo.com")){e.respondWith(networkFirst(req));return;}e.respondWith(caches.match(req).then(res=>res||fetch(req)));});
async function networkFirst(req){try{const fresh=await fetch(req);const cache=await caches.open(RUNTIME_CACHE);cache.put(req,fresh.clone());return fresh;}catch(e){return caches.match(req);}}
