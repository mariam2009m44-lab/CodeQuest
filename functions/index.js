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
  cpp: 54,
  java: 62
});


const CURRICULUM_CACHE_TTL_MS = 5 * 60 * 1000;
const curriculumCache = new Map();
const USER_RATE_LIMITS = Object.freeze({
  quizAnswer: Object.freeze({ windowMs: 60 * 1000, maxRequests: 30 }),
  saveLessonProgress: Object.freeze({ windowMs: 60 * 1000, maxRequests: 30 }),
  runCode: Object.freeze({ windowMs: 60 * 1000, maxRequests: 10 }),
  verifyJavaChallenge: Object.freeze({ windowMs: 60 * 1000, maxRequests: 6 }),
  verifyPythonChallenge: Object.freeze({ windowMs: 60 * 1000, maxRequests: 6 })
});

async function enforceUserRateLimit(uid, action) {
  const limit = USER_RATE_LIMITS[action];
  if (!limit) {
    throw new HttpsError("internal", "إعدادات حدود الاستخدام غير متاحة.");
  }

  const limitRef = db.collection("users").doc(uid)
    .collection("securityLimits").doc(action);
  const now = Date.now();

  await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(limitRef);
    const current = snapshot.exists ? snapshot.data() || {} : {};
    const windowStartedAt = Number(current.windowStartedAt) || 0;
    const requestCount = Number(current.requestCount) || 0;
    const windowIsActive =
      now >= windowStartedAt &&
      now - windowStartedAt < limit.windowMs;

    if (windowIsActive && requestCount >= limit.maxRequests) {
      throw new HttpsError(
        "resource-exhausted",
        "تم تجاوز عدد المحاولات المسموح بها مؤقتًا. انتظر دقيقة ثم حاول مرة أخرى."
      );
    }

    transaction.set(limitRef, {
      windowStartedAt: windowIsActive ? windowStartedAt : now,
      requestCount: windowIsActive ? requestCount + 1 : 1,
      updatedAt: FieldValue.serverTimestamp()
    });
  });
}

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

const JAVA_CHALLENGES = Object.freeze({
  "0_0": { required: [/public\s+class\s+Main/, /public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s+\w+\s*\)/, /System\.out\.println\s*\(\s*"Hello!"\s*\)\s*;/], output: "Hello!" },
  "0_1": { required: [/System\.out\.println\s*\(\s*"Java"\s*\)\s*;/, /\/\//], output: "Java" },
  "1_0": { required: [/\bint\s+age\s*=\s*16\s*;/, /\bString\s+name\s*=\s*"Cody"\s*;/, /System\.out\.println\s*\(\s*age\s*\)\s*;/, /System\.out\.println\s*\(\s*name\s*\)\s*;/], output: "16\nCody" },
  "1_1": { required: [/\bint\s+score\s*=\s*10\s*;/, /\bscore\s*=\s*20\s*;/, /System\.out\.println\s*\(\s*score\s*\)\s*;/], output: "20" },
  "2_0": { required: [/System\.out\.println\s*\(\s*a\s*\+\s*b\s*\)\s*;/, /System\.out\.println\s*\(\s*a\s*\*\s*b\s*\)\s*;/], output: "13\n30" },
  "2_1": { required: [/\bint\s+result\s*=\s*17\s*%\s*5\s*;/, /System\.out\.println\s*\(\s*result\s*\)\s*;/], output: "2" },
  "3_0": { required: [/if\s*\(\s*age\s*>=\s*18\s*\)/, /System\.out\.println\s*\(\s*"Adult"\s*\)\s*;/], output: "Adult" },
  "3_1": { required: [/if\s*\(\s*number\s*>\s*0\s*\)/, /else\s*\{/, /System\.out\.println\s*\(\s*"Not positive"\s*\)\s*;/], output: "Positive" },
  "4_0": { required: [/for\s*\(\s*int\s+i\s*=\s*1\s*;\s*i\s*<=\s*5\s*;\s*i\+\+\s*\)/, /System\.out\.println\s*\(\s*i\s*\)\s*;/], output: "1\n2\n3\n4\n5" },
  "4_1": { required: [/while\s*\(\s*count\s*<=\s*3\s*\)/, /System\.out\.println\s*\(\s*count\s*\)\s*;/, /count\+\+/], output: "1\n2\n3" },
  "5_0": { required: [/int\s*\[\s*\]\s*numbers\s*=\s*\{\s*10\s*,\s*20\s*,\s*30\s*\}/, /System\.out\.println\s*\(\s*numbers\s*\[\s*1\s*\]\s*\)\s*;/], output: "20" },
  "5_1": { required: [/for\s*\(\s*int\s+i\s*=\s*0\s*;\s*i\s*<\s*numbers\.length\s*;\s*i\+\+\s*\)/, /System\.out\.println\s*\(\s*numbers\s*\[\s*i\s*\]\s*\)\s*;/], output: "10\n20\n30" },
  "6_0": { required: [/public\s+static\s+void\s+greet\s*\(\s*\)/, /System\.out\.println\s*\(\s*"Hello!"\s*\)\s*;/, /\bgreet\s*\(\s*\)\s*;/], output: "Hello!" },
  "6_1": { required: [/public\s+static\s+int\s+add\s*\(\s*int\s+a\s*,\s*int\s+b\s*\)/, /return\s+a\s*\+\s*b\s*;/, /System\.out\.println\s*\(\s*add\s*\(\s*3\s*,\s*4\s*\)\s*\)\s*;/], output: "7" },
  "7_0": { required: [/class\s+Student/, /Student\s+student\s*=\s*new\s+Student\s*\(\s*\)\s*;/, /System\.out\.println\s*\(\s*student\.name\s*\)\s*;/], output: "Ali" },
  "7_1": { required: [/class\s+Student/, /Student\s*\(\s*String\s+studentName\s*\)/, /\bname\s*=\s*studentName\s*;/, /System\.out\.println\s*\(\s*student\.name\s*\)\s*;/], output: "Cody" }
});

const JAVA_QUIZ_ANSWERS = Object.freeze({
  "0_0": 1, "0_1": 1,
  "1_0": 1, "1_1": 1,
  "2_0": 1, "2_1": 1,
  "3_0": 1, "3_1": 0,
  "4_0": 1, "4_1": 0,
  "5_0": 0, "5_1": 1,
  "6_0": 1, "6_1": 0,
  "7_0": 1, "7_1": 0
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

  if (
    data.stdin !== undefined &&
    (typeof data.stdin !== "string" || data.stdin.length > 10000)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "بيانات الإدخال غير صالحة أو أطول من الحد المسموح."
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
    console.error("Judge0 returned a non-JSON response:", {
      status: response.status
    });
    throw new HttpsError(
      "unavailable",
      "خدمة تشغيل الأكواد أرسلت استجابة غير صالحة. حاول مرة أخرى لاحقًا."
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
    const uid = requireAuth(request);
    await enforceUserRateLimit(uid, "runCode");

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
            stdin: data.stdin || ""
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
 * التحقق الخادمي من تحديات Java.
 * لا يُنشأ إثبات المكافأة إلا بعد فحص الكود وتشغيله ومطابقة الناتج على Judge0.
 */
exports.verifyJavaChallenge = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 60,
    memory: "256MiB",
    maxInstances: 5
  },
  async request => {
    const uid = requireAuth(request);
    await enforceUserRateLimit(uid, "verifyJavaChallenge");
    const data = request.data || {};
    const chapter = data.chapter;
    const lesson = data.lesson;
    const code = data.code;

    if (!Number.isInteger(chapter) || chapter < 0 || chapter >= 8) {
      throw new HttpsError("invalid-argument", "رقم فصل Java غير صالح.");
    }
    if (!Number.isInteger(lesson) || lesson < 0 || lesson >= 2) {
      throw new HttpsError("invalid-argument", "رقم درس Java غير صالح.");
    }
    validateCodeInput({ language: "java", code });

    const challenge = JAVA_CHALLENGES[chapter + "_" + lesson];
    if (!challenge || !challenge.required.every(pattern => pattern.test(code))) {
      return {
        success: true,
        correct: false,
        message: "الكود لا يحتوي على جميع الأجزاء المطلوبة في التحدي."
      };
    }

    const baseUrl = JUDGE0_URL.value().replace(/\/+$/, "");
    let submission;

    try {
      const response = await fetch(
        baseUrl + "/submissions?base64_encoded=false&wait=false",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_code: code,
            language_id: LANGUAGES.java,
            stdin: ""
          }),
          signal: AbortSignal.timeout(15000)
        }
      );
      submission = await readJudge0Response(response);
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("Java challenge submission failed:", error);
      throw new HttpsError("unavailable", "تعذر إرسال تحدي Java إلى خدمة التشغيل.");
    }

    if (!submission.token) {
      throw new HttpsError("internal", "خدمة Java لم تُرجع رقم التنفيذ.");
    }

    let execution = null;
    for (let attempt = 0; attempt < 12; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      try {
        const response = await fetch(
          baseUrl + "/submissions/" + encodeURIComponent(submission.token) + "?base64_encoded=false",
          {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(10000)
          }
        );
        execution = await readJudge0Response(response);
      } catch (error) {
        if (error instanceof HttpsError) throw error;
        console.error("Java challenge polling failed:", error);
        throw new HttpsError("unavailable", "تعذر الحصول على نتيجة تشغيل Java.");
      }
      if (execution.status && execution.status.id > 2) break;
    }

    if (!execution || !execution.status || execution.status.id <= 2) {
      throw new HttpsError("deadline-exceeded", "استغرق تشغيل Java وقتًا طويلًا.");
    }

    if (execution.status.id !== 3) {
      return {
        success: true,
        correct: false,
        message: safeOutput(
          execution.compile_output ||
          execution.stderr ||
          execution.message ||
          execution.status.description
        )
      };
    }

    const normalize = value => String(value || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map(line => line.trim())
      .join("\n")
      .trim();

    if (normalize(execution.stdout) !== normalize(challenge.output)) {
      return {
        success: true,
        correct: false,
        message: "تم تشغيل البرنامج، لكن الناتج لا يطابق المطلوب.",
        stdout: safeOutput(execution.stdout),
        expectedOutput: challenge.output
      };
    }

    const lessonId = "java_" + chapter + "_" + lesson;
    const resultRef = db.collection("users").doc(uid)
      .collection("quizResults").doc("lesson_" + lessonId);

    await db.runTransaction(async transaction => {
      const existingSnapshot = await transaction.get(resultRef);
      const existing = existingSnapshot.exists ? existingSnapshot.data() || {} : {};
      const quizAlreadyVerified = existing.quizVerified === true;

      transaction.set(resultRef, {
        verificationVersion: 1,
        serverVerified: true,
        passed: quizAlreadyVerified,
        challengeVerified: true,
        quizVerified: quizAlreadyVerified,
        uid,
        lessonId,
        language: "java",
        chapter,
        lesson,
        verificationType: "java-challenge",
        verifiedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    });

    return {
      success: true,
      correct: true,
      message: "تم التحقق من الحل والناتج على الخادم.",
      stdout: safeOutput(execution.stdout)
    };
  }
);

/*
 * التحقق الخادمي من سؤال فهم Java بعد اجتياز تحدي الكود.
 * لا يصبح إثبات الدرس قابلًا للمكافأة إلا بعد نجاح التحققين.
 */
exports.verifyJavaQuizAnswer = onCall(
  CALL_OPTIONS,
  async request => {
    const uid = requireAuth(request);
    const { chapter, lesson, selectedIndex } = request.data || {};

    if (!Number.isInteger(chapter) || chapter < 0 || chapter >= 8) {
      throw new HttpsError("invalid-argument", "رقم فصل Java غير صالح.");
    }
    if (!Number.isInteger(lesson) || lesson < 0 || lesson >= 2) {
      throw new HttpsError("invalid-argument", "رقم درس Java غير صالح.");
    }
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 2) {
      throw new HttpsError("invalid-argument", "اختيار سؤال Java غير صالح.");
    }

    const correctIndex = JAVA_QUIZ_ANSWERS[chapter + "_" + lesson];
    if (correctIndex === undefined) {
      throw new HttpsError("not-found", "سؤال Java غير موجود.");
    }
    if (selectedIndex !== correctIndex) {
      return { success: true, correct: false, message: "الإجابة غير صحيحة. حاول مرة أخرى." };
    }

    const lessonId = "java_" + chapter + "_" + lesson;
    const resultRef = db.collection("users").doc(uid)
      .collection("quizResults").doc("lesson_" + lessonId);
    const resultSnapshot = await resultRef.get();

    if (!resultSnapshot.exists || resultSnapshot.data()?.challengeVerified !== true) {
      throw new HttpsError(
        "failed-precondition",
        "اجتز تحدي الكود على الخادم أولًا قبل اعتماد سؤال الفهم."
      );
    }

    await resultRef.set({
      verificationVersion: 1,
      serverVerified: true,
      passed: true,
      quizVerified: true,
      selectedQuizIndex: selectedIndex,
      quizVerifiedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return {
      success: true,
      correct: true,
      message: "تم التحقق من إجابة السؤال على الخادم."
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

  const cached = curriculumCache.get(language);
  let curriculum = cached && Date.now() - cached.cachedAt < CURRICULUM_CACHE_TTL_MS
    ? cached.value
    : null;

  if (!curriculum) {
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

    curriculumCache.set(language, {
      value: curriculum,
      cachedAt: Date.now()
    });
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
 * حفظ تقدم الدرس بعد التحقق من الإثبات الخادمي.
 * يكتب Admin SDK السجل بعد فحص quizResults، فلا يعتمد الحفظ على
 * صلاحية كتابة lessonProgress من المتصفح أو على نشر قواعد قديمة.
 */
exports.saveVerifiedLessonProgress = onCall(
  CALL_OPTIONS,
  async request => {
    const uid = requireAuth(request);
    await enforceUserRateLimit(uid, "saveLessonProgress");

    const { language, chapter, lesson } = request.data || {};
    if (!Object.prototype.hasOwnProperty.call(CURRICULUM_URLS, language)) {
      throw new HttpsError("invalid-argument", "لغة البرمجة غير مدعومة.");
    }
    if (!Number.isInteger(chapter) || chapter < 0 || chapter > 100 ||
        !Number.isInteger(lesson) || lesson < 0 || lesson > 100) {
      throw new HttpsError("invalid-argument", "موضع الدرس غير صالح.");
    }

    const lessonId = language + "_" + chapter + "_" + lesson;
    const userRef = db.collection("users").doc(uid);
    const proofRef = userRef.collection("quizResults").doc("lesson_" + lessonId);
    const progressRef = userRef.collection("lessonProgress").doc(lessonId);
    const proofSnapshot = await proofRef.get();

    if (!proofSnapshot.exists) {
      throw new HttpsError("failed-precondition", "لم يتم العثور على إثبات اجتياز الدرس من الخادم.");
    }

    const proof = proofSnapshot.data() || {};
    const validProof =
      proof.uid === uid &&
      proof.language === language &&
      proof.chapter === chapter &&
      proof.lesson === lesson &&
      proof.serverVerified === true &&
      proof.passed === true &&
      proof.verificationVersion === 1 &&
      (language !== "java" ||
        (proof.challengeVerified === true && proof.quizVerified === true));

    if (!validProof) {
      throw new HttpsError("failed-precondition", "إثبات إكمال الدرس غير مكتمل أو لا يطابق الحساب.");
    }

    await progressRef.set({
      language,
      chapter,
      lesson,
      completed: true,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true, id: lessonId, language, chapter, lesson, completed: true };
  }
);

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
    await enforceUserRateLimit(uid, "quizAnswer");

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

  const match = /^(python|javascript|cpp|java)_(\d+)_(\d+)$/.exec(
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
    && result.lesson === lesson.lesson
    && (
      lesson.language !== "java" ||
      (result.challengeVerified === true && result.quizVerified === true)
    );
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

    if (newData.completed !== true) return;

    // Re-check even when the progress document was already complete:
    // a later successful server verification may make its reward eligible.
    // awardCompletedLesson is idempotent through the gameRewards document.
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
      // لا ننشر الاسم الذي أدخله المستخدم عند التسجيل.
      // نستخدم معرفًا مستعارًا ثابتًا بدلًا منه في لوحة المتصدرين.
      displayName: `مستكشف-${uid.slice(-6)}`,

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
 * تطبيع كود Python للمقارنة دون حساسية غير ضرورية للمسافات
 * أو لاختيار علامات الاقتباس المفردة/المزدوجة.
 * نحذف التعليقات خارج النصوص فقط، ونحافظ على المسافات داخل النص.
 */
function normalizePythonSource(value) {
  const source = String(value || "");
  let normalized = "";
  let quote = null;
  let escaped = false;
  let inComment = false;

  for (const character of source) {
    if (inComment) {
      if (character === "\n") inComment = false;
      continue;
    }

    if (quote) {
      if (escaped) {
        normalized += character;
        escaped = false;
        continue;
      }
      if (character === "\\") {
        normalized += character;
        escaped = true;
        continue;
      }
      if (character === quote) {
        normalized += '"';
        quote = null;
        continue;
      }
      normalized += character;
      continue;
    }

    if (character === "#") {
      inComment = true;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      normalized += '"';
      continue;
    }
    if (/\s/.test(character)) continue;
    normalized += character;
  }

  return normalized;
}

/*
 * فحص وجود الأجزاء المطلوبة في الكود بعد تطبيع المسافات والاقتباسات.
 * يبقى تشغيل الكود ومطابقة الناتج على الخادم شرطًا أساسيًا.
 */
function validatePythonChallengeSource(code, challenge) {
  if (
    !Array.isArray(challenge.required) ||
    challenge.required.length === 0
  ) {
    return false;
  }

  const normalizedCode = normalizePythonSource(code);
  return challenge.required.every(part =>
    normalizedCode.includes(normalizePythonSource(part))
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
    console.error("Judge0 submission response did not include a token:", {
      responseKeys: submission && typeof submission === "object"
        ? Object.keys(submission).slice(0, 12)
        : []
    });
    throw new HttpsError(
      "unavailable",
      "خدمة تشغيل الأكواد لم تبدأ التنفيذ حاليًا. حاول مرة أخرى بعد قليل."
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

  // Judge0 status 13 is an upstream execution-service failure. Do not
  // misreport it as a learner-code failure or return a generic "Internal".
  if (result.status.id === 13) {
    console.error("Judge0 reported an internal execution error:", {
      statusId: result.status.id,
      status: String(result.status.description || "Internal Error").slice(0, 80)
    });
    throw new HttpsError(
      "unavailable",
      "خدمة تشغيل الأكواد الخارجية واجهت خطأ مؤقتًا. الكود لم يُرفض بسبب صياغته؛ حاول مرة أخرى بعد قليل."
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
    let stage = "input-validation";
    try {
    const uid = requireAuth(request);
    await enforceUserRateLimit(uid, "verifyPythonChallenge");

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

    stage = "judge0-execution";
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
    stage = "proof-write";
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
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("verifyPythonChallenge failed:", {
        stage,
        code: typeof error?.code === "string" ? error.code : "unknown",
        name: typeof error?.name === "string" ? error.name : "Error"
      });
      throw new HttpsError(
        "unavailable",
        stage === "proof-write"
          ? "تم تنفيذ التحدي، لكن تعذر حفظ إثبات النجاح. حاول مرة أخرى."
          : "تعذر التحقق من التحدي حاليًا. حاول مرة أخرى بعد قليل."
      );
    }
  }
);
// -----------------------------------------------------------------------------
// Parent dashboard: child-initiated, one-time account linking.
// Parent data is returned only by callable functions after checking the link.
// -----------------------------------------------------------------------------
const crypto = require("crypto");

function hashParentLinkCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

exports.createParentLinkCode = onCall(CALL_OPTIONS, async request => {
  const childUid = requireAuth(request);
  const code = crypto.randomBytes(8).toString("hex");
  const codeHash = hashParentLinkCode(code);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await db.collection("parentLinkCodes").doc(codeHash).create({
    childUid,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    claimedBy: null
  });

  return {
    success: true,
    code,
    expiresAt: expiresAt.toISOString(),
    expiresInMinutes: 30
  };
});

exports.claimParentLinkCode = onCall(CALL_OPTIONS, async request => {
  const parentUid = requireAuth(request);
  const code = String(request.data?.code || "").trim().toLowerCase();

  if (!/^[a-f0-9]{16}$/.test(code)) {
    throw new HttpsError("invalid-argument", "رمز الربط غير صحيح.");
  }

  const codeRef = db.collection("parentLinkCodes").doc(hashParentLinkCode(code));

  const result = await db.runTransaction(async transaction => {
    const codeSnapshot = await transaction.get(codeRef);
    if (!codeSnapshot.exists) {
      throw new HttpsError("not-found", "رمز الربط غير موجود أو تم استخدامه.");
    }

    const invite = codeSnapshot.data() || {};
    if (invite.claimedBy) {
      throw new HttpsError("already-exists", "تم استخدام رمز الربط بالفعل.");
    }
    if (!invite.expiresAt || invite.expiresAt.toMillis() <= Date.now()) {
      throw new HttpsError("deadline-exceeded", "انتهت صلاحية رمز الربط. اطلب رمزًا جديدًا.");
    }
    if (!invite.childUid || invite.childUid === parentUid) {
      throw new HttpsError("failed-precondition", "لا يمكن ربط الحساب بنفسه.");
    }

    const childRef = db.collection("users").doc(invite.childUid);
    const childSnapshot = await transaction.get(childRef);
    if (!childSnapshot.exists) {
      throw new HttpsError("not-found", "حساب المتعلم غير موجود.");
    }

    const linkRef = db.collection("parentLinks").doc(invite.childUid + "_" + parentUid);
    const existingLink = await transaction.get(linkRef);
    if (existingLink.exists) {
      throw new HttpsError("already-exists", "هذا الحساب مرتبط بالفعل.");
    }

    transaction.create(linkRef, {
      childUid: invite.childUid,
      parentUid,
      createdAt: FieldValue.serverTimestamp()
    });
    transaction.update(codeRef, {
      claimedBy: parentUid,
      claimedAt: FieldValue.serverTimestamp()
    });

    return {
      childUid: invite.childUid,
      childName: String(childSnapshot.data()?.displayName || "المتعلم").slice(0, 50)
    };
  });

  return { success: true, ...result };
});

// Curriculum bounds used by the parent dashboard. Client-writable progress
// documents must not be allowed to inflate family statistics with invented
// lesson positions or duplicate document IDs.
const PARENT_PROGRESS_LESSON_COUNTS = Object.freeze({
  python: Object.freeze([4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]),
  javascript: Object.freeze([3, 4, 4, 3, 3, 4, 3, 2]),
  cpp: Object.freeze([5, 3, 3, 3, 3, 4, 2]),
  java: Object.freeze([2, 2, 2, 2, 2, 2, 2, 2])
});

function isValidParentLessonProgressDocument(documentSnapshot) {
  if (!documentSnapshot || typeof documentSnapshot.id !== "string") {
    return false;
  }

  const item = documentSnapshot.data() || {};
  const lessonCounts = PARENT_PROGRESS_LESSON_COUNTS[item.language];

  if (
    item.completed !== true ||
    !lessonCounts ||
    !Number.isSafeInteger(item.chapter) ||
    !Number.isSafeInteger(item.lesson) ||
    item.chapter < 0 ||
    item.chapter >= lessonCounts.length ||
    item.lesson < 0 ||
    item.lesson >= lessonCounts[item.chapter]
  ) {
    return false;
  }

  // The canonical ID prevents duplicate or mismatched records from being
  // counted as separate completed lessons.
  return documentSnapshot.id ===
    `${item.language}_${item.chapter}_${item.lesson}`;
}

exports.getParentDashboard = onCall(CALL_OPTIONS, async request => {
  const parentUid = requireAuth(request);
  let stage = "parent-links";

  try {
    const linksSnapshot = await db.collection("parentLinks")
      .where("parentUid", "==", parentUid)
      .limit(10)
      .get();

    stage = "child-data";
    const children = await Promise.all(linksSnapshot.docs.map(async linkDoc => {
      const link = linkDoc.data() || {};
      const childUid = link.childUid;
      if (typeof childUid !== "string" || !childUid) return null;

      const childRef = db.collection("users").doc(childUid);
      const [profileResult, progressResult, projectsResult] = await Promise.allSettled([
        childRef.get(),
        childRef.collection("lessonProgress").get(),
        db.collection("projects").where("userId", "==", childUid).get()
      ]);

      // A profile is required to identify the linked learner. Progress and
      // project reads are independent: one unavailable collection must not
      // blank the entire family dashboard.
      if (profileResult.status === "rejected") {
        console.error("getParentDashboard child profile read failed:", {
          stage: "child-profile",
          code: typeof profileResult.reason?.code === "string" ? profileResult.reason.code : "unknown"
        });

        // Preserve the existing parent-child link in the response. A temporary
        // profile read failure must not look like the parent has no linked child.
        return {
          childUid,
          displayName: "بيانات الحساب غير متاحة مؤقتًا",
          xp: 0,
          stars: 0,
          level: 1,
          completedLessons: 0,
          lessonsThisWeek: 0,
          projectsCount: 0,
          languageCounts: { python: 0, javascript: 0, cpp: 0, java: 0 },
          dataAvailability: {
            profile: false,
            progress: false,
            projects: false
          },
          lastActivity: null
        };
      }

      const childSnapshot = profileResult.value;
      if (!childSnapshot.exists) return null;
      const profile = childSnapshot.data() || {};

      const progressAvailable = progressResult.status === "fulfilled";
      const projectsAvailable = projectsResult.status === "fulfilled";

      if (!progressAvailable) {
        console.error("getParentDashboard progress read failed:", {
          stage: "child-progress",
          code: typeof progressResult.reason?.code === "string" ? progressResult.reason.code : "unknown"
        });
      }
      if (!projectsAvailable) {
        console.error("getParentDashboard projects read failed:", {
          stage: "child-projects",
          code: typeof projectsResult.reason?.code === "string" ? projectsResult.reason.code : "unknown"
        });
      }

      const progressSnapshot = progressAvailable ? progressResult.value : { docs: [] };
      const projectsSnapshot = projectsAvailable ? projectsResult.value : { size: 0 };
      // A client-writable progress record is not proof of passing a lesson.
      // Match each canonical record to its server-only quizResults evidence.
      const candidateProgress = progressSnapshot.docs
        .filter(isValidParentLessonProgressDocument);
      let verificationAvailable = true;
      let verifiedProgressDocs = [];

      if (candidateProgress.length) {
        try {
          const resultRefs = candidateProgress.map(doc =>
            childRef.collection("quizResults").doc(`lesson_${doc.id}`)
          );
          const resultSnapshots = await db.getAll(...resultRefs);

          verifiedProgressDocs = candidateProgress.filter((doc, index) => {
            const lesson = getRewardableLesson(doc.id, doc.data());
            const resultSnapshot = resultSnapshots[index];
            return lesson && resultSnapshot?.exists === true
              && hasVerifiedLessonResult(
                childUid,
                doc.id,
                lesson,
                resultSnapshot.data()
              );
          });
        } catch (verificationError) {
          verificationAvailable = false;
          console.error("getParentDashboard progress verification failed:", {
            stage: "progress-verification",
            code: typeof verificationError?.code === "string"
              ? verificationError.code
              : "unknown"
          });
        }
      }

      const completed = verifiedProgressDocs.map(doc => doc.data() || {});

      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const recent = completed.filter(item => {
        const timestamp = item.updatedAt?.toMillis?.();
        return Number.isFinite(timestamp) && timestamp >= weekAgo && timestamp <= now;
      });

      const languages = {};
      for (const language of ["python", "javascript", "cpp", "java"]) {
        languages[language] = completed.filter(item => item.language === language).length;
      }

      const timestamps = completed
        .map(item => item.updatedAt?.toMillis?.())
        .filter(Number.isFinite);
      const lastActivity = timestamps.length ? Math.max(...timestamps) : null;

      return {
        childUid,
        displayName: String(profile.displayName || "المتعلم").slice(0, 50),
        xp: Number.isSafeInteger(profile.xp) && profile.xp >= 0 ? profile.xp : 0,
        stars: Number.isSafeInteger(profile.stars) && profile.stars >= 0 ? profile.stars : 0,
        level: Number.isSafeInteger(profile.level) && profile.level >= 1 ? profile.level : 1,
        completedLessons: completed.length,
        lessonsThisWeek: recent.length,
        projectsCount: projectsSnapshot.size,
        languageCounts: languages,
        dataAvailability: {
          progress: progressAvailable && verificationAvailable,
          projects: projectsAvailable
        },
        lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null
      };
    }));

    return {
      success: true,
      children: children.filter(Boolean),
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    // Keep private account identifiers and document contents out of logs.
    console.error("getParentDashboard failed:", {
      stage,
      code: typeof error?.code === "string" ? error.code : "unknown",
      name: typeof error?.name === "string" ? error.name : "Error"
    });

    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      "unavailable",
      "تعذر تحميل بيانات لوحة ولي الأمر حاليًا. حاول تحديث الصفحة بعد قليل."
    );
  }
});

exports.unlinkParentChild = onCall(CALL_OPTIONS, async request => {
  const parentUid = requireAuth(request);
  const childUid = String(request.data?.childUid || "");
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(childUid)) {
    throw new HttpsError("invalid-argument", "حساب المتعلم غير صالح.");
  }

  const linkRef = db.collection("parentLinks").doc(childUid + "_" + parentUid);
  const snapshot = await linkRef.get();
  if (!snapshot.exists || snapshot.data()?.parentUid !== parentUid) {
    throw new HttpsError("not-found", "لا يوجد ربط بهذا الحساب.");
  }
  await linkRef.delete();
  return { success: true };
});

exports.getMyParentLinks = onCall(CALL_OPTIONS, async request => {
  const childUid = requireAuth(request);
  const linksSnapshot = await db.collection("parentLinks")
    .where("childUid", "==", childUid)
    .limit(10)
    .get();

  const parents = await Promise.all(linksSnapshot.docs.map(async linkDoc => {
    const parentUid = linkDoc.data()?.parentUid;
    if (typeof parentUid !== "string" || !parentUid) return null;
    const parentSnapshot = await db.collection("users").doc(parentUid).get();
    const profile = parentSnapshot.exists ? parentSnapshot.data() || {} : {};
    return {
      parentUid,
      displayName: String(profile.displayName || "ولي الأمر").slice(0, 50)
    };
  }));

  return { success: true, parents: parents.filter(Boolean) };
});

exports.removeParentLinkAsChild = onCall(CALL_OPTIONS, async request => {
  const childUid = requireAuth(request);
  const parentUid = String(request.data?.parentUid || "");
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(parentUid)) {
    throw new HttpsError("invalid-argument", "حساب ولي الأمر غير صالح.");
  }

  const linkRef = db.collection("parentLinks").doc(childUid + "_" + parentUid);
  const snapshot = await linkRef.get();
  if (!snapshot.exists || snapshot.data()?.childUid !== childUid) {
    throw new HttpsError("not-found", "لا يوجد ربط بهذا الحساب.");
  }
  await linkRef.delete();
  return { success: true };
});
