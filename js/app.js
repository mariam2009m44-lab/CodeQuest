import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const initApp = () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            
            let userData = { displayName: user.displayName || user.email.split('@')[0], xp: 0, coins: 0 };
            if (userSnap.exists()) { userData = userSnap.data(); } 
            else { await setDoc(userRef, userData); }

            document.querySelectorAll('.js-user-name').forEach(el => el.textContent = userData.displayName);
            document.querySelectorAll('.js-user-xp').forEach(el => el.textContent = Number(userData.xp) || 0);
            document.querySelectorAll('.js-user-coins').forEach(el => el.textContent = Number(userData.coins) || 0);
            
            window.currentUser = user;
            window.currentUserData = userData;
        } else if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('lecture')) {
            window.location.href = 'login.html';
        }
    });
};

export const logoutUser = async () => {
    await signOut(auth);
    window.location.href = 'index.html';
};

export const addXP = async (amount) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, { xp: increment(amount) });
    if (window.currentUserData) window.currentUserData.xp = (Number(window.currentUserData.xp) || 0) + amount;
};

export const addCoins = async (amount) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, { coins: increment(amount) });
    if (window.currentUserData) window.currentUserData.coins = (Number(window.currentUserData.coins) || 0) + amount;
};

export { auth, db, doc, getDoc, setDoc, updateDoc, increment };
