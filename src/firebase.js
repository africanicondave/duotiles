// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCLReReC7HGhgmT6kQqmu-jLgBmkvGsepM",
  authDomain: "duotiles-a5ec9.firebaseapp.com",
  projectId: "duotiles-a5ec9",
  storageBucket: "duotiles-a5ec9.appspot.com",
  messagingSenderId: "312097553316",
  appId: "1:312097553316:web:87aa0c81729604fe811f31",
  measurementId: "G-EC48EYGTMZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Auth
export const auth = getAuth(app);
export function signInAnon() {
  return signInAnonymously(auth);
}

// Initialize Firestore
export const db = getFirestore(app);
