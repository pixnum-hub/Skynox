const CACHE="skynox-pwa-v6";
const SHELL=["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png"];

self.addEventListener("install",e=>{
e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
self.skipWaiting();
});

self.addEventListener("activate",e=>{
e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE&&caches.delete(k)))));
self.clients.claim();
});

self.addEventListener("fetch",e=>{
const u=new URL(e.request.url);
if(u.origin.includes("open-meteo.com")){
e.respondWith(networkFirst(e.request));return;
}
e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});

async function networkFirst(req){
try{
const fresh=await fetch(req);
const cache=await caches.open(CACHE);
cache.put(req,fresh.clone());
return fresh;
}catch{
return caches.match(req);
}
}
