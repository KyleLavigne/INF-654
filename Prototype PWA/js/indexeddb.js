let currentUserId = null; // Holds the user ID for the current session

export function setCurrentUserId(userId) {
  currentUserId = userId;
}

const DB_VERSION = 3; // Incremented version to add the offline queue store
export const STORE_NAMES = {
  ITINERARY: "Itinerary",
  PACKING: "PackingList",
  OFFLINE_QUEUE: "OfflineQueue", // Added offline queue store
};

function getDbName() {
  if (!currentUserId) {
    throw new Error("User ID is not set. Call setCurrentUserId(userId) before accessing IndexedDB.");
  }
  return `TravelPlannerDB_${currentUserId}`;
}

// Open IndexedDB for the current user
export function openDB() {
  return new Promise((resolve, reject) => {
    const dbName = getDbName();
    const request = indexedDB.open(dbName, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create Itinerary store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAMES.ITINERARY)) {
        db.createObjectStore(STORE_NAMES.ITINERARY, { keyPath: "id", autoIncrement: true });
        console.log("Itinerary store created");
      }

      // Create PackingList store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAMES.PACKING)) {
        db.createObjectStore(STORE_NAMES.PACKING, { keyPath: "id", autoIncrement: true });
        console.log("PackingList store created");
      }

      // Create OfflineQueue store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAMES.OFFLINE_QUEUE)) {
        db.createObjectStore(STORE_NAMES.OFFLINE_QUEUE, { keyPath: "id", autoIncrement: true });
        console.log("OfflineQueue store created");
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Retrieve all destinations from IndexedDB
export async function getDestinationsFromIndexedDB() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES.ITINERARY, "readonly");
  const store = tx.objectStore(STORE_NAMES.ITINERARY);
  const destinations = [];
  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        destinations.push({ id: cursor.key, ...cursor.value }); // Include the `id`
        cursor.continue();
      } else {
        resolve(destinations);
      }
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

// Save a destination to IndexedDB
export async function saveDestinationToIndexedDB(destination) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES.ITINERARY, "readwrite");
  const store = tx.objectStore(STORE_NAMES.ITINERARY);
  return new Promise((resolve, reject) => {
    const request = store.put(destination);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

// Retrieve all packing items from IndexedDB
export async function getPackingItemsFromIndexedDB() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES.PACKING, "readonly");
  const store = tx.objectStore(STORE_NAMES.PACKING);
  const items = [];
  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        items.push(cursor.value); // Include both item and checked state
        cursor.continue();
      } else {
        resolve(items);
      }
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

// Save a packing item to IndexedDB
export async function savePackingItemToIndexedDB(item) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES.PACKING, "readwrite");
  const store = tx.objectStore(STORE_NAMES.PACKING);
  return new Promise((resolve, reject) => {
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

// Add an action to the offline queue
export async function addToOfflineQueue(action) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES.OFFLINE_QUEUE, "readwrite");
  const store = tx.objectStore(STORE_NAMES.OFFLINE_QUEUE);
  return new Promise((resolve, reject) => {
    const request = store.add(action);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

// Retrieve all actions from the offline queue
export async function getOfflineQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES.OFFLINE_QUEUE, "readonly");
  const store = tx.objectStore(STORE_NAMES.OFFLINE_QUEUE);
  const queue = [];
  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        queue.push({ id: cursor.key, ...cursor.value });
        cursor.continue();
      } else {
        resolve(queue);
      }
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

// Remove an action from the offline queue
export async function removeFromOfflineQueue(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES.OFFLINE_QUEUE, "readwrite");
  const store = tx.objectStore(STORE_NAMES.OFFLINE_QUEUE);
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}
