const CACHE_NAME = "chaoui-v20-tournaments-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js?v=20260925-player2",
  "./manifest.json",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./logo.png",
  "./universe.js?v=20260925-universe5",
  "./tournament-v2.js",
  "./tournament-v2.css"
];

async function transformAppAsset(request, response) {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/social.js")) {
    const source = await response.text();
    const injected = source + `
\n(()=>{const s=document.createElement("script");s.src="tournament-v2.js?v=20260925-tournaments2";s.onload=()=>{const l=document.createElement("link");l.rel="stylesheet";l.href="tournament-v2.css?v=20260925-tournaments2";document.head.appendChild(l)};document.head.appendChild(s)})();\n`;
    return new Response(injected, {status: response.status, headers: response.headers});
  }
  if (url.pathname.endsWith("/tournament-v2.js")) {
    const source = await response.text();
    const injected = `(()=>{const l=document.createElement("link");l.rel="stylesheet";l.href="tournament-v2.css?v=20260925-tournaments2";document.head.appendChild(l)})();\n` + source;
    return new Response(injected, {status: response.status, headers: response.headers});
  }
  return response;
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(async response => {
        const transformed = await transformAppAsset(event.request, response);
        const copy = transformed.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return transformed;
      })
      .catch(() => caches.match(event.request))
  );
});
