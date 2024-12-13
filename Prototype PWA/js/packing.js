import { fetchUserPackingList, syncUserDataToFirestore, auth, db } from "./firebase.js";
import {
  setCurrentUserId,
  getPackingItemsFromIndexedDB,
  savePackingItemToIndexedDB,
  openDB,
  STORE_NAMES,
  addToOfflineQueue,
} from "./indexeddb.js";

document.addEventListener("DOMContentLoaded", () => {
  const packingForm = document.getElementById("packing-form");
  const packingInput = document.getElementById("item");
  const packingList = document.getElementById("packing-list");

  if (!packingForm || !packingInput || !packingList) {
    console.error("Required DOM elements not found.");
    return;
  }

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log("User logged in:", user.uid);
      setCurrentUserId(user.uid);

      try {
        await ensureOfflineQueueStore(); // Ensure offline queue is initialized
        await processOfflineQueue(); // Sync offline changes
        await loadPackingList(); // Load packing list
        window.addEventListener("online", processOfflineQueue); // Sync when back online
      } catch (error) {
        console.error("Error initializing packing list:", error);
      }
    } else {
      console.log("No user is logged in.");
      packingList.innerHTML = `<li class="collection-item">Please log in to view your packing list.</li>`;
    }
  });

  async function loadPackingList() {
    let packingItems = [];

    try {
      const offlineQueueItems = await getOfflineQueueItems();
      packingItems = await getPackingItemsFromIndexedDB();

      for (const { action, data } of offlineQueueItems) {
        if (action === "add" && !packingItems.find((item) => item.id === data.id)) {
          packingItems.push(data);
        }
      }

      if (navigator.onLine) {
        const firestoreItems = await fetchUserPackingList();
        const existingIds = new Set(packingItems.map((item) => item.id));

        for (const item of firestoreItems) {
          if (!existingIds.has(item.id)) {
            await savePackingItemToIndexedDB(item);
          }
        }

        packingItems = firestoreItems;
      }

      updatePackingListUI(packingItems);
    } catch (error) {
      console.error("Failed to load packing list:", error);
    }
  }

  async function addPackingItem(item) {
    if (!auth.currentUser) {
      console.error("User is not logged in.");
      return;
    }

    const id = item.id || Date.now().toString();
    const newPackingItem = { ...item, id, checked: false };

    try {
      await savePackingItemToIndexedDB(newPackingItem);

      if (navigator.onLine) {
        const indexedDBData = await getPackingItemsFromIndexedDB();
        await syncUserDataToFirestore([], indexedDBData);
        console.log("Packing item synced to Firestore:", newPackingItem);
      } else {
        await addToOfflineQueue({ action: "add", data: newPackingItem });
        console.log("Added to offline queue:", newPackingItem);
      }

      loadPackingList();
    } catch (error) {
      console.error("Failed to add packing item:", error);
    }
  }

  async function ensureOfflineQueueStore() {
    const db = await openDB();
    const tx = db.transaction(STORE_NAMES.OFFLINE_QUEUE, "readwrite");
    tx.oncomplete = () => console.log("Offline queue store verified.");
  }

  async function processOfflineQueue() {
    if (!navigator.onLine) return;

    console.log("Processing offline queue...");
    const dbInstance = await openDB();
    const tx = dbInstance.transaction(STORE_NAMES.OFFLINE_QUEUE, "readwrite");
    const store = tx.objectStore(STORE_NAMES.OFFLINE_QUEUE);

    const queue = [];
    await new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          queue.push(cursor.value);
          cursor.delete(); // Remove the item from the queue
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = (event) => reject(event.target.error);
    });

    for (const { action, data } of queue) {
      if (action === "add") {
        await syncUserDataToFirestore([], [data]);
      }
    }

    console.log("Offline queue processed.");
  }

  function updatePackingListUI(items) {
    packingList.innerHTML = "";
    items.forEach(({ id, item, checked }) => {
      const li = document.createElement("li");
      li.className = "collection-item";

      const label = document.createElement("label");
      label.innerHTML = `
        <input type="checkbox" class="filled-in" ${checked ? "checked" : ""} />
        <span>${item}</span>
      `;

      const checkbox = label.querySelector("input");
      checkbox.addEventListener("change", async () => {
        const updatedItem = { id, item, checked: checkbox.checked };
        await savePackingItemToIndexedDB(updatedItem);

        if (navigator.onLine) {
          const indexedDBData = await getPackingItemsFromIndexedDB();
          await syncUserDataToFirestore([], indexedDBData);
          console.log("Packing item updated in Firestore:", updatedItem);
        } else {
          await addToOfflineQueue({ action: "update", data: updatedItem });
          console.log("Update added to offline queue:", updatedItem);
        }
      });

      li.appendChild(label);
      packingList.appendChild(li);
    });
  }

  async function getOfflineQueueItems() {
    const dbInstance = await openDB();
    const tx = dbInstance.transaction(STORE_NAMES.OFFLINE_QUEUE, "readonly");
    const store = tx.objectStore(STORE_NAMES.OFFLINE_QUEUE);

    const queue = [];
    await new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          queue.push(cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = (event) => reject(event.target.error);
    });

    return queue;
  }

  packingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!auth.currentUser) {
      console.error("User is not logged in.");
      return;
    }

    const item = packingInput.value.trim();
    if (item) {
      const newPackingItem = { item };
      await addPackingItem(newPackingItem);
      packingInput.value = "";
    }
  });
});
