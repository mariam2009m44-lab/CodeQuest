
import { auth, db } from "./firebase-config.js";
import {
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

await setPersistence(auth, browserLocalPersistence);

export const authReady = new Promise((resolve, reject) => {
  let unsubscribe;
  unsubscribe = onAuthStateChanged(
    auth,
    user => {
      unsubscribe?.();
      resolve(user);
    },
    reject
  );
});

export function authError(error) {
  const messages = {
    "auth/invalid-email": "البريد الإلكتروني غير صحيح.",
    "auth/email-already-in-use": "البريد الإلكتروني مستخدم بالفعل.",
    "auth/weak-password": "كلمة المرور ضعيفة.",
    "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "auth/too-many-requests": "محاولات كثيرة. انتظري قليلًا ثم أعيدي المحاولة.",
    "permission-denied": "صلاحيات قاعدة البيانات لا تسمح بهذه العملية."
  };

  return messages[error?.code] || "تعذر تنفيذ العملية. حاولي مرة أخرى.";
}

function validateEmail(email) {
  const value = String(email || "").trim();

  if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("اكتبي بريدًا إلكترونيًا صحيحًا.");
  }

  return value;
}

export async function ensureUserProfile(user, displayName = "") {
  const reference = doc(db, "users", user.uid);

  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference);

    if (snapshot.exists()) return;

    const name = String(displayName || user.displayName || "متعلم")
      .trim()
      .slice(0, 50);

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

  if (displayName.length < 2 || displayName.length > 50) {
    throw new Error("الاسم المستعار من حرفين إلى 50 حرفًا.");
  }

  if (typeof password !== "string" || password.length < 6) {
    throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
  }

  const cleanEmail = validateEmail(email);

  const credential = await createUserWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

  await updateProfile(credential.user, { displayName });
  await ensureUserProfile(credential.user, displayName);

  return credential.user;
}

export async function loginUser(email, password) {
  const cleanEmail = validateEmail(email);

  const credential = await signInWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

  await ensureUserProfile(credential.user);

  return credential.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, validateEmail(email));
}

export async function requireUser() {
  const user = await authReady;

  if (!user) {
    const currentPage = location.pathname.split("/").pop();
    const next = currentPage && /^[a-zA-Z0-9_-]+\.html$/.test(currentPage)
      ? currentPage + location.search
      : "dashboard.html";

    location.replace(`login.html?next=${encodeURIComponent(next)}`);
    throw new Error("يجب تسجيل الدخول.");
  }

  return user;
}

export async function logoutUser() {
  await signOut(auth);
  location.replace("index.html");
}
