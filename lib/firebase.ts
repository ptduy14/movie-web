import { initializeApp, getApps } from "firebase/app";
import type { Auth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Chỉ khởi tạo Firebase nếu chưa có khởi tạo
const app = !getApps().length ? initializeApp(firebaseConfig,) : getApps()[0];

export const db = initializeFirestore(app, {experimentalForceLongPolling: true});
export default app;

// `firebase/auth`'s `getAuth()` eagerly loads an iframe from `authDomain`
// (moviex-ad32a.firebaseapp.com/auth/iframe.js) for session persistence —
// that cost only makes sense to pay once the user actually attempts to
// log in / sign up / sign out, not on every page load. Callers await this
// instead of importing a top-level `auth` const.
let authPromise: Promise<Auth> | null = null;
export function getFirebaseAuth(): Promise<Auth> {
  if (!authPromise) {
    authPromise = import("firebase/auth").then(({ getAuth }) => getAuth(app));
  }
  return authPromise;
}
