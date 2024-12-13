// firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import { getFirestore, collection, setDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxxiPDQNUcod_-R7h9bRF2C_pVaYNzXKE",
  authDomain: "travel-planner-9b464.firebaseapp.com",
  projectId: "travel-planner-9b464",
  storageBucket: "travel-planner-9b464.firebasestorage.app",
  messagingSenderId: "465938723148",
  appId: "1:465938723148:web:2bb4006f98096937a29fe9",
  measurementId: "G-9Y5F3VCDVK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Fetch itinerary from Firestore
export async function fetchItineraryFromFirestore() {
  const itineraryCollection = collection(db, "itinerary");
  const querySnapshot = await getDocs(itineraryCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Fetch packing list from Firestore
export async function fetchPackingListFromFirestore() {
  const packingCollection = collection(db, "packingList");
  const querySnapshot = await getDocs(packingCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Sync all IndexedDB data to Firestore
export async function syncAllToFirestore(itinerary, packingList) {
  const batchPromises = [];

  // Sync itinerary to Firestore
  for (const destination of itinerary) {
    const id = destination.id || Date.now().toString();
    batchPromises.push(setDoc(doc(db, "itinerary", id), destination));
  }

  // Sync packing list to Firestore
  for (const item of packingList) {
    const id = item.id || Date.now().toString();
    batchPromises.push(setDoc(doc(db, "packingList", id), item));
  }

  // Execute all promises
  await Promise.all(batchPromises);
  console.log("All data synced to Firestore");
}
