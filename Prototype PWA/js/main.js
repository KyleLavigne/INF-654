import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-auth.js";

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user.email);
    // Show logged-in UI or redirect
  } else {
    console.log("No user signed in.");
    if (!["/login.html", "/signup.html"].includes(window.location.pathname)) {
      window.location.href = "login.html"; // Redirect to login if not authenticated
    }
  }
});

// Logout functionality
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    console.log("User signed out.");
    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout error:", error.message);
  }
});

// Register the service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/Prototype%20PWA/service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}

// Materialize UI Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Materialize components
  M.AutoInit();
});

document.addEventListener("DOMContentLoaded", function () {
  const elems = document.querySelectorAll(".sidenav");
  M.Sidenav.init(elems);
});

import { logoutUser } from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
  const authBtnPlaceholder = document.getElementById("auth-btn-placeholder");
  const authBtnSidenavPlaceholder = document.getElementById("auth-btn-sidenav-placeholder");

  if (!authBtnPlaceholder || !authBtnSidenavPlaceholder) {
    console.error("Auth button placeholders not found in the DOM.");
    return;
  }

  // Listen for authentication state changes
  onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user);

    if (user) {
      // User is logged in - show Logout button
      authBtnPlaceholder.innerHTML = '<a href="#" id="logout-btn">Logout</a>';
      authBtnSidenavPlaceholder.innerHTML = '<a href="#" id="logout-btn-sidenav">Logout</a>';

      // Add logout functionality
      const logoutBtn = document.getElementById("logout-btn");
      const logoutBtnSidenav = document.getElementById("logout-btn-sidenav");

      logoutBtn?.addEventListener("click", async (e) => {
        e.preventDefault();
        console.log("Logging out...");
        await logoutUser();
        window.location.href = "login.html"; // Redirect to login page
      });

      logoutBtnSidenav?.addEventListener("click", async (e) => {
        e.preventDefault();
        console.log("Logging out from sidenav...");
        await logoutUser();
        window.location.href = "login.html"; // Redirect to login page
      });
    } else {
      // User is not logged in - show Login button
      console.log("User is not logged in. Showing Login button.");
      authBtnPlaceholder.innerHTML = '<a href="login.html" id="login-btn">Login</a>';
      authBtnSidenavPlaceholder.innerHTML = '<a href="login.html" id="login-btn-sidenav">Login</a>';
    }
  });
});


