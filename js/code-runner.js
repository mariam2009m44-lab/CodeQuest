import { functions } from "./firebase-config.js";

import {
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";

const runCodeCallable = httpsCallable(
  functions,
  "runCode",
  { timeout: 40000 }
);

const ALLOWED_LANGUAGES = new Set([
  "javascript",
  "python",
  "cpp"
]);

export async function runCodeOnServer(language, code) {
  if (!ALLOWED_LANGUAGES.has(language)) {
    throw new Error("لغة البرمجة غير مدعومة.");
  }

  if (typeof code !== "string" || !code.trim()) {
    throw new Error("اكتبي الكود أولًا قبل التشغيل.");
  }

  if (code.length > 50000) {
    throw new Error("حجم الكود أكبر من الحد المسموح.");
  }

  try {
    const response = await runCodeCallable({
      language,
      code
    });

    if (!response || !response.data) {
      throw new Error("لم تصل نتيجة من خدمة تشغيل الأكواد.");
    }

    return response.data;
  } catch (error) {
    console.error("Code execution error:", error);

    if (error?.code === "unauthenticated") {
      throw new Error("سجّلي الدخول أولًا لتشغيل الأكواد.");
    }

    if (error?.code === "unavailable") {
      throw new Error("خدمة تشغيل الأكواد غير متاحة حاليًا.");
    }

    if (error?.code === "deadline-exceeded") {
      throw new Error("استغرق تشغيل الكود وقتًا طويلًا. حاولي مرة أخرى.");
    }

    if (error instanceof Error && error.message) {
      throw error;
    }

    throw new Error(
      "تعذّر تشغيل الكود. تحققي من الاتصال بالإنترنت."
    );
  }
}