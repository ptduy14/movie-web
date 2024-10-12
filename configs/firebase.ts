import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "moviex-ad32a.firebaseapp.com",
  projectId: "moviex-ad32a",
  storageBucket: "moviex-ad32a.appspot.com",
  messagingSenderId: "621172853293",
  appId: "1:621172853293:web:b848576bfb885700b446a4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
export const auth = getAuth();
export const db = getFirestore(app);