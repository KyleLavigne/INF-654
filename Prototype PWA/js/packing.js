import { fetchPackingListFromFirestore, db } from "./firebase.js";
import { getPackingItemsFromIndexedDB, savePackingItemToIndexedDB } from "./indexeddb.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const packingForm = document.getElementById("packing-form");
  const packingInput = document.getElementById("item");
  const packingList = document.getElementById("packing-list");

  if (!packingForm || !packingInput || !packingList) {
    console.error("Required DOM elements not found.");
    return;
  }

  // Load packing list from IndexedDB or Firestore
  async function loadPackingList() {
    let packingItems;
  
    if (navigator.onLine) {
      // Fetch items from Firestore
      const firestoreItems = await fetchPackingListFromFirestore();
  
      // Sync Firestore items to IndexedDB
      const existingIndexedDBItems = await getPackingItemsFromIndexedDB();
      const existingIds = new Set(existingIndexedDBItems.map(item => item.id));
  
      for (const item of firestoreItems) {
        if (!existingIds.has(item.id)) {
          await savePackingItemToIndexedDB(item); // Add new Firestore items to IndexedDB
        }
      }
  
      // Use Firestore data for rendering the UI
      packingItems = firestoreItems;
    } else {
      // Fetch items from IndexedDB when offline
      packingItems = await getPackingItemsFromIndexedDB();
    }
  
    updatePackingListUI(packingItems); // Update the UI with the loaded items
  }
  

  async function addPackingItem(item) {
    // Generate a unique ID for the item
    const id = item.id || Date.now().toString();
    const packingItem = { ...item, id };
  
    // Save to IndexedDB
    await savePackingItemToIndexedDB(packingItem);
  
    if (navigator.onLine) {
      // Sync the new item to Firestore
      await setDoc(doc(db, "packingList", id), packingItem);
      console.log("Item synced to Firestore:", packingItem);
    }
  }
  

  function updatePackingListUI(packingItems) {
    packingList.innerHTML = "";
    packingItems.forEach(({ id, item, checked }) => {
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
          await setDoc(doc(db, "packingList", id), updatedItem);
          console.log("Item updated in Firestore:", updatedItem);
        }
  
        console.log("Item updated in IndexedDB:", updatedItem);
      });
  
      li.appendChild(label);
      packingList.appendChild(li);
    });
  }
  
  
  

  packingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const item = packingInput.value.trim();
    if (item) {
      const packingItem = { item, checked: false };
      await addPackingItem(packingItem);
      loadPackingList(); // Reload the packing list after adding a new item
      packingInput.value = "";
    }
  });

  loadPackingList();
});
