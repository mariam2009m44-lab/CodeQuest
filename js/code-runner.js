
import { functions } from "./firebase-config.js";

import {
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";

import { auth } from "./firebase-config.js";
import { requireUser } from "./auth.js";

const PRODUCTION_CODE_RUNNER_URL =
  "https://codequest.mariam2009m44.workers.dev";

const PREVIEW_CODE_RUNNER_URL =
  "https://fix-cloudflare-code-runner-codequest.mariam2009m44.workers.dev";

// Keep Pages preview requests on the matching preview Worker so its CORS
// allow-list and preview curriculum are used. Production remains unchanged.
const CODE_RUNNER_URL =
  window.location.hostname === "codequest-preview.pages.dev"
    ? PREVIEW_CODE_RUNNER_URL
    : PRODUCTION_CODE_RUNNER_URL;

const verifyJavaCallable = httpsCallable(
  functions,
  "verifyJavaChallenge",
  { timeout: 45000 }
);

const checkQuizCallable = httpsCallable(
  functions,
  "checkQuizAnswer",
  { timeout: 30000 }
);

const ALLOWED_LANGUAGES = new Set([
  "javascript",
  "python",
  "cpp",
  "java"
]);

export async function runCodeOnServer(language, code, stdin = "") {
  if (!ALLOWED_LANGUAGES.has(language)) {
    throw new Error("لغة البرمجة غير مدعومة.");
  }

  if (typeof code !== "string" || !code.trim()) {
    throw new Error("اكتبي الكود أولًا قبل التشغيل.");
  }

  if (code.length > 50000) {
    throw new Error("حجم الكود أكبر من الحد المسموح.");
  }

  if (typeof stdin !== "string" || stdin.length > 10000) {
    throw new Error("بيانات الإدخال طويلة جدًا أو غير صالحة.");
  }

  try {
    const user = auth.currentUser || await requireUser();
    const idToken = await user.getIdToken();

    const response = await fetch(`${CODE_RUNNER_URL}/api/code/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({
        language,
        code,
        stdin
      })
    });

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error("وصل رد غير مفهوم من خدمة تشغيل الأكواد.");
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("انتهت جلسة تسجيل الدخول. سجّلي الدخول مرة أخرى.");
      }

      throw new Error(
        result?.message || "خدمة تشغيل الأكواد غير متاحة حاليًا."
      );
    }

    if (!result || typeof result.ok !== "boolean") {
      throw new Error(
        result?.message || "لم تصل نتيجة صحيحة من خدمة تشغيل الأكواد."
      );
    }

    return result;
  } catch (error) {
    console.error("Code execution error:", error);

    if (error instanceof Error && error.message) {
      throw error;
    }

    throw new Error(
      "تعذّر تشغيل الكود. تحققي من الاتصال بالإنترنت."
    );
  }
}


/**
 * Verify a lesson quiz through the preview Worker.
 * The Worker loads the published curriculum and checks the selected answer
 * on the server, so lesson completion does not depend on a Firebase callable.
 */
export async function checkQuizAnswerOnServer({
  language,
  lessonId,
  selectedIndex
}) {
  if (!ALLOWED_LANGUAGES.has(language) || language === "java") {
    throw new Error("لغة المنهج غير مدعومة للتحقق من هذا السؤال.");
  }

  if (
    typeof lessonId !== "string" ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(lessonId) ||
    !Number.isInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex > 20
  ) {
    throw new Error("بيانات السؤال أو الاختيار غير صحيحة.");
  }

  try {
    const response = await checkQuizCallable({ language, lessonId, selectedIndex });
    if (!response?.data || response.data.success !== true) {
      throw new Error("لم تصل نتيجة صحيحة من خادم التحقق.");
    }
    return response.data;
  } catch (error) {
    console.error("Lesson quiz verification error:", error);
    if (error instanceof Error && error.message) throw error;
    throw new Error("تعذر الاتصال بخدمة التحقق من السؤال.");
  }
}


/**
 * Verify a Java learning challenge on the server.
 * The server checks required code, executes it, and compares the expected output.
 */
export async function verifyJavaChallenge(chapter, lesson, code) {
  if (!Number.isInteger(chapter) || chapter < 0 || chapter >= 8) {
    throw new Error("رقم فصل Java غير صالح.");
  }

  if (!Number.isInteger(lesson) || lesson < 0 || lesson >= 2) {
    throw new Error("رقم درس Java غير صالح.");
  }

  if (typeof code !== "string" || !code.trim() || code.length > 50000) {
    throw new Error("اكتب كود Java صالحًا قبل التحقق.");
  }

  try {
    const response = await verifyJavaCallable({ chapter, lesson, code });

    if (!response?.data) {
      throw new Error("لم تصل نتيجة التحقق من خادم Java.");
    }

    return response.data;
  } catch (error) {
    console.error("Java challenge verification failed:", error);

    const code = String(error?.code || "").replace(/^functions\//, "");
    if (code === "unauthenticated") {
      throw new Error("سجّل الدخول أولًا للتحقق من تحديات Java.");
    }
    if (code === "unavailable") {
      const mappedError = new Error("خدمة التحقق من Java غير متاحة حاليًا.");
      mappedError.code = error?.code;
      throw mappedError;
    }
    if (code === "deadline-exceeded") {
      const mappedError = new Error("استغرق التحقق وقتًا طويلًا. حاول مرة أخرى.");
      mappedError.code = error?.code;
      throw mappedError;
    }

    throw error instanceof Error && error.message
      ? error
      : new Error("تعذر التحقق من تحدي Java.");
  }
}
