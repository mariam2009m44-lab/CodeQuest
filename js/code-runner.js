
import { functions } from "./firebase-config.js";

import {
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";

const runCodeCallable = httpsCallable(
  functions,
  "runCode",
  { timeout: 40000 }
);

const verifyJavaCallable = httpsCallable(
  functions,
  "verifyJavaChallenge",
  { timeout: 45000 }
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
    const response = await runCodeCallable({
      language,
      code,
      stdin
    });

    if (!response || !response.data) {
      throw new Error("لم تصل نتيجة من خدمة تشغيل الأكواد.");
    }

    return response.data;
  } catch (error) {
    console.error("Code execution error:", error);

    const errorCode = String(error?.code || "")
      .replace(/^functions\//, "");

    if (errorCode === "unauthenticated") {
      throw new Error("سجّلي الدخول أولًا لتشغيل الأكواد.");
    }

    if (errorCode === "unavailable") {
      throw new Error("خدمة تشغيل الأكواد غير متاحة حاليًا.");
    }

    if (errorCode === "deadline-exceeded") {
      throw new Error(
        "استغرق تشغيل الكود وقتًا طويلًا. حاولي مرة أخرى."
      );
    }

    if (error instanceof Error && error.message) {
      throw error;
    }

    throw new Error(
      "تعذّر تشغيل الكود. تحققي من الاتصال بالإنترنت."
    );
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
      throw new Error("خدمة التحقق من Java غير متاحة حاليًا.");
    }
    if (code === "deadline-exceeded") {
      throw new Error("استغرق التحقق وقتًا طويلًا. حاول مرة أخرى.");
    }

    throw error instanceof Error && error.message
      ? error
      : new Error("تعذر التحقق من تحدي Java.");
  }
}
