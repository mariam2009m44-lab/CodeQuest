const { initializeApp } = require("firebase-admin/app");
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
