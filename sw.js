const CACHE_VERSION = "pintadex-v1";
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const APP_FILES = [
  "index.html",
  "pintar.html",
  "site.webmanifest",
  "favicon.svg",
  "css/styles.css",
  "js/offline.js",
  "js/home.js",
  "js/main.js",
  "js/board.js",
  "js/config.js",
  "js/imageProcessor.js",
  "js/palette.js",
  "js/pokeApi.js",
  "js/state.js",
  "data/pokemon.json",
  "fonts/fonts.css",
  "fonts/nunito-sans-latin.woff2",
  "fonts/press-start-2p-400-latin.woff2",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_FILES)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("pintadex-") &&
                key !== CACHE_VERSION &&
                key !== RUNTIME_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      caches
        .match(request, { ignoreSearch: true })
        .then((cached) => cached || fetch(request))
        .catch(() => caches.match("index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
