const { getFirestore, FieldValue } =
  require("firebase-admin/firestore");

const {
  onCall,
  HttpsError
} = require("firebase-functions/v2/https");

const db = getFirestore();

const CURRICULUM_URLS = Object.freeze({
  javascript:
    "https://raw.githubusercontent.com/mariam2009m44-lab/CodeQuest/main/json/js_curriculum.json",

  python:
    "https://raw.githubusercontent.com/mariam2009m44-lab/CodeQuest/main/json/python_curriculum.json",

  cpp:
    "https://raw.githubusercontent.com/mariam2009m44-lab/CodeQuest/main/json/cpp_curriculum.json"
});

function requireAuthenticatedUser(request) {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError(
      "unauthenticated",
      "يجب تسجيل الدخول أولًا."
    );
  }

  return uid;
}

function validateQuizRequest(data) {
  if (!data || typeof data !== "object") {
    throw new HttpsError(
      "invalid-argument",
      "بيانات الاختبار غير صالحة."
    );
  }

  const {
    language,
    lessonId,
    chapter,
    lesson,
    selectedIndex
  } = data;

  if (
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
    !Number.isSafeInteger(chapter) ||
    chapter < 0 ||
    !Number.isSafeInteger(lesson) ||
    lesson < 0
  ) {
    throw new HttpsError(
      "invalid-argument",
      "رقم الفصل أو الدرس غير صالح."
    );
  }

  if (
    !Number.isSafeInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex > 20
  ) {
    throw new HttpsError(
      "invalid-argument",
      "الاختيار غير صالح."
    );
  }
}

async function loadCurriculumQuiz({
  language,
  lessonId,
  chapter,
  lesson
}) {
  const url = CURRICULUM_URLS[language];

  let response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(12000)
    });
  } catch (error) {
    console.error("Curriculum request failed:", error);

    throw new HttpsError(
      "unavailable",
      "تعذر تحميل المنهج حاليًا."
    );
  }

  if (!response.ok) {
    throw new HttpsError(
      "unavailable",
      "ملف المنهج غير متاح حاليًا."
    );
  }

  let curriculum;

  try {
    curriculum = await response.json();
  } catch {
    throw new HttpsError(
      "internal",
      "ملف المنهج يحتوي على بيانات غير صالحة."
    );
  }

  const chapters = curriculum?.chapters;

  if (!Array.isArray(chapters)) {
    throw new HttpsError(
      "internal",
      "تنسيق ملف المنهج غير صحيح."
    );
  }

  const chapterData = chapters[chapter];

  if (!chapterData || !Array.isArray(chapterData.lessons)) {
    throw new HttpsError(
      "not-found",
      "الفصل المطلوب غير موجود."
    );
  }

  const lessonData = chapterData.lessons[lesson];

  if (
    !lessonData ||
    lessonData.id !== lessonId
  ) {
    throw new HttpsError(
      "not-found",
      "معرّف الدرس لا يطابق بيانات المنهج."
    );
  }

  let quiz = lessonData.quiz || lessonData.question;

  if (Array.isArray(quiz)) {
    quiz = quiz[0];
  }

  if (
    !quiz ||
    !Array.isArray(quiz.options) ||
    !Number.isSafeInteger(quiz.correct_index) ||
    quiz.correct_index < 0 ||
    quiz.correct_index >= quiz.options.length
  ) {
    throw new HttpsError(
      "failed-precondition",
      "بيانات سؤال هذا الدرس غير مكتملة."
    );
  }

  return quiz;
}

exports.verifyLessonQuiz = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB",
    maxInstances: 5
  },
  async request => {
    const uid = requireAuthenticatedUser(request);
    const data = request.data || {};

    validateQuizRequest(data);

    const {
      language,
      lessonId,
      chapter,
      lesson,
      selectedIndex
    } = data;

    const quiz = await loadCurriculumQuiz({
      language,
      lessonId,
      chapter,
      lesson
    });

    if (selectedIndex >= quiz.options.length) {
      throw new HttpsError(
        "invalid-argument",
        "رقم الاختيار غير موجود في السؤال."
      );
    }

    const correct =
      selectedIndex === quiz.correct_index;

    const explanation = String(
      correct
        ? (
            quiz.explanation ||
            quiz.success_msg ||
            "إجابة صحيحة! أحسنت."
          )
        : (
            quiz.fail_msg ||
            "الإجابة غير صحيحة. راجع الشرح وحاول مرة أخرى."
          )
    ).slice(0, 500);

    if (!correct) {
      return {
        success: true,
        correct: false,
        explanation
      };
    }

    const progressId =
      `${language}_${chapter}_${lesson}`;

    const resultId = `lesson_${progressId}`;

    const resultRef = db
      .collection("users")
      .doc(uid)
      .collection("quizResults")
      .doc(resultId);

    await resultRef.set(
      {
        verificationVersion: 1,
        serverVerified: true,
        passed: true,

        uid,
        lessonId: progressId,
        curriculumLessonId: lessonId,

        language,
        chapter,
        lesson,

        verifiedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return {
      success: true,
      correct: true,
      explanation
    };
  }
);