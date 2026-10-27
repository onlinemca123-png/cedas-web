/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
const CACHE = "cedas-v3";
const ASSETS = [
  "./", "./index.html",
  "./css/style.css", "./css/responsive.css",
  "./js/theme.js", "./js/layers.js", "./js/classify.js", "./js/vectorize.js",
  "./js/r-integration.js", "./js/details.js", "./js/search.js", "./js/filters.js",
  "./js/charts.js", "./js/controls.js", "./js/export.js", "./js/welcome.js", "./js/app.js",
  "./data/pontos.geojson", "./data/linha1.geojson", "./data/poligonos.geojson"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.url.includes("tile") || e.request.url.includes("basemaps")) return;
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request).then(function (res) {
        return caches.open(CACHE).then(function (c) {
          if (e.request.method === "GET" && res.ok) c.put(e.request, res.clone());
          return res;
        });
      });
    })
  );
});