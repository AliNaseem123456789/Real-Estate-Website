// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "real-estate-d2a04.firebaseapp.com",
  projectId: "real-estate-d2a04",
  storageBucket: "real-estate-d2a04.appspot.com",
  messagingSenderId: "1023763212940",
  appId: "1:1023763212940:web:92c9fa4bb0d4cf931b69a9"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);