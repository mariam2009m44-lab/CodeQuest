
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue
} = require("firebase-admin/firestore");

const {
  onCall,
  HttpsError
} = require("firebase-functions/v2/https");

const { defineString } = require("firebase-functions/params");

const {
  onDocumentWritten
} = require("firebase-functions/v2/firestore");

initializeApp();

const db = getFirestore();

const JUDGE0_URL = defineString("JUDGE0_URL", {
  default: "https://ce.judge0.com"
});

const CALL_OPTIONS = {
  region: "europe-west1",
  timeoutSeconds: 45,
  memory: "256MiB",
  maxInstances: 3,
  concurrency: 10
};

const LANGUAGES = Object.freeze({
  javascript: 63,
  python: 71,
  cpp: 54
});

function requireAuth(request) {
  if (!request.auth?.uid) {
    throw new HttpsError(
      "unauthenticated",
      "سجّلي الدخول أولًا."
    );
  }

  return request.auth.uid;
}

function validateCodeInput(data) {
  if (
    !data ||
    typeof data.language !== "string" ||
    !Object.prototype.hasOwnProperty.call(
      LANGUAGES,
      data.language
    )
  ) {
    throw new HttpsError(
      "invalid-argument",
      "لغة البرمجة غير مدعومة."
    );
  }

  if (
    typeof data.code !== "string" ||
    !data.code.trim() ||
    data.code.length > 50000
  ) {
    throw new HttpsError(
      "invalid-argument",
      "اكتبي كودًا صالحًا لا يتجاوز 50000 حرف."
    );
  }
}

function safeOutput(value) {
  if (typeof value !== "string") return "";
  return value.slice(0, 20000);
}

exports.runCode = onCall(
  CALL_OPTIONS,
  async request => {
    requireAuth(request);

    const data = request.data || {};
    validateCodeInput(data);

    const baseUrl = JUDGE0_URL.value().replace(/\/+$/, "");
    const endpoint =
      `${baseUrl}/submissions` +
      "?base64_encoded=false&wait=true";

    let response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source_code: data.code,
          language_id: LANGUAGES[data.language],
          stdin: ""
        }),
        signal: AbortSignal.timeout(35000)
      });
    } catch (error) {
      console.error("Judge0 connection error:", error);

      throw new HttpsError(
        "unavailable",
        "تعذر الاتصال بخدمة تشغيل الأكواد. حاولي مرة أخرى."
      );
    }

    if (!response.ok) {
      console.error("Judge0 response status:", response.status);

      throw new HttpsError(
        "unavailable",
        "خدمة تشغيل الأكواد غير متاحة حاليًا."
      );
    }

    let result;

    try {
      result = await response.json();
    } catch {
      throw new HttpsError(
        "internal",
        "وصلت استجابة غير مفهومة من خدمة التشغيل."
      );
    }

    return {
      ok: result.status?.id === 3,
      stdout: safeOutput(result.stdout),
      stderr: safeOutput(result.stderr),
      compileOutput: safeOutput(result.compile_output),
      message: safeOutput(result.message),
      status: result.status?.description || "Unknown",
      time: result.time || null,
      memory: result.memory || null
    };
  }
);

/*
 * لا تمنحي المكافآت بمجرد استقبال gameId.
 * اربطي كل لعبة بتحقق خادمي من النتيجة قبل تفعيل المكافآت.
 */
exports.claimGameReward = onCall(
  CALL_OPTIONS,
  async request => {
    requireAuth(request);

    throw new HttpsError(
      "failed-precondition",
      "المكافآت متوقفة مؤقتًا حتى يتم التحقق من نتيجة اللعبة على الخادم."
    );
  }
);

/*
 * نتيجة عامة للوحة الشرف.
 * لا يتم نشر البريد الإلكتروني أو بيانات الحساب الخاصة.
 */
exports.syncLeaderboard = onDocumentWritten(
  {
    document: "users/{uid}",
    region: "europe-west1",
    retry: true
  },
  async event => {
    const uid = event.params.uid;
    const after = event.data?.after;

    const publicRef = db
      .collection("leaderboardPublic")
      .doc(uid);

    if (!after || !after.exists) {
      await publicRef.delete().catch(() => {});
      return;
    }

    const user = after.data();

    await publicRef.set({
      displayName:
        typeof user.displayName === "string"
          ? user.displayName.slice(0, 50)
          : "متعلم",
      xp:
        Number.isFinite(user.xp) && user.xp >= 0
          ? user.xp
          : 0,
      updatedAt: FieldValue.serverTimestamp()
    });
  }
);
