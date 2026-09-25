const CACHE_NAME = "chaoui-v34-organizer-v11";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js?v=20260925-playerhq3",
  "./manifest.json",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./logo.png",
  "./universe.js?v=20260925-universe5",
  "./tournament-v2.js",
  "./tournament-v2.css",
  "./tournament-v2-observer.js",
  "./matches-v2.js?v=20260925-match3",
  "./matches-v2.css?v=20260925-match3",
  "./elite-core-v2.js",
  "./elite-core-v2.css",
  "./player-page-v2.css?v=20260925-playerhq3",
  "./home-v3.css?v=20260925-home3",
  "./visual-system-v4.css?v=20260925-v4",
  "./competitive-core-v5.js?v=20260925-core5",
  "./competitive-core-v5.css?v=20260925-core5",
  "./visual-v6.js?v=20260925-v8",
  "./visual-v6.css?v=20260925-v8",
  "./admin-hq-v9.js?v=20260925-admin10",
  "./admin-hq-v9.css?v=20260925-admin10",
  "./organizer-v11.js?v=20260925-v11",
  "./organizer-v11.css?v=20260925-v11"
];

async function transformAppAsset(request, response) {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/social.js")) {
    const source = await response.text();
    const injected = source + `
\n(()=>{const s=document.createElement("script");s.src="tournament-v2.js?v=20260925-tournaments2";s.onload=()=>{const l=document.createElement("link");l.rel="stylesheet";l.href="tournament-v2.css?v=20260925-tournaments2";document.head.appendChild(l)};document.head.appendChild(s);setTimeout(()=>{const o=document.createElement("script");o.src="tournament-v2-observer.js?v=20260925-tournaments2";document.head.appendChild(o)},0);const e=document.createElement("script");e.src="elite-core-v2.js?v=20260925-elite2";e.onload=()=>{const c=document.createElement("link");c.rel="stylesheet";c.href="elite-core-v2.css?v=20260925-elite2";document.head.appendChild(c)};document.head.appendChild(e);})();\n`;
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
