/*
  Receipt Log service worker — makes the app open offline.
  VERSION HISTORY (newest first)
  v2.2.0  2026-10-17  Cache bump; PDF and ZIP libraries added to the offline set.
  v2.1.0  2026-10-17  Cache bump; logo files added to the offline set.
  v2.0.2  2026-10-17  Cache bump for the iPhone save fix.
  v2.0.1  2026-10-17  Cache bump for the iPhone fix.
  v2.0.0  2026-10-16  App shell cached on install; text reader, PDF reader
                      and fonts cached the first time they're used.
  Bump CACHE when shipping a new version so phones pick up the update.
*/
const CACHE = "receipt-log-v2.2.0";
const SHELL = ["./", "index.html", "receipt-parser.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  "brand/logo-horizontal.svg", "brand/logo-horizontal-white.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
// The text reader (~11 MB) downloads in the background after install,
// so receipt reading also works with no signal.
const VENDOR = ["vendor/tesseract/tesseract.min.js", "vendor/tesseract/worker.min.js",
  "vendor/tesseract/core/tesseract-core-simd-lstm.wasm.js", "vendor/tesseract/core/tesseract-core-lstm.wasm.js",
  "vendor/tesseract/lang/eng.traineddata.gz", "vendor/pdfjs/pdf.min.js", "vendor/pdfjs/pdf.worker.min.js",
  "vendor/jspdf/jspdf.umd.min.js", "vendor/jszip/jszip.min.js"];

self.addEventListener("activate", e => {
  caches.open(CACHE).then(c => Promise.all(VENDOR.map(u => c.match(u).then(hit => hit || c.add(u))))).catch(() => {});
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith("receipt-log-") && k !== CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // app files: network first so updates arrive, cache when offline
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
  } else if (/fonts\.(googleapis|gstatic)\.com/.test(url.host + url.pathname)) {
    // libraries, OCR language data, fonts: cache first (they never change at a pinned version)
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
