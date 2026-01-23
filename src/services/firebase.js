import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDj4r4o3JLhhYCzi1pFsxB-q40n-Iv9j3o",
  authDomain: "dictionary-learning-app.firebaseapp.com",
  projectId: "dictionary-learning-app",
  storageBucket: "dictionary-learning-app.firebasestorage.app",
  messagingSenderId: "598429255697",
  appId: "1:598429255697:web:8270d35c3694fd5daa89b0",
  measurementId: "G-P3N739TEW7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
