import { signupUser } from "./firebase.js";

document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
  
    try {
      await signupUser(email, password);
      console.log("Signup successful");
      window.location.href = "login.html"; // Redirect to login page
    } catch (error) {
      console.error("Signup failed:", error.message);
    }
  });