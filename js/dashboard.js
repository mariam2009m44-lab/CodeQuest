import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// تأكد إن إعدادات Firebase موجودة (لو مش موجودة، ممكن تضيفها هنا)
const firebaseConfig = window.firebaseConfig || {
    // حط الـ config بتاعك هنا لو مش متسجل
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        
    // تحديث اسم المستخدم في الواجهة
    const userNameEl = document.getElementById('user-name-display');
    if (userNameEl) {
        userNameEl.innerText = user.displayName || "بطل CodeQuest";
    }
    
                if (docSnap.exists()) {
            const data = docSnap.data();
            // تحديث الأرقام في الواجهة
            document.querySelector('.stat-item:nth-child(1) .stat-value').innerText = data.streak || 0;
            document.querySelector('.stat-item:nth-child(2) .stat-value').innerText = data.completedLessons || 0;
            
            const xp = data.xp || 0;
            const level = Math.floor(xp / 100) + 1;
            const nextLevelXp = level * 100;
            const xpPercentage = (xp / nextLevelXp) * 100;

            document.querySelector('.xp-header span:nth-child(1)').innerText = `المستوى ${level}`;
            document.querySelector('.xp-header span:nth-child(2)').innerText = `${xp} / ${nextLevelXp} XP`;

            setTimeout(() => {
                document.getElementById('xp-progress-bar').style.width = `${xpPercentage}%`;
            }, 500);
        }
    }
});
