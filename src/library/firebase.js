// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkJ_6OiEARpJhyLQY9gEa0xmnau6hS0VQ",
  authDomain: "react-chat-app-64bae.firebaseapp.com",
  projectId: "react-chat-app-64bae",
  // storageBucket should be the bucket name, not the download domain
  storageBucket: "react-chat-app-64bae.appspot.com",
  messagingSenderId: "230056425984",
  appId: "1:230056425984:web:82b50855b9dccd6ee036e5",
};

// Initialize Firebase
// During Vite HMR, modules can re-evaluate. Guard against duplicate init.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Bind services to this specific app instance
export const auth = getAuth(app);
export const db = getFirestore(app);