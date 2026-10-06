const CACHE = "littlequest-v7";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
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
      ),
  ),
);
self.addEventListener("fetch", (e) => {
  if (e.request.method === "GET")
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
