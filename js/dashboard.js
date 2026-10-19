
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// ملاحظة: بنفترض إنك بتستخدم Firebase v9. لو بتستخدم v8 هنعدل الكود.
// لازم تتأكد إن الـ firebaseConfig متسجل في مكان ما أو تعدله هنا.
const firebaseConfig = window.firebaseConfig || { /* حط إعداداتك هنا لو مش متسجلة */ };

try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("👤 المستخدم مسجل دخول:", user.uid);
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log("📊 بيانات المستخدم:", data);
                
                // تحديث الأرقام في الواجهة
                updateDashboardUI(data);
            } else {
                console.log("⚠️ لا توجد بيانات لهذا المستخدم في قاعدة البيانات.");
            }
        } else {
            console.log("👤 لا يوجد مستخدم مسجل دخول حالياً.");
            // ممكن تحوله لصفحة تسجيل الدخول هنا
            // window.location.href = 'login.html';
        }
    });
} catch (error) {
    console.error("❌ خطأ في إعداد Firebase:", error);
}

function updateDashboardUI(data) {
    // الأرقام دي افتراضية لو المستخدم جديد
    const streak = data.streak || 0;
    const completedLessons = data.completedLessons || 0;
    const xp = data.xp || 0;
    const level = Math.floor(xp / 100) + 1;
    const nextLevelXp = level * 100;
    const xpPercentage = (xp / nextLevelXp) * 100;

    // تحديث الـ HTML
    // 1. الأيام المتتالية (Streak)
    const streakEl = document.querySelector('.stat-item:nth-child(1) .stat-value');
    if (streakEl) streakEl.innerText = streak;

    // 2. الدروس المكتملة
    const lessonsEl = document.querySelector('.stat-item:nth-child(2) .stat-value');
    if (lessonsEl) lessonsEl.innerText = completedLessons;

    // 3. شريط الخبرة (XP)
    const xpBar = document.getElementById('xp-progress-bar');
    const xpText = document.querySelector('.xp-header span:nth-child(2)');
    const levelText = document.querySelector('.xp-header span:nth-child(1)');

    if (xpText) xpText.innerText = `${xp} / ${nextLevelXp} XP`;
    if (levelText) levelText.innerText = `المستوى ${level}`;
    
    // تحريك الشريط بعد ثانية عشان الأنيميشن يبان
    if (xpBar) {
        setTimeout(() => {
            xpBar.style.width = `${xpPercentage}%`;
        }, 500);
    }
}
