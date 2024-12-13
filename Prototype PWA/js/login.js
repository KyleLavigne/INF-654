import { loginUser } from "./firebase.js";

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
  
    try {
      await loginUser(email, password);
      console.log("Login successful");
      window.location.href = "index.html"; // Redirect to home page
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  });
