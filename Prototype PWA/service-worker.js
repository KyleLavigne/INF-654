const CACHE_NAME = "travel-planner-cache-v4";
const URLS_TO_CACHE = [
  "/Prototype%20PWA/", // Root
  "/Prototype%20PWA/manifest.json",
  "/Prototype%20PWA/index.html",
  "/Prototype%20PWA/itinerary.html",
  "/Prototype%20PWA/packing.html",
  "/Prototype%20PWA/map.html",
  "/Prototype%20PWA/login.html",
  "/Prototype%20PWA/signup.html",
  "/Prototype%20PWA/css/styles.css",
  "/Prototype%20PWA/js/main.js",
  "/Prototype%20PWA/js/itinerary.js",
  "/Prototype%20PWA/js/map.js",
  "/Prototype%20PWA/js/indexeddb.js",
  "/Prototype%20PWA/js/firebase.js",
  "/Prototype%20PWA/js/login.js",
  "/Prototype%20PWA/js/signup.js",
  "/Prototype%20PWA/js/packing.js",
  "/Prototype%20PWA/img/travel_planner_logo.png", 
  "/Prototype%20PWA/img/itinerary.jpg",
  "/Prototype%20PWA/img/list.jpg",
  "/Prototype%20PWA/img/map.jpg",
  "https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://fonts.gstatic.com/s/materialicons/v126/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2", // Material Icons font
];

// Install Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static files");
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch((error) => {
        console.error("Service Worker: Failed to cache files on install", error);
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
            console.log("Service Worker: Clearing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  console.log("Service Worker: Fetching resource:", event.request.url);

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        // Return cached response if found
        console.log(`Service Worker: Found in cache: ${event.request.url}`);
        return response;
      }

      // Fetch from network and cache dynamically
      return fetch(event.request)
        .then((networkResponse) => {
          if (event.request.method === "GET" && event.request.url.startsWith("http")) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              console.log(`Service Worker: Dynamically cached: ${event.request.url}`);
              return networkResponse;
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to offline page for HTML requests
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/Prototype%20PWA/index.html");
          }
        });
    })
  );
});
