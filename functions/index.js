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

    const progressLessonId =
      `${language}_${chapterIndex}_${lessonIndex}`;

    const resultRef = db
      .collection("users")
      .doc(uid)
      .collection("quizResults")
      .doc(`lesson_${progressLessonId}`);

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
 * منح مكافأة بازل الأكواد بعد التحقق من الحل على الخادم.
 * المكافأة تُمنح مرة واحدة فقط لكل مستخدم.
 */
exports.claimGameReward = onCall(
  CALL_OPTIONS,
  async request => {
    const uid = requireAuth(request);
    const data = request.data || {};

    const GAME_ID = "code-puzzle-hello-world";

    const CORRECT_SOLUTION = [
      "console.log",
      "(",
      '"Hello World"',
      ")",
      ";"
    ];

    const REWARD = {
      xp: 10,
      stars: 1
    };

    if (data.gameId !== GAME_ID) {
      throw new HttpsError(
        "invalid-argument",
        "معرّف اللعبة غير صحيح."
      );
    }

    if (
      !Array.isArray(data.solution) ||
      data.solution.length !== CORRECT_SOLUTION.length ||
      !data.solution.every(
        (piece, index) =>
          typeof piece === "string" &&
          piece === CORRECT_SOLUTION[index]
      )
    ) {
      throw new HttpsError(
        "failed-precondition",
        "لم يتم اجتياز التحدي. راجع ترتيب قطع الكود."
      );
    }

    const userRef = db.collection("users").doc(uid);

    const rewardRef = userRef
      .collection("gameRewards")
      .doc(`game_${GAME_ID}`);

    return db.runTransaction(async transaction => {
      const rewardSnapshot = await transaction.get(rewardRef);

      if (rewardSnapshot.exists) {
        const userSnapshot = await transaction.get(userRef);
        const userData = userSnapshot.exists
          ? userSnapshot.data() || {}
          : {};

        return {
          success: true,
          awarded: false,
          reason: "already-awarded",
          xp: Number(userData.xp) || 0,
          stars: Number(userData.stars) || 0,
          message: "حصلت على مكافأة هذه اللعبة من قبل."
        };
      }

      const userSnapshot = await transaction.get(userRef);

      if (!userSnapshot.exists) {
        throw new HttpsError(
          "not-found",
          "ملف الحساب غير موجود."
        );
      }

      const userData = userSnapshot.data() || {};

      const currentXP =
        Number.isSafeInteger(userData.xp) && userData.xp >= 0
          ? userData.xp
          : 0;

      const currentStars =
        Number.isSafeInteger(userData.stars) && userData.stars >= 0
          ? userData.stars
          : 0;

      const newXP = currentXP + REWARD.xp;
      const newStars = currentStars + REWARD.stars;

      transaction.update(userRef, {
        xp: newXP,
        stars: newStars,
        level: Math.floor(newXP / 100) + 1,
        updatedAt: FieldValue.serverTimestamp()
      });

      transaction.create(rewardRef, {
        type: "game",
        gameId: GAME_ID,
        xp: REWARD.xp,
        stars: REWARD.stars,
        createdAt: FieldValue.serverTimestamp()
      });

      return {
        success: true,
        awarded: true,
        xp: newXP,
        stars: newStars,
        message: "تمت إضافة مكافأة اللعبة إلى حسابك."
      };
    });
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
/*
 * تحديات Python الفعلية الموجودة في:
 * js/chapters/ch1.js إلى js/chapters/ch12.js
 *
 * chapter و lesson هنا يبدأان من صفر.
 *
 * expected:
 * الناتج المتوقع من تشغيل الكود.
 *
 * required:
 * أجزاء أساسية يجب وجودها في الكود.
 *
 * randomRange:
 * يستخدم في التحديات التي يكون ناتجها عشوائيًا.
 */
const PYTHON_CHALLENGES = Object.freeze({

  "0_0": {
    expected: "Hello, World!",
    required: [
      "print(",
      "Hello, World!"
    ]
  },

  "0_1": {
    expected: "25\n8",
    required: [
      "print(25)",
      "print(5 + 3)"
    ]
  },

  "0_2": {
    expected: "مرحبا\nبك",
    required: [
      'print("مرحبا")',
      'print("بك")'
    ]
  },

  "0_3": {
    expected: "Hello",
    required: [
      "print(",
      "Hello"
    ]
  },

  "1_0": {
    expected: "10",
    required: [
      "age",
      "10",
      "print(age)"
    ]
  },

  "1_1": {
    expected: "20",
    required: [
      "points = 5",
      "points = 20",
      "print(points)"
    ]
  },

  "1_2": {
    expected: "Hello World",
    required: [
      "word1",
      "Hello",
      "word2",
      "World",
      "print("
    ]
  },

  "1_3": {
    expected: "Ali",
    required: [
      "student_name",
      "Ali",
      "print(student_name)"
    ]
  },

  "2_0": {
    expected: "60\n60",
    required: [
      "print(25 + 35)",
      "print(100 - 40)"
    ]
  },

  "2_1": {
    expected: "56\n25.0",
    required: [
      "print(8 * 7)",
      "print(50 / 2)"
    ]
  },

  "2_2": {
    expected: "3",
    required: [
      "print(15 % 4)"
    ]
  },

  "2_3": {
    expected: "30\n20",
    required: [
      "print((10 + 5) * 2)",
      "print(10 + (5 * 2))"
    ]
  },

  "3_0": {
    expected: "Correct",
    required: [
      "if 20 > 15:",
      'print("Correct")'
    ]
  },

  "3_1": {
    expected: "Small",
    required: [
      "if 3 > 5:",
      "else:",
      'print("Small")'
    ]
  },

  "3_2": {
    expected: "Pass",
    required: [
      "score = 60",
      "if score >= 60:",
      'print("Pass")'
    ]
  },

  "3_3": {
    expected: "Teen",
    required: [
      "15 > 10 and 15 < 20",
      'print("Teen")'
    ]
  },

  "4_0": {
    expected: "مرحبا\nمرحبا\nمرحبا\nمرحبا\nمرحبا",
    required: [
      "for",
      "range(5)",
      'print("مرحبا")'
    ]
  },

  "4_1": {
    expected: "Loop\nLoop\nLoop",
    required: [
      "while count <= 3:",
      "count += 1",
      'print("Loop")'
    ]
  },

  "4_2": {
    expected: "Stop",
    required: [
      "for i in range(10):",
      "if i == 4:",
      "break"
    ]
  },

  "4_3": {
    expected: "1\n2\n4\n5",
    required: [
      "for i in range(1, 6):",
      "if i == 3:",
      "continue"
    ]
  },

  "5_0": {
    expected: "['Red', 'Green', 'Blue']",
    required: [
      'colors = ["Red", "Green", "Blue"]'
    ]
  },

  "5_1": {
    expected: "BMW",
    required: [
      'cars = ["BMW", "Audi"]',
      "print(cars[0])"
    ]
  },

  "5_2": {
    expected: "['Apple', 'Banana']",
    required: [
      'fruits = ["Apple"]',
      'fruits.append("Banana")'
    ]
  },

  "5_3": {
    expected: "3",
    required: [
      "grades = [80, 90, 85]",
      "len(grades)"
    ]
  },

  "6_0": {
    expected: "Welcome",
    required: [
      "def greet():",
      'print("Welcome")',
      "greet()"
    ]
  },

  "6_1": {
    expected: "15",
    required: [
      "def add(a, b):",
      "print(a + b)",
      "add(5, 10)"
    ]
  },

  "6_2": {
    expected: "16",
    required: [
      "def square(x):",
      "return x * x",
      "print(square(4))"
    ]
  },

  "6_3": {
    expected: "Hello Ali",
    required: [
      "def welcome(name):",
      'print("Hello", name)',
      "welcome("
    ]
  },

  "7_0": {
    expected: "11",
    required: [
      'len("Programming")'
    ]
  },

  "7_1": {
    expected: "PYTHON",
    required: [
      ".upper()"
    ]
  },

  "7_2": {
    expected: "I love dogs",
    required: [
      'sentence = "I love cats"',
      '.replace("cats", "dogs")'
    ]
  },

  "7_3": {
    expected: "['Hello', 'World']",
    required: [
      ".split()"
    ]
  },

  "8_0": {
    expected: "Error",
    required: [
      "try:",
      "except:",
      'print("Error")'
    ]
  },

  "8_1": {
    expected: "Cannot divide by zero",
    required: [
      "except ZeroDivisionError:",
      'print("Cannot divide by zero")'
    ]
  },

  "8_2": {
    expected: "Invalid input",
    required: [
      "except ValueError:",
      'print("Invalid input")'
    ]
  },

  "8_3": {
    expected: "Error handled",
    required: [
      "try:",
      "except:",
      'print("Error handled")'
    ]
  },

  "9_0": {
    expected: "{'name': 'Ali'}",
    required: [
      'student = {"name": "Ali"}'
    ]
  },

  "9_1": {
    expected: "15",
    required: [
      'student["age"]'
    ]
  },

  "9_2": {
    expected: "{'brand': 'BMW', 'color': 'Red'}",
    required: [
      'car["color"] = "Red"'
    ]
  },

  "9_3": {
    expected: "dict_keys(['name'])",
    required: [
      ".keys()"
    ]
  },

  "10_0": {
    expected: "5.0",
    required: [
      "import math",
      "math.sqrt(25)"
    ]
  },

  "10_1": {
    expected: "3.141592653589793",
    required: [
      "math.pi"
    ]
  },

  "10_2": {
    expected: null,
    randomRange: {
      min: 1,
      max: 10
    },
    required: [
      "import random",
      "random.randint(1, 10)"
    ]
  },

  "10_3": {
    expected: "6.0",
    required: [
      "from math import sqrt",
      "sqrt(36)"
    ]
  },

  "11_0": {
    expected: "Game Started\nPlayer Ready",
    required: [
      'print("Game Started")',
      'name = "Hero"',
      "health = 100",
      'print("Player Ready")'
    ]
  },

  "11_1": {
    expected: "Data Ready",
    required: [
      'inventory = ["Sword", "Shield"]',
      'stats = {"name": "Hero", "level": 1}',
      "xp = 50 * 2",
      'print("Data Ready")'
    ]
  },

  "11_2": {
    expected: "Turn\nHealed\nTurn\nHealed",
    required: [
      "def heal():",
      "for i in range(2):",
      "if health > 0:",
      "heal()"
    ]
  },

  "11_3": {
    expected: null,
    randomRange: {
      min: 1,
      max: 6
    },
    required: [
      "import random",
      "try:",
      "random.randint(1, 6)",
      "except:"
    ]
  }

});

/*
 * تطبيع ناتج Python قبل المقارنة.
 */
function normalizePythonOutput(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

/*
 * فحص وجود الأجزاء المطلوبة في الكود.
 */
function validatePythonChallengeSource(code, challenge) {
  if (
    !Array.isArray(challenge.required) ||
    challenge.required.length === 0
  ) {
    return false;
  }

  return challenge.required.every(part =>
    code.includes(part)
  );
}

/*
 * تشغيل كود التحدي على Judge0 من الخادم.
 * لا نثق في ناتج يرسله المتصفح.
 */
async function executePythonChallenge(code) {
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
          source_code: code,
          language_id: LANGUAGES.python,
          stdin: "",
          cpu_time_limit: 5,
          wall_time_limit: 10,
          memory_limit: 128000
        }),
        signal: AbortSignal.timeout(15000)
      }
    );

    submission = await readJudge0Response(response);
  } catch (error) {
    if (error instanceof HttpsError) throw error;

    console.error(
      "Python challenge submission failed:",
      error
    );

    throw new HttpsError(
      "unavailable",
      "تعذر إرسال التحدي للتحقق منه."
    );
  }

  if (!submission?.token) {
    throw new HttpsError(
      "internal",
      "لم تُرجع خدمة التشغيل رقم التنفيذ."
    );
  }

  let result = null;

  for (let attempt = 0; attempt < 12; attempt++) {
    await new Promise(resolve =>
      setTimeout(resolve, 1200)
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

      console.error(
        "Python challenge polling failed:",
        error
      );

      throw new HttpsError(
        "unavailable",
        "تعذر الحصول على نتيجة التحدي."
      );
    }

    if (
      result?.status?.id &&
      result.status.id > 2
    ) {
      break;
    }
  }

  if (
    !result?.status ||
    result.status.id <= 2
  ) {
    throw new HttpsError(
      "deadline-exceeded",
      "انتهى وقت انتظار تنفيذ التحدي."
    );
  }

  return {
    accepted: result.status.id === 3,
    stdout: safeOutput(result.stdout),
    stderr: safeOutput(result.stderr),
    status: result.status.description || "Unknown"
  };
}

/*
 * التحقق من ناتج التحدي.
 */
function validatePythonChallengeOutput(output, challenge) {
  const actual = normalizePythonOutput(output);

  if (challenge.randomRange) {
    const numericOutput = Number(actual);

    return Number.isFinite(numericOutput)
      && Number.isInteger(numericOutput)
      && numericOutput >= challenge.randomRange.min
      && numericOutput <= challenge.randomRange.max;
  }

  return actual === normalizePythonOutput(
    challenge.expected
  );
}

/*
 * Callable:
 * يتحقق من تحدي Python الحالي من جهة الخادم.
 *
 * لا يتم إنشاء إثبات المكافأة إلا بعد:
 * 1. التأكد من تسجيل الدخول.
 * 2. التأكد من وجود التحدي في المنهج المعتمد.
 * 3. التأكد من أجزاء الكود المطلوبة.
 * 4. تشغيل الكود على Judge0.
 * 5. مطابقة الناتج المتوقع.
 *
 * chapter و lesson يبدأان من صفر.
 */
exports.verifyPythonChallenge = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 45,
    memory: "256MiB",
    maxInstances: 5
  },
  async request => {
    const uid = requireAuth(request);

    const data = request.data || {};

    const {
      chapter,
      lesson,
      code
    } = data;

    if (
      !Number.isInteger(chapter) ||
      chapter < 0 ||
      chapter >= 12
    ) {
      throw new HttpsError(
        "invalid-argument",
        "رقم الفصل غير صالح."
      );
    }

    if (
      !Number.isInteger(lesson) ||
      lesson < 0 ||
      lesson >= 4
    ) {
      throw new HttpsError(
        "invalid-argument",
        "رقم الدرس غير صالح."
      );
    }

    if (
      typeof code !== "string" ||
      !code.trim() ||
      code.length > 50000
    ) {
      throw new HttpsError(
        "invalid-argument",
        "الكود غير صالح أو يتجاوز الحد المسموح."
      );
    }

    const challengeKey = `${chapter}_${lesson}`;

    const challenge = PYTHON_CHALLENGES[challengeKey];

    if (!challenge) {
      throw new HttpsError(
        "not-found",
        "لم يتم العثور على هذا التحدي في المنهج."
      );
    }

    if (
      !validatePythonChallengeSource(
        code,
        challenge
      )
    ) {
      return {
        success: true,
        correct: false,
        message: "الكود لا يحتوي على جميع الأجزاء المطلوبة."
      };
    }

    const execution = await executePythonChallenge(code);

    if (!execution.accepted) {
      return {
        success: true,
        correct: false,
        message: "لم يتم تنفيذ الكود بنجاح.",
        status: execution.status
      };
    }

    const outputCorrect =
      validatePythonChallengeOutput(
        execution.stdout,
        challenge
      );

    if (!outputCorrect) {
      return {
        success: true,
        correct: false,
        message: "ناتج الكود غير مطابق للناتج المطلوب.",
        stdout: execution.stdout
      };
    }

    const progressLessonId =
      `python_${chapter}_${lesson}`;

    const resultRef = db
      .collection("users")
      .doc(uid)
      .collection("quizResults")
      .doc(`lesson_${progressLessonId}`);

    /*
     * هذا الإثبات يُنشأ من الخادم فقط.
     * Firestore Rules تمنع المتصفح من كتابة quizResults.
     */
    await resultRef.set({
      verificationVersion: 1,
      serverVerified: true,
      passed: true,

      uid,
      lessonId: progressLessonId,

      curriculumLessonId:
        `python-${chapter + 1}-${lesson + 1}`,

      language: "python",
      chapter,
      lesson,

      verificationType: "python-challenge",

      verifiedAt: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      correct: true,
      message: "تم التحقق من التحدي بنجاح.",
      stdout: execution.stdout,
      chapter,
      lesson
    };
  }
);