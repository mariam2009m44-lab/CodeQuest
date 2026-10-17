// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9ivRWhimK5APTUJBTFmf1FWx4W-Pv8gQ",
  authDomain: "codequest-6350a.firebaseapp.com",
  projectId: "codequest-6350a",
  storageBucket: "codequest-6350a.firebasestorage.app",
  messagingSenderId: "754471967280",
  appId: "1:754471967280:web:156c8081ac2b244060ebf5",
  measurementId: "G-H0HK362SEB"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    console.log("🔥 Firebase Initialized Successfully!");
} else {
    console.error("❌ Firebase SDK not loaded.");
}
