
import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
  getFunctions
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBNWj1X206ZIcUVB7GpdBJ4WKsl_p7MlC4",
  authDomain: "codequest-6350a.firebaseapp.com",
  projectId: "codequest-6350a",
  storageBucket: "codequest-6350a.firebasestorage.app",
  messagingSenderId: "754471967280",
  appId: "1:754471967280:web:156c8081ac2b244060ebf5",
  measurementId: "G-H0HK362SEB"
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

// Keep the learner signed in across refreshes and browser restarts.
// Firebase Auth already defaults to local persistence, but setting it explicitly
// prevents a page or environment from silently using session-only persistence.
export const authPersistenceReady = setPersistence(
  auth,
  browserLocalPersistence
).catch(error => {
  console.warn("CodeQuest local auth persistence could not be confirmed:", error?.code || error);
  return false;
});
export const db = getFirestore(firebaseApp);

export const functions = getFunctions(
  firebaseApp,
  "europe-west1"
);
