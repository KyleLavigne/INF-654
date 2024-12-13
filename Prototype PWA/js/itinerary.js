import { fetchUserItinerary, syncUserDataToFirestore, auth, db } from "./firebase.js";
import {
  setCurrentUserId,
  getDestinationsFromIndexedDB,
  saveDestinationToIndexedDB,
  openDB,
  STORE_NAMES,
  addToOfflineQueue,
} from "./indexeddb.js";
import { doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const destinationForm = document.getElementById("destination-form");
  const destinationInput = document.getElementById("destination");
  const destinationList = document.getElementById("destination-list");

  if (!destinationForm || !destinationInput || !destinationList) {
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
        await loadItinerary(); // Load itinerary
        window.addEventListener("online", processOfflineQueue); // Sync when back online
      } catch (error) {
        console.error("Error initializing itinerary:", error);
      }
    } else {
      console.log("No user is logged in.");
      destinationList.innerHTML = `<li class="collection-item">Please log in to view your itinerary.</li>`;
    }
  });

  async function loadItinerary() {
    let destinations;

    try {
      if (navigator.onLine) {
        const firestoreDestinations = await fetchUserItinerary();
        const existingIndexedDBDestinations = await getDestinationsFromIndexedDB();
        const existingIds = new Set(existingIndexedDBDestinations.map((dest) => dest.id));

        for (const dest of firestoreDestinations) {
          if (!existingIds.has(dest.id)) {
            await saveDestinationToIndexedDB(dest);
          }
        }
        destinations = firestoreDestinations;
      } else {
        destinations = await getDestinationsFromIndexedDB();
      }

      updateItineraryUI(destinations);
    } catch (error) {
      console.error("Failed to load itinerary:", error);
    }
  }

  async function addDestination(destination) {
    if (!auth.currentUser) {
      console.error("User is not logged in.");
      return;
    }

    const id = destination.id || Date.now().toString();
    const newDestination = { ...destination, id };

    try {
      await saveDestinationToIndexedDB(newDestination);

      if (navigator.onLine) {
        const indexedDBData = await getDestinationsFromIndexedDB();
        await syncUserDataToFirestore(indexedDBData, []);
        console.log("Destination synced to Firestore:", newDestination);
      } else {
        await addToOfflineQueue({ action: "add", data: newDestination });
        console.log("Added to offline queue:", newDestination);
      }

      loadItinerary();
    } catch (error) {
      console.error("Failed to add destination:", error);
    }
  }

  async function ensureOfflineQueueStore() {
    const db = await openDB(); // Open the database
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
        await syncUserDataToFirestore([data], []);
      } else if (action === "delete") {
        const uid = auth.currentUser?.uid;
        if (uid) {
          const firestoreDocRef = doc(db, `users/${uid}/itinerary`, data.id);
          await deleteDoc(firestoreDocRef);
        }
      }
    }

    console.log("Offline queue processed.");
  }

  function updateItineraryUI(destinations) {
    destinationList.innerHTML = "";
    destinations.forEach(({ id, destination }) => {
      const li = document.createElement("li");
      li.className = "collection-item";

      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.justifyContent = "space-between";
      container.style.alignItems = "center";

      const span = document.createElement("span");
      span.textContent = destination;

      const deleteButton = document.createElement("button");
      deleteButton.className = "btn red";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", async () => {
        await deleteDestination(id);
      });

      container.appendChild(span);
      container.appendChild(deleteButton);
      li.appendChild(container);
      destinationList.appendChild(li);
    });
  }

  destinationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!auth.currentUser) {
      console.error("User is not logged in.");
      return;
    }

    const destination = destinationInput.value.trim();
    if (destination) {
      const newDestination = { destination };
      await addDestination(newDestination);
      destinationInput.value = "";
    }
  });
});
