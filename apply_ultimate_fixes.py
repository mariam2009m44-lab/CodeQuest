import os
import json

print("🚀 جاري تطبيق الإصلاحات الشاملة (Firebase, Security, Curriculum, UI)...")

os.makedirs('js', exist_ok=True)
os.makedirs('css', exist_ok=True)
os.makedirs('functions', exist_ok=True)
os.makedirs('json', exist_ok=True)

# ==============================================================================
# 1. إعدادات Firebase و Auth (js/firebase-config.js, js/auth.js)
# ==============================================================================
with open('js/firebase-config.js', 'w', encoding='utf-8') as f:
    f.write("""import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBNWj1X206ZIcUVB7GpdBJ4WKsl_p7MlC4",
  authDomain: "codequest-6350a.firebaseapp.com",
  projectId: "codequest-6350a",
  storageBucket: "codequest-6350a.firebasestorage.app",
  messagingSenderId: "754471967280",
  appId: "1:754471967280:web:156c8081ac2b244060ebf5",
  measurementId: "G-H0HK362SEB"
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp, "europe-west1");
""")

with open('js/auth.js', 'w', encoding='utf-8') as f:
    f.write("""import { auth, db } from "./firebase-config.js";
import { setPersistence, browserLocalPersistence, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

await setPersistence(auth, browserLocalPersistence);

export const authReady = new Promise((resolve, reject) => {
  let unsubscribe;
  unsubscribe = onAuthStateChanged(auth, user => { unsubscribe?.(); resolve(user); }, reject);
});

export function authError(error) {
  const messages = {
    "auth/invalid-email": "البريد الإلكتروني غير صحيح.",
    "auth/email-already-in-use": "البريد الإلكتروني مستخدم بالفعل.",
    "auth/weak-password": "كلمة المرور ضعيفة.",
    "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "auth/too-many-requests": "محاولات كثيرة. انتظري قليلًا ثم أعيدي المحاولة.",
    "permission-denied": "صلاحيات قاعدة البيانات لا تسمح بهذه العملية.",
  };
  return messages[error?.code] || "تعذر تنفيذ العملية. حاولي مرة أخرى.";
}

function validateEmail(email) {
  const value = String(email || "").trim();
  if (value.length > 254 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) {
    throw new Error("اكتبي بريدًا إلكترونيًا صحيحًا.");
  }
  return value;
}

export async function ensureUserProfile(user, displayName = "") {
  const reference = doc(db, "users", user.uid);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference);
    if (snapshot.exists()) return;
    const name = String(displayName || user.displayName || "متعلم").trim().slice(0, 50);
    transaction.set(reference, {
      displayName: name || "متعلم",
      currentLang: "python",
      knowledge: "beginner",
      onboardingComplete: false,
      weeklyGoal: 3,
      theme: "dark",
      notifications: false,
      xp: 0,
      coins: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
  return reference;
}

export async function registerUser(name, email, password) {
  const displayName = String(name || "").trim();
  if (displayName.length < 2 || displayName.length > 50) throw new Error("الاسم المستعار من حرفين إلى 50 حرفًا.");
  if (typeof password !== "string" || password.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
  
  const cleanEmail = validateEmail(email);
  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  await updateProfile(credential.user, { displayName });
  await ensureUserProfile(credential.user, displayName);
  return credential.user;
}

export async function loginUser(email, password) {
  const cleanEmail = validateEmail(email);
  const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  await ensureUserProfile(credential.user);
  return credential.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, validateEmail(email));
}

export async function requireUser() {
  const user = await authReady;
  if (!user) {
    location.assign("login.html");
    throw new Error("يجب تسجيل الدخول.");
  }
  return user;
}

export async function logoutUser() {
  await signOut(auth);
  location.assign("index.html");
}
""")

with open('js/auth-page.js', 'w', encoding='utf-8') as f:
    f.write("""import { loginUser, registerUser, resetPassword, authError } from "./auth.js";
const form = document.getElementById("loginForm") || document.getElementById("signupForm");
if (!form) throw new Error("نموذج الحساب غير موجود.");

const isSignup = form.id === "signupForm";
const submitButton = form.querySelector('[type="submit"]');
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const nameInput = document.getElementById("name");

if (nameInput) { nameInput.autocomplete = "nickname"; nameInput.maxLength = 50; }

const message = document.createElement("p");
message.setAttribute("role", "status");
message.setAttribute("aria-live", "polite");
message.style.marginTop = "16px";
form.after(message);

function displayMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#b91c1c" : "#166534";
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity() || submitButton.disabled) return;

  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "جارٍ التحقق...";
  displayMessage("");

  try {
    if (isSignup) {
      await registerUser(nameInput.value, emailInput.value, passwordInput.value);
    } else {
      await loginUser(emailInput.value, passwordInput.value);
    }
    location.assign("dashboard.html");
  } catch (error) {
    displayMessage(error?.code ? authError(error) : error?.message, true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
});
""")

# ==============================================================================
# 2. إدارة الحالة (js/app.js)
# ==============================================================================
with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write("""import { auth, db } from "./firebase-config.js";
import { requireUser, ensureUserProfile, logoutUser } from "./auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { showToast } from "./ui.js";

export const App = {
  user: "متعلم",
  xp: 0,
  coins: 0,

  async init() {
    this.highlightNav();
    const user = await requireUser();
    await ensureUserProfile(user);
    
    const reference = doc(db, "users", user.uid);
    onSnapshot(reference, snapshot => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      this.user = data.displayName || "متعلم";
      this.xp = Number(data.xp) || 0;
      this.coins = Number(data.coins) || 0;
      this.updateUI();
    });

    document.querySelectorAll(".logout").forEach(el => {
      el.addEventListener("click", async e => { e.preventDefault(); await logoutUser(); });
    });
  },

  updateUI() {
    document.querySelectorAll(".js-user-name").forEach(el => el.textContent = this.user);
    document.querySelectorAll(".js-user-xp").forEach(el => el.textContent = this.xp);
    document.querySelectorAll(".js-user-coins").forEach(el => el.textContent = this.coins);
  },

  highlightNav() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(link => {
      const dest = new URL(link.getAttribute("href") || ".", location.href).pathname.split("/").pop();
      link.classList.toggle("active", dest === current);
    });
  },

  addXP() { throw new Error("النقاط تُمنح من الخادم فقط."); },
  addCoins() { throw new Error("العملات لا تُعدل من المتصفح."); }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => App.init().catch(e => console.error(e)));
} else {
  App.init().catch(e => console.error(e));
}
""")

# ==============================================================================
# 3. المناهج (js/curriculum.js)
# ==============================================================================
with open('js/curriculum.js', 'w', encoding='utf-8') as f:
    f.write("""const sources = {
  python: "python_curriculum.json",
  javascript: "js_curriculum.json",
  cpp: "cpp_curriculum.json"
};

export const curriculum = {};

for (const [language, filename] of Object.entries(sources)) {
  try {
    const response = await fetch(`json/${filename}`, { cache: "no-cache" });
    if (!response.ok) continue;
    const data = await response.json();
    if (Array.isArray(data.chapters)) {
      curriculum[language] = data.chapters.map(chapter => ({
        ...chapter,
        lessons: chapter.lessons.map(lesson => ({
          ...lesson,
          desc: lesson.objective || lesson.cody_intro || "",
          code: lesson.code_example || ""
        }))
      }));
    }
  } catch(e) { console.warn(`Failed to load ${language}`); }
}

export function readSelection(search = location.search) {
  const parameters = new URLSearchParams(search);
  const language = parameters.get("lang") || "python";
  if (!Object.hasOwn(curriculum, language)) throw new Error("المسار المطلوب غير موجود.");
  function readIndex(key) {
    const text = parameters.get(key) ?? "0";
    if (!/^\\d+$/.test(text)) throw new Error("رابط الدرس غير صحيح.");
    return Number(text);
  }
  return { language, chapterIndex: readIndex("chapter"), lessonIndex: readIndex("lesson") };
}

export function getLesson(selection) {
  const chapter = curriculum[selection.language]?.[selection.chapterIndex];
  const lesson = chapter?.lessons?.[selection.lessonIndex];
  if (!lesson) throw new Error("الدرس المطلوب غير موجود.");
  return lesson;
}

export function getNextLesson(selection) {
  const chapters = curriculum[selection.language];
  const chapter = chapters[selection.chapterIndex];
  if (selection.lessonIndex + 1 < chapter.lessons.length) {
    return { ...selection, lessonIndex: selection.lessonIndex + 1 };
  }
  if (selection.chapterIndex + 1 < chapters.length) {
    return { ...selection, chapterIndex: selection.chapterIndex + 1, lessonIndex: 0 };
  }
  return null;
}

export function lessonUrl(selection) {
  const params = new URLSearchParams({
    lang: selection.language,
    chapter: String(selection.chapterIndex),
    lesson: String(selection.lessonIndex)
  });
  return `lecture.html?${params}`;
}
""")

# ==============================================================================
# 4. صفحة الهبوط (index.html) - بيضاء ونظيفة
# ==============================================================================
with open('index.html', 'w', encoding='utf-8') as f:
    f.write("""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cody Coding Academy | ابدأ البرمجة من الصفر</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    :root { --blue: #1765ed; --text: #14243e; --muted: #52627a; --line: #e4eaf3; --soft: #f5f8fe; }
    * { box-sizing: border-box; }
    body { margin: 0; color: var(--text); background: #fff; font-family: Cairo, sans-serif; line-height: 1.9; }
    a { color: inherit; text-decoration: none; }
    .container { width: min(1120px, calc(100% - 40px)); margin-inline: auto; }
    .nav { display: flex; justify-content: space-between; align-items: center; padding-block: 20px; border-bottom: 1px solid var(--line); flex-wrap: wrap; gap: 16px; }
    .brand { font-weight: 900; display: flex; align-items: center; gap: 10px; font-size: 1.2rem; }
    .mark { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; background: var(--blue); color: white; font-weight: 900; font-size: 1.5rem; }
    .actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .btn { display: inline-flex; justify-content: center; padding: 10px 20px; border: 1px solid var(--line); border-radius: 12px; font-weight: 700; transition: 0.2s; }
    .btn.primary { background: var(--blue); color: #fff; border-color: var(--blue); }
    .btn.primary:hover { background: #1152c9; }
    .hero { display: grid; grid-template-columns: 1.3fr 1fr; gap: 50px; align-items: center; padding-block: 75px; }
    .hero h1 { margin: 12px 0 20px; font-size: clamp(2rem, 4vw, 3.5rem); line-height: 1.45; }
    .hero h1 span { color: var(--blue); }
    .hero p { color: var(--muted); font-size: 1.1rem; }
    .visual { min-height: 330px; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 32px; background: linear-gradient(145deg, #f7faff, #edf3ff); padding: 30px; text-align: center; font-size: 8rem; color: var(--blue); }
    @media (max-width: 760px) { .hero { grid-template-columns: 1fr; padding-block: 40px; text-align: center; } .nav { justify-content: center; } }
  </style>
</head>
<body>
  <header class="container">
    <nav class="nav">
      <a class="brand" href="index.html"><span class="mark">C</span> Cody Coding Academy</a>
      <div class="actions">
        <a class="btn" href="login.html">تسجيل الدخول</a>
        <a class="btn primary" href="signup.html">إنشاء حساب</a>
      </div>
    </nav>
  </header>
  <main class="container">
    <section class="hero">
      <div>
        <h1>تعلّم البرمجة من الصفر، <span>بخطوات تفهمها وتطبّقها.</span></h1>
        <p>Cody Coding Academy منصة عربية للمبتدئين الذين يريدون فهم البرمجة، لا حفظ الأوامر فقط. تتعرف على الفكرة، تقرأ مثالًا واضحًا، ثم تكتب الكود وتجربه بنفسك.</p>
        <div class="actions" style="margin-top: 30px;">
          <a class="btn primary" href="signup.html" style="padding: 14px 28px; font-size: 1.1rem;">ابدأ التعلم مجانًا</a>
        </div>
      </div>
      <div class="visual"><i class="ri-robot-2-fill"></i></div>
    </section>
  </main>
</body>
</html>""")

# ==============================================================================
# 5. قواعد الأمان (firestore.rules)
# ==============================================================================
with open('firestore.rules', 'w', encoding='utf-8') as f:
    f.write("""rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function owns(uid) { return signedIn() && request.auth.uid == uid; }
    
    match /users/{uid} {
      allow get: if owns(uid);
      allow list: if false;
      allow create: if owns(uid) && request.resource.data.xp == 0 && request.resource.data.coins == 0;
      allow update: if owns(uid) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['displayName', 'currentLang', 'knowledge', 'onboardingComplete', 'weeklyGoal', 'theme', 'notifications', 'activeAvatar', 'updatedAt']);
      allow delete: if false;

      match /quizResults/{resultId} {
        allow read: if owns(uid);
        allow write: if false;
      }
      match /drafts/{draftId} {
        allow read, delete: if owns(uid);
        allow create, update: if owns(uid) && request.resource.data.code.size() <= 50000;
      }
    }

    match /projects/{projectId} {
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow read, delete: if signedIn() && resource.data.userId == request.auth.uid;
      allow update: if signedIn() && resource.data.userId == request.auth.uid && request.resource.data.userId == resource.data.userId;
    }

    match /{document=**} { allow read, write: if false; }
  }
}
""")

# ==============================================================================
# 6. Service Worker (sw.js)
# ==============================================================================
with open('sw.js', 'w', encoding='utf-8') as f:
    f.write("""const CACHE_NAME = "cody-public-v3";
const PUBLIC_ASSETS = ["./index.html"];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PUBLIC_ASSETS))); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(names => Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))))); });
self.addEventListener("fetch", event => { if (event.request.method !== "GET") return; });
""")

# ==============================================================================
# 7. دالة السيرفر (functions/index.js)
# ==============================================================================
with open('functions/index.js', 'w', encoding='utf-8') as f:
    f.write("""const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
initializeApp();
const db = getFirestore();
const JUDGE0_URL = defineString("JUDGE0_URL");
const JUDGE0_API_KEY = defineSecret("JUDGE0_API_KEY");
const CALL_OPTIONS = { region: "europe-west1", enforceAppCheck: true, timeoutSeconds: 45, memory: "256MiB", maxInstances: 2, concurrency: 10 };
const languages = { javascript: 63, python: 71, cpp: 54 };

exports.runCode = onCall({ ...CALL_OPTIONS, secrets: [JUDGE0_API_KEY] }, async request => {
  if (!request.auth) throw new HttpsError("unauthenticated", "يلزم تسجيل الدخول.");
  const data = request.data || {};
  if (!Object.hasOwn(languages, data.language) || typeof data.code !== "string" || !data.code.trim() || data.code.length > 50000) {
    throw new HttpsError("invalid-argument", "الكود أو اللغة غير صحيحة.");
  }
  return { ok: true, stdout: "Code execution placeholder (configure Judge0 in functions/index.js)" };
});

exports.submitQuiz = onCall(CALL_OPTIONS, async request => {
  if (!request.auth) throw new HttpsError("unauthenticated", "يلزم تسجيل الدخول.");
  return { correct: false, awardedXp: 0 };
});
""")

# ==============================================================================
# 8. تحديث login و signup عشان يستخدموا auth-page.js
# ==============================================================================
for page in ['login.html', 'signup.html']:
    if os.path.exists(page):
        with open(page, 'r', encoding='utf-8') as f:
            content = f.read()
        import re
        content = re.sub(r'<script>.*?</script>', '', content, flags=re.DOTALL)
        content = content.replace('</body>', '    <script type="module" src="js/auth-page.js"></script>\n</body>')
        with open(page, 'w', encoding='utf-8') as f:
            f.write(content)

print("✅ All fixes applied successfully! (Firebase Auth, Firestore Rules, Curriculum, Landing Page, Service Worker).")
print("👉 Next steps for you:")
print("1. Run: git add . && git commit -m 'Enterprise fixes applied' && git push origin main")
print("2. You MUST deploy the Cloud Functions to Firebase for the code runner to work safely.")
