const CACHE = "littlequest-v38";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
  "./journey-game.js",
  "./journey-world.js",
  "./characters.js",
  "./beach.js",
  "./camels.js",
  "./wildlife.js",
  "./assets/characters-b.png",
  "./assets/characters-desert.png",
  "./assets/characters-snow.png",
  "./assets/characters-beach.png",
  "./assets/brother-beach.png",
  "./assets/camels.png",
  "./assets/wildlife.png",
  "./quest.js",
  "./world.js",
  "./swipe.js",
  "./settings.js",
  "./privacy.html",
  "./privacy.css",
  "./privacy.js",
  "./privacy-details.json",
  "./icon.svg",
  "./manifest.webmanifest",
];
self.addEventListener("install", (e) =>
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(FILES))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (e) => {
  if (e.request.method === "GET") {
    // Local previews must show edited files, even with an old offline cache.
    if (["localhost", "127.0.0.1", "[::1]"].includes(self.location.hostname)) {
      e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
      return;
    }
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  }
});
