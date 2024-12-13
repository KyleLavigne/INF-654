const DB_NAME = "TravelPlannerDB";
const DB_VERSION = 2;
export const STORE_NAMES = {
  ITINERARY: "Itinerary",
  PACKING: "PackingList",
};

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

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
