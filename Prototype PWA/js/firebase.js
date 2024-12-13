// firebase.js
// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import { getFirestore, collection, setDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";

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

import { setCurrentUserId } from "./indexeddb.js";


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Listen for authentication state changes
export function monitorAuthState(callback) {
  onAuthStateChanged(auth, callback);
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    console.log("User logged in:", user.uid);
    setCurrentUserId(user.uid); // Set the user ID for IndexedDB
  } else {
    // User is signed out
    console.log("User logged out");
    setCurrentUserId(null); // Clear the user ID
  }
});

// Login a user
export async function loginUser(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

// Signup a user
export async function signupUser(email, password) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

// Logout the user
export async function logoutUser() {
  return await signOut(auth);
}

// Fetch user's itinerary from Firestore
export async function fetchUserItinerary() {
  if (!auth.currentUser) throw new Error("User not logged in");
  const uid = auth.currentUser.uid;
  const itineraryCollection = collection(db, `users/${uid}/itinerary`);
  const querySnapshot = await getDocs(itineraryCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Fetch user's packing list from Firestore
export async function fetchUserPackingList() {
  if (!auth.currentUser) throw new Error("User not logged in");
  const uid = auth.currentUser.uid;
  const packingCollection = collection(db, `users/${uid}/packingList`);
  const querySnapshot = await getDocs(packingCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Sync user's IndexedDB data to Firestore
export async function syncUserDataToFirestore(itinerary, packingList) {
  if (!auth.currentUser) throw new Error("User not logged in");
  const uid = auth.currentUser.uid;
  const batchPromises = [];

  // Sync itinerary to Firestore
  for (const destination of itinerary) {
    const id = destination.id || Date.now().toString();
    batchPromises.push(setDoc(doc(db, `users/${uid}/itinerary`, id), destination));
  }

  // Sync packing list to Firestore
  for (const item of packingList) {
    const id = item.id || Date.now().toString();
    batchPromises.push(setDoc(doc(db, `users/${uid}/packingList`, id), item));
  }

  // Execute all promises
  await Promise.all(batchPromises);
  console.log("All user data synced to Firestore");
}
