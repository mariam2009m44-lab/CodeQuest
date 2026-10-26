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
  getDocs,
  setDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";

const USERS_COLLECTION = "users";
const MIN_PASSWORD_LENGTH = 6;
const MAX_NAME_LENGTH = 50;

const SUPPORTED_LANGUAGES = [
  "python",
  "javascript",
  "cpp"
];

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

function validateLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new Error("لغة البرمجة غير مدعومة.");
  }
}

function validateLessonPosition(chapter, lesson) {
  if (
    !Number.isSafeInteger(chapter) ||
    chapter < 0 ||
    !Number.isSafeInteger(lesson) ||
    lesson < 0
  ) {
    throw new Error("بيانات الدرس غير صحيحة.");
  }
}

export function authError(error) {
  const messages = {
    "auth/invalid-email": "البريد الإلكتروني غير صحيح.",
    "auth/missing-email": "اكتبي البريد الإلكتروني.",
    "auth/missing-password": "اكتبي كلمة المرور.",
    "auth/invalid-credential":
      "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "auth/user-not-found": "لا يوجد حساب بهذه البيانات.",
    "auth/wrong-password": "كلمة المرور غير صحيحة.",
    "auth/email-already-in-use":
      "البريد الإلكتروني مسجل بالفعل.",
    "auth/weak-password": "اختاري كلمة مرور أقوى.",
    "auth/too-many-requests":
      "محاولات كثيرة. حاولي مرة أخرى لاحقًا.",
    "auth/network-request-failed":
      "تحققي من اتصال الإنترنت.",
    "auth/operation-not-allowed":
      "طريقة تسجيل الحساب غير مفعّلة في Firebase.",
    "auth/user-disabled": "هذا الحساب غير مفعّل.",
    "auth/invalid-action-code":
      "الرابط غير صالح أو انتهت صلاحيته.",
    "auth/expired-action-code":
      "انتهت صلاحية الرابط. اطلبي رابطًا جديدًا.",
    "permission-denied":
      "ليست لديك صلاحية الوصول إلى هذه البيانات.",
    "unavailable": "الخدمة غير متاحة حاليًا."
  };

  return messages[error?.code] ||
    error?.message ||
    "حدث خطأ غير متوقع. حاولي مرة أخرى.";
}

function normalizeError(error) {
  if (error instanceof Error && !error.code) {
    return error;
  }

  return new Error(authError(error));
}

/**
 * إنشاء الملف الشخصي إذا لم يكن موجودًا.
 */
export async function ensureUserProfile(user) {
  if (!user?.uid) {
    throw new Error("تعذر تحديد الحساب الحالي.");
  }

  try {
    const profileRef = doc(
      db,
      USERS_COLLECTION,
      user.uid
    );

    const snapshot = await getDoc(profileRef);

    if (snapshot.exists()) {
      return {
        uid: user.uid,
        ...snapshot.data()
      };
    }

    const suggestedName = user.displayName || "متعلم";
    const normalizedName = normalizeName(suggestedName);

    const displayName =
      normalizedName.length >= 2
        ? normalizedName
        : "متعلم";

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
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * إنشاء حساب جديد.
 */
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

/**
 * تسجيل الدخول.
 */
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

/**
 * إرسال رابط إعادة تعيين كلمة المرور.
 */
export async function resetPassword(email) {
  const cleanEmail = normalizeEmail(email);
  validateEmail(cleanEmail);

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * تسجيل الخروج ومسح مسودات الجلسة.
 */
export async function logoutUser() {
  try {
    await signOut(auth);

    const sessionKeys = [
      "currentProjectId",
      "currentProjectName",
      "playgroundCode",
      "playgroundLang"
    ];

    for (const key of sessionKeys) {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // تجاهل تعذر الوصول إلى sessionStorage.
      }
    }
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * انتظار تأكيد حالة تسجيل الدخول.
 */
export function requireUser() {
  return new Promise((resolve, reject) => {
    let unsubscribe = null;
    let settled = false;
    let cleanupPending = false;

    function finish(callback, value) {
      if (settled) return;

      settled = true;

      if (unsubscribe) {
        unsubscribe();
      } else {
        cleanupPending = true;
      }

      callback(value);
    }

    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          finish(resolve, user);
        } else {
          finish(
            reject,
            new Error("يجب تسجيل الدخول أولًا.")
          );
        }
      },
      (error) => {
        finish(reject, normalizeError(error));
      }
    );

    if (cleanupPending && unsubscribe) {
      unsubscribe();
    }
  });
}

/**
 * إرجاع المستخدم الحالي إن كان متاحًا.
 */
export function getCurrentUser() {
  return auth.currentUser;
}

function getLessonDocumentId(language, chapter, lesson) {
  return `${language}_${chapter}_${lesson}`;
}

/**
 * حفظ حالة إكمال الدرس في:
 * users/{uid}/lessonProgress/{language_chapter_lesson}
 */
export async function saveLessonProgress({
  language,
  chapter,
  lesson,
  completed = true
}) {
  validateLanguage(language);
  validateLessonPosition(chapter, lesson);

  if (typeof completed !== "boolean") {
    throw new Error("حالة إكمال الدرس غير صحيحة.");
  }

  // انتظري تأكيد حالة الحساب بدل الاعتماد على currentUser وحده.
  const user = await requireUser();

  if (!user?.uid) {
    throw new Error("سجّلي الدخول أولًا لحفظ تقدمك.");
  }

  try {
    const documentId = getLessonDocumentId(
      language,
      chapter,
      lesson
    );

    const progressRef = doc(
      db,
      USERS_COLLECTION,
      user.uid,
      "lessonProgress",
      documentId
    );

    await setDoc(
      progressRef,
      {
        language,
        chapter,
        lesson,
        completed,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    return {
      id: documentId,
      language,
      chapter,
      lesson,
      completed
    };
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * جلب الدروس المكتملة للغة محددة.
 */
export async function getLessonProgress(language) {
  validateLanguage(language);

  // انتظري تأكيد حالة الحساب قبل قراءة سجلات التقدم.
  const user = await requireUser();

  if (!user?.uid) {
    throw new Error("سجّلي الدخول أولًا لعرض تقدمك.");
  }

  try {
    const progressCollection = collection(
      db,
      USERS_COLLECTION,
      user.uid,
      "lessonProgress"
    );

    const snapshot = await getDocs(progressCollection);

    return snapshot.docs
      .map((item) => ({
        id: item.id,
        ...item.data()
      }))
      .filter((item) => item.language === language)
      .filter((item) =>
        Number.isSafeInteger(item.chapter) &&
        item.chapter >= 0 &&
        Number.isSafeInteger(item.lesson) &&
        item.lesson >= 0 &&
        item.completed === true
      );
  } catch (error) {
    throw normalizeError(error);
  }
}