const CACHE_NAME="chaoui-v29-mobile-bailout-20260927";
const APP_FILES=[
  "./","./index.html","./style.css","./manifest.json","./icon.svg","./icon-192.png","./icon-512.png",
  "./chaoui-mark.svg",
  "./script.js?v=20260927-v27",
  "./auth-v13.js?v=20260927-v29",
  "./v23-redesign.css?v=20260927-v29",
  "./v23-redesign.js?v=20260927-v29"
];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_FILES)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(
    fetch(e.request).then(response=>{
      caches.open(CACHE_NAME).then(cache=>cache.put(e.request,response.clone())).catch(()=>{});
      return response;
    }).catch(()=>caches.match(e.request))
  );
});