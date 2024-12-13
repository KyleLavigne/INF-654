import { fetchItineraryFromFirestore, db } from "./firebase.js";
import { getDestinationsFromIndexedDB, saveDestinationToIndexedDB, openDB, STORE_NAMES } from "./indexeddb.js";
import { setDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const destinationForm = document.getElementById("destination-form");
  const destinationInput = document.getElementById("destination");
  const destinationList = document.getElementById("destination-list");

  if (!destinationForm || !destinationInput || !destinationList) {
    console.error("Required DOM elements not found.");
    return;
  }

  // Load itinerary from IndexedDB or Firestore
  async function loadItinerary() {
    let destinations;

    if (navigator.onLine) {
      // Fetch items from Firestore
      const firestoreDestinations = await fetchItineraryFromFirestore();

      // Sync Firestore destinations to IndexedDB
      const existingIndexedDBDestinations = await getDestinationsFromIndexedDB();
      const existingIds = new Set(existingIndexedDBDestinations.map(dest => dest.id));

      for (const dest of firestoreDestinations) {
        if (!existingIds.has(dest.id)) {
          await saveDestinationToIndexedDB(dest); // Add new Firestore destinations to IndexedDB
        }
      }

      // Use Firestore data for rendering the UI
      destinations = firestoreDestinations;
    } else {
      // Fetch items from IndexedDB when offline
      destinations = await getDestinationsFromIndexedDB();
    }

    updateItineraryUI(destinations); // Update the UI with the loaded destinations
  }

  async function addDestination(destination) {
    // Generate a unique ID for the destination
    const id = destination.id || Date.now().toString();
    const newDestination = { ...destination, id };

    // Save to IndexedDB
    await saveDestinationToIndexedDB(newDestination);

    if (navigator.onLine) {
      // Sync the new destination to Firestore
      await setDoc(doc(db, "itinerary", id), newDestination);
      console.log("Destination synced to Firestore:", newDestination);
    }
  }

  function updateItineraryUI(destinations) {
    destinationList.innerHTML = ""; // Clear existing content
    destinations.forEach(({ id, destination }) => {
      const li = document.createElement("li");
      li.className = "collection-item";
  
      // Create a container for the content
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.justifyContent = "space-between";
      container.style.alignItems = "center";
  
      // Add destination text
      const span = document.createElement("span");
      span.textContent = destination;
  
      // Create delete button
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn red";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", async () => {
        await deleteDestination(id);
        loadItinerary(); // Reload the itinerary after deletion
      });
  
      // Append the text and button to the container
      container.appendChild(span);
      container.appendChild(deleteButton);
  
      // Add the container to the list item
      li.appendChild(container);
      destinationList.appendChild(li);
    });
  }  

  async function deleteDestination(id) {
    // Delete from IndexedDB
    const dbInstance = await openDB();
    const tx = dbInstance.transaction(STORE_NAMES.ITINERARY, "readwrite");
    const store = tx.objectStore(STORE_NAMES.ITINERARY);
  
    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  
    if (navigator.onLine) {
      // Delete from Firestore if online
      await deleteDoc(doc(db, "itinerary", id));
      console.log(`Deleted destination from Firestore: ${id}`);
    }
  }

  destinationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const destination = destinationInput.value.trim();
    if (destination) {
      const newDestination = { destination };
      await addDestination(newDestination); // The function is indirectly invoked here
      loadItinerary(); // Reload the itinerary after adding a new destination
      destinationInput.value = "";
    }
  });

  loadItinerary();
});
