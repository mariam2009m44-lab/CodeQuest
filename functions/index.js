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

async function readJudge0Response(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    throw new HttpsError(
      "internal",
      "وصلت استجابة غير مفهومة من خدمة التشغيل."
    );
  }

  if (!response.ok) {
    console.error("Judge0 HTTP error:", response.status, data);

    throw new HttpsError(
      "unavailable",
      "خدمة تشغيل الأكواد غير متاحة حاليًا."
    );
  }

  return data;
}

exports.runCode = onCall(
  CALL_OPTIONS,
  async request => {
    requireAuth(request);

    const data = request.data || {};
    validateCodeInput(data);

    const baseUrl = JUDGE0_URL.value().replace(/\/+$/, "");

    let submission;

    // الخطوة الأولى: إرسال الكود إلى Judge0 واستلام token.
    try {
      const response = await fetch(
        `${baseUrl}/submissions?base64_encoded=false&wait=false`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            source_code: data.code,
            language_id: LANGUAGES[data.language],
            stdin: ""
          }),
          signal: AbortSignal.timeout(15000)
        }
      );

      submission = await readJudge0Response(response);
    } catch (error) {
      if (error instanceof HttpsError) throw error;

      console.error("Judge0 submission error:", error);

      throw new HttpsError(
        "unavailable",
        "تعذر إرسال الكود إلى خدمة التشغيل."
      );
    }

    if (!submission.token) {
      console.error("Judge0 did not return a token:", submission);

      throw new HttpsError(
        "internal",
        "خدمة التشغيل لم تُرجع رقم التنفيذ."
      );
    }

    // الخطوة الثانية: الاستعلام عن النتيجة حتى انتهاء التنفيذ.
    const maxAttempts = 12;
    let result = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        const response = await fetch(
          `${baseUrl}/submissions/${encodeURIComponent(
            submission.token
          )}?base64_encoded=false`,
          {
            method: "GET",
            headers: {
              "Accept": "application/json"
            },
            signal: AbortSignal.timeout(10000)
          }
        );

        result = await readJudge0Response(response);
      } catch (error) {
        if (error instanceof HttpsError) throw error;

        console.error("Judge0 polling error:", error);

        throw new HttpsError(
          "unavailable",
          "تعذر الحصول على نتيجة تنفيذ الكود."
        );
      }

      const statusId = result.status?.id;

      // 1 و2 تعنيان أن التنفيذ لم ينتهِ بعد.
      if (statusId && statusId > 2) {
        break;
      }
    }

    if (!result || !result.status || result.status.id <= 2) {
      throw new HttpsError(
        "deadline-exceeded",
        "استغرق التنفيذ وقتًا طويلًا. حاولي مرة أخرى."
      );
    }

    return {
      ok: result.status.id === 3,
      stdout: safeOutput(result.stdout),
      stderr: safeOutput(result.stderr),
      compileOutput: safeOutput(result.compile_output),
      message: safeOutput(result.message),
      status: result.status.description || "Unknown",
      time: result.time || null,
      memory: result.memory || null
    };
  }
);

/*
 * المكافآت متوقفة حتى يتم التحقق من نتيجة اللعبة على الخادم.
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
 * مزامنة بيانات لوحة الشرف العامة دون نشر البريد الإلكتروني.
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