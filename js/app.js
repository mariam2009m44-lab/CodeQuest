
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const initApp = () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            
            const nameElements = document.querySelectorAll('.js-user-name');
            let displayName = user.displayName || user.email.split('@')[0];
            
            nameElements.forEach(el => {
                el.textContent = displayName;
            });

            if (userSnap.exists()) {
                const data = userSnap.data();
                const xpElements = document.querySelectorAll('.js-user-xp');
                xpElements.forEach(el => el.textContent = data.xp || 0);
            }
        } else {
            if (window.location.pathname.includes('dashboard.html')) {
                window.location.href = 'login.html';
            }
        }
    });
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error(error);
    }
};

document.addEventListener('DOMContentLoaded', initApp);
