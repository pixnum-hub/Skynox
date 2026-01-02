const CACHE_NAME="skynox-shell-v1";
const API_CACHE="skynox-api-v1";

self.addEventListener("install",e=>{
 e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll([
  "/","/index.html","/manifest.json","/icons/icon-192.png","/icons/icon-512.png"
 ])));
 self.skipWaiting();
});

self.addEventListener("activate",e=>{
 e.waitUntil(caches.keys().then(k=>Promise.all(k.map(i=>{
  if(i!==CACHE_NAME&&i!==API_CACHE)return caches.delete(i)
 }))));
 self.clients.claim();
});

self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);
 if(u.hostname.includes("open-meteo")){
  e.respondWith(caches.open(API_CACHE).then(c=>fetch(e.request)
   .then(r=>{c.put(e.request,r.clone());return r})
   .catch(()=>caches.match(e.request))
  ));
  return;
 }
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
