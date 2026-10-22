// Bump this on every deploy that changes cached assets, so old clients pick up the new shell.
const CACHE_VERSION = "v1";
const SHELL_CACHE = `aaon-shell-${CACHE_VERSION}`;
const APP_SHELL_URL = "/";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.add(APP_SHELL_URL).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== SHELL_CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

function isApiRequest(url) {
  // The backend lives on its own origin in dev (localhost:4000) and typically under
  // /api in production behind a reverse proxy — never cache either: payments, artisan
  // records and auth responses must always be live, not stale-from-cache.
  return url.pathname.startsWith("/api/") || url.origin !== self.location.origin;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (isApiRequest(url)) return; // let the network handle it normally

  // App navigations (typing the URL, refresh, deep link): try the network first so
  // users always get the latest build when online; fall back to the cached shell
  // so the SPA still boots when offline, and the router takes over from there.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(APP_SHELL_URL, copy));
          return res;
        })
        .catch(() => caches.match(APP_SHELL_URL))
    );
    return;
  }

  // Static build assets (hashed JS/CSS/fonts/images): cache-first, refresh in the
  // background so the next load picks up changes without blocking this one.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
