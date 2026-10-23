
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

const USERS_COLLECTION = "users";
const MIN_PASSWORD_LENGTH = 6;
const MAX_NAME_LENGTH = 50;

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function normalizeName(name) {
  return String(name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_NAME_LENGTH);
}

function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("اكتبي بريدًا إلكترونيًا صحيحًا.");
  }
}

function validatePassword(password) {
  if (
    typeof password !== "string" ||
    password.length < MIN_PASSWORD_LENGTH
  ) {
    throw new Error("كلمة المرور لازم تكون 6 أحرف على الأقل.");
  }
}

function validateName(name) {
  if (name.length < 2) {
    throw new Error("اكتبي اسمًا مكوّنًا من حرفين على الأقل.");
  }
}

export function authError(error) {
  const messages = {
    "auth/invalid-email": "البريد الإلكتروني غير صحيح.",
    "auth/missing-email": "اكتبي البريد الإلكتروني.",
    "auth/missing-password": "اكتبي كلمة المرور.",
    "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "auth/user-not-found": "لا يوجد حساب بهذه البيانات.",
    "auth/wrong-password": "كلمة المرور غير صحيحة.",
    "auth/email-already-in-use": "البريد الإلكتروني مسجل بالفعل.",
    "auth/weak-password": "اختاري كلمة مرور أقوى.",
    "auth/too-many-requests": "محاولات كثيرة. حاولي مرة أخرى لاحقًا.",
    "auth/network-request-failed": "تحققي من اتصال الإنترنت.",
    "auth/operation-not-allowed": "طريقة تسجيل الحساب غير مفعّلة في Firebase.",
    "auth/user-disabled": "هذا الحساب غير مفعّل.",
    "auth/invalid-action-code": "الرابط غير صالح أو انتهت صلاحيته.",
    "auth/expired-action-code": "انتهت صلاحية الرابط. اطلبي رابطًا جديدًا.",
    "permission-denied": "ليست لديك صلاحية الوصول إلى هذه البيانات.",
    "unavailable": "الخدمة غير متاحة حاليًا."
  };

  return messages[error?.code] || "حدث خطأ غير متوقع. حاولي مرة أخرى.";
}

function normalizeError(error) {
  if (error instanceof Error && !error.code) {
    return error;
  }

  return new Error(authError(error));
}

export async function ensureUserProfile(user) {
  if (!user?.uid) {
    throw new Error("تعذر تحديد الحساب الحالي.");
  }

  const profileRef = doc(db, USERS_COLLECTION, user.uid);
  const snapshot = await getDoc(profileRef);

  if (snapshot.exists()) {
    return {
      uid: user.uid,
      ...snapshot.data()
    };
  }

  const displayName = normalizeName(
    user.displayName ||
    user.email?.split("@")[0] ||
    "متعلم"
  ) || "متعلم";

  const profile = {
    uid: user.uid,
    displayName,
    email: normalizeEmail(user.email),
    xp: 0,
    coins: 0,
    level: 1,
    completedLessons: 0,
    completedProjects: 0,
    streak: 0,
    languageProgress: {
      python: 0,
      javascript: 0,
      cpp: 0
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(profileRef, profile);

  return profile;
}

export async function registerUser(name, email, password) {
  const cleanName = normalizeName(name);
  const cleanEmail = normalizeEmail(email);

  validateName(cleanName);
  validateEmail(cleanEmail);
  validatePassword(password);

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );

    await updateProfile(credential.user, {
      displayName: cleanName
    });

    await ensureUserProfile(credential.user);

    return credential.user;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function loginUser(email, password) {
  const cleanEmail = normalizeEmail(email);

  validateEmail(cleanEmail);
  validatePassword(password);

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );

    await ensureUserProfile(credential.user);

    return credential.user;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function resetPassword(email) {
  const cleanEmail = normalizeEmail(email);
  validateEmail(cleanEmail);

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    throw normalizeError(error);
  }
}

export function requireUser() {
  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};
    let settled = false;

    const finish = callback => value => {
      if (settled) return;
      settled = true;
      unsubscribe();
      callback(value);
    };

    const resolveOnce = finish(resolve);
    const rejectOnce = finish(reject);

    unsubscribe = onAuthStateChanged(
      auth,
      user => {
        if (user) {
          resolveOnce(user);
        } else {
          rejectOnce(new Error("يجب تسجيل الدخول أولًا."));
        }
      },
      error => rejectOnce(normalizeError(error))
    );
  });
}

export function getCurrentUser() {
  return auth.currentUser;
}
