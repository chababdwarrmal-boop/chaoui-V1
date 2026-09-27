const CACHE_NAME="chaoui-v30-rebuild-20260927";
const APP_FILES=[
  "./","./index.html","./style.css","./manifest.json","./icon.svg","./icon-192.png","./icon-512.png",
  "./chaoui-mark.svg","./script.js?v=20260927-v30","./auth-v30.js?v=20260927-v30","./v30.css?v=20260927-v30","./v30.js?v=20260927-v30"
];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_FILES)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(
    fetch(e.request).then(r=>{
      caches.open(CACHE_NAME).then(c=>c.put(e.request,r.clone())).catch(()=>{});
      return r;
    }).catch(()=>caches.match(e.request))
  );
});