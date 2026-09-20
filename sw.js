/* Slide Clock service worker - build bc4d0193d3
   The app has to work in a room with no usable wifi, so the shell is
   cached on install and served from cache first. Fonts are cached as
   they are fetched; if they never are, the fallback stack carries it. */
var CACHE = "slide-clock-bc4d0193d3";
var SHELL = ["./","./index.html","./manifest.webmanifest",
             "./icon-192.png","./icon-512.png","./icon-maskable-512.png",
             "./apple-touch-icon.png","./favicon.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); })
                    .then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  var isFont = url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com";
  var isLib  = url.host === "cdnjs.cloudflare.com";   /* pdf.js, fetched on first import */
  if (!sameOrigin && !isFont && !isLib) return;

  e.respondWith(caches.match(req).then(function(hit){
    var net = fetch(req).then(function(res){
      if (res && (res.ok || res.type === "opaque")){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    }).catch(function(){ return hit; });
    return hit || net;          /* cache first, refresh in the background */
  }));
});
