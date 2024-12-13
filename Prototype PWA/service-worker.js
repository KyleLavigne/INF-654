const CACHE_NAME = "travel-planner-cache-v1";
const URLS_TO_CACHE = [
  "/", // Root
  "/index.html",
  "/itinerary.html",
  "/packing.html",
  "/map.html",
  "/css/styles.css",
  "/js/main.js",
  "/js/itinerary.js",
  "/js/map.js",
  "/js/indexeddb.js",
  "/js/firebase.js",
  "https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "/manifest.json",
];

// Install Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching files");
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service Worker: Clearing old cache");
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  console.log("Service Worker: Fetching resource:", event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found, otherwise fetch from network
      return response || fetch(event.request);
    })
  );
});
