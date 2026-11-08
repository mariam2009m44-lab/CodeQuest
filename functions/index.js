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

const CURRICULUM_URLS = Object.freeze({
  javascript:
    "https://raw.githubusercontent.com/mariam2009m44-lab/CodeQuest/main/json/js_curriculum.json",

  python:
    "https://raw.githubusercontent.com/mariam2009m44-lab/CodeQuest/main/json/python_curriculum.json",

  cpp:
    "https://raw.githubusercontent.com/mariam2009m44-lab/CodeQuest/main/json/cpp_curriculum.json"
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
 * البحث عن سؤال الدرس في ملف المنهج الرسمي.
 * يتم تحديد الفصل والدرس من ترتيب المنهج،
 * وليس من بيانات يرسلها المتصفح.
 */
async function findCurriculumQuiz(language, curriculumLessonId) {
  const curriculumUrl = CURRICULUM_URLS[language];

  if (!curriculumUrl) {
    throw new HttpsError(
      "invalid-argument",
      "لغة الاختبار غير مدعومة."
    );
  }

  let response;

  try {
    response = await fetch(curriculumUrl, {
      headers: {
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(15000)
    });
  } catch (error) {
    console.error("Curriculum fetch failed:", error);

    throw new HttpsError(
      "unavailable",
      "تعذر الاتصال بملف المنهج حاليًا."
    );
  }

  if (!response.ok) {
    throw new HttpsError(
      "unavailable",
      "تعذر تحميل المنهج للتحقق من الإجابة."
    );
  }

  let curriculum;

  try {
    curriculum = await response.json();
  } catch {
    throw new HttpsError(
      "internal",
      "ملف المنهج لا يحتوي على بيانات صالحة."
    );
  }

  if (!Array.isArray(curriculum?.chapters)) {
    throw new HttpsError(
      "internal",
      "تركيب ملف المنهج غير صحيح."
    );
  }

  for (
    let chapterIndex = 0;
    chapterIndex < curriculum.chapters.length;
    chapterIndex++
  ) {
    const chapter = curriculum.chapters[chapterIndex];

    if (!Array.isArray(chapter?.lessons)) {
      continue;
    }

    for (
      let lessonIndex = 0;
      lessonIndex < chapter.lessons.length;
      lessonIndex++
    ) {
      const lesson = chapter.lessons[lessonIndex];

      if (lesson?.id !== curriculumLessonId) {
        continue;
      }

      const quiz = Array.isArray(lesson.quiz)
        ? lesson.quiz[0]
        : lesson.quiz;

      if (
        !quiz ||
        !Array.isArray(quiz.options) ||
        !Number.isInteger(quiz.correct_index) ||
        quiz.correct_index < 0 ||
        quiz.correct_index >= quiz.options.length
      ) {
        throw new HttpsError(
          "failed-precondition",
          "بيانات سؤال هذا الدرس غير مكتملة."
        );
      }

      return {
        quiz,
        chapterIndex,
        lessonIndex,
        curriculumLessonId: lesson.id
      };
    }
  }

  throw new HttpsError(
    "not-found",
    "لم يتم العثور على الدرس داخل المنهج."
  );
}

/*
 * التحقق من إجابة الاختبار من الخادم.
 *
 * عند الإجابة الصحيحة:
 * 1. نحدد موقع الدرس الحقيقي في المنهج.
 * 2. ننشئ معرّف التقدم الداخلي المتوافق مع النظام الحالي.
 * 3. نحفظ إثباتًا خادميًا في quizResults.
 *
 * المتصفح لا يستطيع إنشاء هذا الإثبات بنفسه.
 */
exports.checkQuizAnswer = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB",
    maxInstances: 5
  },
  async request => {
    const uid = requireAuth(request);
    const data = request.data || {};

    const {
      language,
      lessonId,
      selectedIndex
    } = data;

    if (
      typeof language !== "string" ||
      !Object.prototype.hasOwnProperty.call(
        CURRICULUM_URLS,
        language
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        "لغة البرمجة غير مدعومة."
      );
    }

    if (
      typeof lessonId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(lessonId)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "معرّف الدرس غير صالح."
      );
    }

    if (
      !Number.isInteger(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex > 20
    ) {
      throw new HttpsError(
        "invalid-argument",
        "رقم الاختيار غير صالح."
      );
    }

    const lessonInfo = await findCurriculumQuiz(
      language,
      lessonId
    );

    const {
      quiz,
      chapterIndex,
      lessonIndex
    } = lessonInfo;

    if (selectedIndex >= quiz.options.length) {
      throw new HttpsError(
        "invalid-argument",
        "رقم الاختيار غير موجود في هذا السؤال."
      );
    }

    const correct =
      selectedIndex === quiz.correct_index;

    const explanation = correct
      ? (
          quiz.explanation ||
          quiz.success_msg ||
          "إجابة صحيحة! أحسنت."
        )
      : (
          quiz.fail_msg ||
          "الإجابة غير صحيحة. راجع شرح الدرس وحاول مرة أخرى."
        );

    if (!correct) {
      return {
        success: true,
        correct: false,
        explanation: String(explanation).slice(0, 500)
      };
    }

    /*
     * هذا هو المعرّف الذي يستخدمه saveLessonProgress
     * في js/auth.js، وليس معرّف المنهج مثل py-1-1.
     */
    const progressLessonId =
      `${language}_${chapterIndex}_${lessonIndex}`;

    const resultRef = db
      .collection("users")
      .doc(uid)
      .collection("quizResults")
      .doc(`lesson_${progressLessonId}`);

    /*
     * الكتابة تتم باستخدام Firebase Admin SDK من الخادم.
     * لا نعتمد على أي قيمة serverVerified يرسلها المتصفح.
     */
    await resultRef.set({
      verificationVersion: 1,
      serverVerified: true,
      passed: true,

      uid,
      lessonId: progressLessonId,

      curriculumLessonId: lessonId,

      language,
      chapter: chapterIndex,
      lesson: lessonIndex,

      selectedIndex,

      verifiedAt: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      correct: true,
      explanation: String(explanation).slice(0, 500),

      chapter: chapterIndex,
      lesson: lessonIndex
    };
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
 * التحقق من إثبات اجتياز الاختبار.
 */
function hasVerifiedLessonResult(uid, lessonId, lesson, result) {
  if (!result || typeof result !== "object") return false;

  return result.verificationVersion === 1
    && result.serverVerified === true
    && result.passed === true
    && result.uid === uid
    && result.lessonId === lessonId
    && result.language === lesson.language
    && result.chapter === lesson.chapter
    && result.lesson === lesson.lesson;
}

/*
 * منح مكافأة الدرس مرة واحدة فقط بعد إثبات الاجتياز خادميًا.
 * gameRewards هو سجل منع التكرار، وليس دليل الاجتياز.
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

    /*
     * يجب أن يكتب خادم التصحيح هذا السجل بعد التحقق الفعلي.
     * لا تُنشئ إثباتات من سجلات التقدم القديمة أو من مدخلات العميل.
     */
    const resultRef = userRef
      .collection("quizResults")
      .doc(`lesson_${lessonId}`);

    const resultSnapshot = await transaction.get(resultRef);

    if (
      !resultSnapshot.exists ||
      !hasVerifiedLessonResult(
        uid,
        lessonId,
        lesson,
        resultSnapshot.data()
      )
    ) {
      return {
        awarded: false,
        reason: "unverified-result"
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
    let pendingVerificationCount = 0;

    for (const lessonDocument of progressSnapshot.docs) {
      const result = await awardCompletedLesson(
        uid,
        lessonDocument.id,
        lessonDocument.data()
      );

      if (result.awarded) {
        awardedCount++;
      } else if (result.reason === "unverified-result") {
        pendingVerificationCount++;
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
      pendingVerificationCount,
      message: pendingVerificationCount > 0
        ? "توجد دروس محفوظة تنتظر التحقق الخادمي قبل منح المكافآت."
        : "اكتملت مراجعة مكافآت الدروس.",
      xp: Number(profile.xp) || 0,
      stars: Number(profile.stars) || 0
    };
  }
);

/*
 * مكافآت الألعاب لا تزال محمية.
 * لن نمنح مكافآت لعبة قبل ربط نتيجة اللعبة بالخادم.
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