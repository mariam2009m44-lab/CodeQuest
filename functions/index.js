
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

const STORE_ITEMS = Object.freeze({
  astronaut: 150,
  fox: 200,
  robot: 300,
  dragon: 500
});

const LESSON_REWARD = Object.freeze({
  xp: 10,
  stars: 1
});

function requireAuth(request) {
  if (!request.auth?.uid) {
    throw new HttpsError(
      "unauthenticated",
      "يجب تسجيل الدخول أولًا."
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
      "يجب إدخال كود صالح لا يتجاوز 50000 حرف."
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
    console.error(
      "Judge0 HTTP error:",
      response.status,
      data
    );

    throw new HttpsError(
      "unavailable",
      "خدمة تشغيل الأكواد غير متاحة حاليًا."
    );
  }

  return data;
}

/*
 * تشغيل أكواد Python وJavaScript وC++.
 */
exports.runCode = onCall(
  CALL_OPTIONS,
  async request => {
    requireAuth(request);

    const data = request.data || {};

    validateCodeInput(data);

    const baseUrl = JUDGE0_URL.value().replace(/\/+$/, "");

    let submission;

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
      console.error(
        "Judge0 did not return a token:",
        submission
      );

      throw new HttpsError(
        "internal",
        "خدمة التشغيل لم تُرجع رقم التنفيذ."
      );
    }

    const maxAttempts = 12;
    let result = null;

    for (
      let attempt = 0;
      attempt < maxAttempts;
      attempt++
    ) {
      await new Promise(resolve =>
        setTimeout(resolve, 1500)
      );

      try {
        const response = await fetch(
          `${baseUrl}/submissions/${encodeURIComponent(
            submission.token
          )}?base64_encoded=false`,
          {
            method: "GET",
            headers: {
              Accept: "application/json"
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

      if (statusId && statusId > 2) {
        break;
      }
    }

    if (
      !result ||
      !result.status ||
      result.status.id <= 2
    ) {
      throw new HttpsError(
        "deadline-exceeded",
        "استغرق التنفيذ وقتًا طويلًا. حاول مرة أخرى."
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
 * شراء عناصر المتجر من الخادم فقط.
 */
exports.purchaseStoreItem = onCall(
  CALL_OPTIONS,
  async request => {
    const uid = requireAuth(request);
    const itemId = request.data?.itemId;

    if (
      typeof itemId !== "string" ||
      !Object.prototype.hasOwnProperty.call(
        STORE_ITEMS,
        itemId
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        "العنصر المطلوب غير موجود في المتجر."
      );
    }

    const price = STORE_ITEMS[itemId];

    const userRef = db.collection("users").doc(uid);

    try {
      return await db.runTransaction(
        async transaction => {
          const userSnap = await transaction.get(userRef);

          if (!userSnap.exists) {
            throw new HttpsError(
              "not-found",
              "ملف الحساب غير موجود."
            );
          }

          const userData = userSnap.data() || {};

          const coins = userData.coins;

          const inventory = Array.isArray(
            userData.inventory
          )
            ? userData.inventory
            : [];

          if (
            typeof coins !== "number" ||
            !Number.isFinite(coins) ||
            coins < 0
          ) {
            throw new HttpsError(
              "failed-precondition",
              "رصيد العملات غير صالح."
            );
          }

          if (inventory.includes(itemId)) {
            return {
              success: true,
              alreadyOwned: true,
              coins,
              inventory
            };
          }

          if (coins < price) {
            throw new HttpsError(
              "failed-precondition",
              "لا توجد عملات كافية لشراء هذا العنصر."
            );
          }

          const updatedInventory = [
            ...inventory,
            itemId
          ];

          const updatedCoins = coins - price;

          transaction.update(userRef, {
            coins: updatedCoins,
            inventory: updatedInventory,
            updatedAt: FieldValue.serverTimestamp()
          });

          return {
            success: true,
            alreadyOwned: false,
            coins: updatedCoins,
            inventory: updatedInventory
          };
        }
      );
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      console.error("Store purchase error:", error);

      throw new HttpsError(
        "internal",
        "حدث خطأ أثناء إتمام عملية الشراء."
      );
    }
  }
);

/*
 * التحقق من سجل الدرس الذي يستحق المكافأة.
 * لا نكافئ علامات الامتحانات أو السجلات الخاصة.
 */
function getRewardableLesson(lessonId, data) {
  if (!data || data.completed !== true) {
    return null;
  }

  const match = /^(python|javascript|cpp)_(\d+)_(\d+)$/.exec(
    String(lessonId)
  );

  if (!match) return null;

  const language = match[1];
  const chapter = Number(match[2]);
  const lesson = Number(match[3]);

  if (
    !Number.isSafeInteger(chapter) ||
    !Number.isSafeInteger(lesson) ||
    chapter < 0 ||
    lesson < 0
  ) {
    return null;
  }

  if (language === "python") {
    if (chapter >= 12 || lesson >= 4) {
      return null;
    }
  } else {
    if (chapter >= 100 || lesson >= 100) {
      return null;
    }
  }

  if (
    data.language !== language ||
    data.chapter !== chapter ||
    data.lesson !== lesson
  ) {
    return null;
  }

  return {
    language,
    chapter,
    lesson
  };
}

/*
 * منح مكافأة الدرس مرة واحدة فقط.
 * gameRewards هو سجل منع التكرار.
 */
async function awardCompletedLesson(
  uid,
  lessonId,
  lessonData
) {
  const lesson = getRewardableLesson(
    lessonId,
    lessonData
  );

  if (!lesson) {
    return {
      awarded: false,
      reason: "not-rewardable"
    };
  }

  const userRef = db.collection("users").doc(uid);

  const rewardId = `lesson_${lessonId}`;

  const rewardRef = userRef
    .collection("gameRewards")
    .doc(rewardId);

  return db.runTransaction(async transaction => {
    const rewardSnapshot = await transaction.get(
      rewardRef
    );

    if (rewardSnapshot.exists) {
      return {
        awarded: false,
        reason: "already-awarded"
      };
    }

    const userSnapshot = await transaction.get(userRef);

    if (!userSnapshot.exists) {
      throw new Error(
        "User profile does not exist."
      );
    }

    const userData = userSnapshot.data() || {};

    const currentXP =
      Number.isSafeInteger(userData.xp) &&
      userData.xp >= 0
        ? userData.xp
        : 0;

    const currentStars =
      Number.isSafeInteger(userData.stars) &&
      userData.stars >= 0
        ? userData.stars
        : 0;

    const currentCompleted =
      Number.isSafeInteger(userData.completedLessons) &&
      userData.completedLessons >= 0
        ? userData.completedLessons
        : 0;

    const newXP = currentXP + LESSON_REWARD.xp;
    const newStars =
      currentStars + LESSON_REWARD.stars;

    transaction.update(userRef, {
      xp: newXP,
      stars: newStars,
      level: Math.floor(newXP / 100) + 1,
      completedLessons: currentCompleted + 1,
      updatedAt: FieldValue.serverTimestamp()
    });

    transaction.create(rewardRef, {
      type: "lesson",
      lessonId,
      language: lesson.language,
      chapter: lesson.chapter,
      lesson: lesson.lesson,
      xp: LESSON_REWARD.xp,
      stars: LESSON_REWARD.stars,
      createdAt: FieldValue.serverTimestamp()
    });

    return {
      awarded: true,
      xp: newXP,
      stars: newStars
    };
  });
}

/*
 * مراقبة انتقال الدرس إلى مكتمل.
 * سجل المكافأة يمنع تكرارها عند إعادة المحاولة.
 */
exports.awardLessonReward = onDocumentWritten(
  {
    document:
      "users/{uid}/lessonProgress/{lessonId}",
    region: "europe-west1",
    retry: true
  },
  async event => {
    const before = event.data?.before;
    const after = event.data?.after;

    if (!after?.exists) return;

    const newData = after.data() || {};

    const oldData = before?.exists
      ? before.data() || {}
      : {};

    if (oldData.completed === true) return;
    if (newData.completed !== true) return;

    await awardCompletedLesson(
      event.params.uid,
      event.params.lessonId,
      newData
    );
  }
);

/*
 * مزامنة سجلات الدروس المكتملة القديمة.
 * لا يمكن للعميل اختيار مقدار المكافأة.
 */
exports.syncExistingLessonRewards = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 120,
    memory: "256MiB",
    maxInstances: 3
  },
  async request => {
    const uid = requireAuth(request);

    const progressSnapshot = await db
      .collection("users")
      .doc(uid)
      .collection("lessonProgress")
      .where("completed", "==", true)
      .get();

    let awardedCount = 0;

    for (const lessonDocument of progressSnapshot.docs) {
      const result = await awardCompletedLesson(
        uid,
        lessonDocument.id,
        lessonDocument.data()
      );

      if (result.awarded) {
        awardedCount++;
      }
    }

    const profileSnapshot = await db
      .collection("users")
      .doc(uid)
      .get();

    const profile = profileSnapshot.data() || {};

    return {
      success: true,
      awardedCount,
      xp: Number(profile.xp) || 0,
      stars: Number(profile.stars) || 0
    };
  }
);

/*
 * مكافآت الألعاب لا تزال محمية.
 * لن نمنح مكافآت لعبة قبل ربط نتيجة موثوقة بالخادم.
 */
exports.claimGameReward = onCall(
  CALL_OPTIONS,
  async request => {
    requireAuth(request);

    throw new HttpsError(
      "failed-precondition",
      "مكافآت الألعاب غير مفعلة حتى يتم ربط التحقق من نتيجة اللعبة بالخادم."
    );
  }
);

/*
 * مزامنة بيانات لوحة الشرف العامة.
 * لا يتم نشر البريد الإلكتروني.
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

    const user = after.data() || {};

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
