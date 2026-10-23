
import { functions } from "./firebase-config.js";

import {
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";

const runCodeCallable = httpsCallable(
  functions,
  "runCode",
  {
    timeout: 40000
  }
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
    throw new Error("اكتبي الكود أولًا.");
  }

  if (code.length > 50000) {
    throw new Error("حجم الكود أكبر من الحد المسموح.");
  }

  const response = await runCodeCallable({
    language,
    code
  });

  if (!response?.data) {
    throw new Error("لم تصل نتيجة من خدمة التشغيل.");
  }

  return response.data;
}
