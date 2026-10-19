import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";



const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const initApp = () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            
            let userData = {
                displayName: user.displayName || user.email.split('@')[0],
                xp: 0,
                coins: 0
            };

            if (userSnap.exists()) {
                userData = userSnap.data();
            } else {
                await setDoc(userRef, userData);
            }

            document.querySelectorAll('.js-user-name').forEach(el => el.textContent = userData.displayName);
            document.querySelectorAll('.js-user-xp').forEach(el => el.textContent = userData.xp);
            document.querySelectorAll('.js-user-coins').forEach(el => el.textContent = userData.coins);
            
            window.currentUser = user;
            window.currentUserData = userData;
        } else {
            if (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('profile.html') || window.location.pathname.includes('lecture.html')) {
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

export const addXP = async (amount) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, { xp: increment(amount) });
    if (window.currentUserData) {
        window.currentUserData.xp += amount;
        document.querySelectorAll('.js-user-xp').forEach(el => el.textContent = window.currentUserData.xp);
    }
};

export const addCoins = async (amount) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    await updateDoc(userRef, { coins: increment(amount) });
    if (window.currentUserData) {
        window.currentUserData.coins += amount;
        document.querySelectorAll('.js-user-coins').forEach(el => el.textContent = window.currentUserData.coins);
    }
};

export { auth, db, doc, getDoc, setDoc, updateDoc, increment };
