import { runCodeOnServer, checkQuizAnswerOnServer } from "./code-runner.js";

import {
  requireUser,
  saveLessonProgress,
  getLessonProgress,
  getUserProfile
} from "./auth.js";


const LANGUAGE_CONFIG = {
  javascript: {
    label: "JavaScript",
    curriculumUrl: "./json/js_curriculum.json",
    editorLanguage: "javascript",
    starter: "console.log('مرحبًا بك في CodeQuest');"
  },
  python: {
    label: "Python",
    curriculumUrl: "./json/python_curriculum.json",
    editorLanguage: "python",
    starter: 'print("مرحبًا بك في CodeQuest")'
  },
  cpp: {
    label: "C++",
    curriculumUrl: "./json/cpp_curriculum.json",
    editorLanguage: "text/x-c++src",
    starter: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, CodeQuest!" << endl;
    return 0;
}`
  }
};

const params = new URLSearchParams(window.location.search);
const languageKey = (params.get("lang") || "javascript").toLowerCase();

function parseIndex(value) {
  if (value === null || value.trim() === "") return 0;

  const number = Number(value);

  return Number.isSafeInteger(number) && number >= 0
    ? number
    : -1;
}

const chapterIndex = parseIndex(params.get("chapter"));
const lessonIndex = parseIndex(params.get("lesson"));

let currentUser = null;
let curriculum = null;
let currentChapter = null;
let currentLesson = null;

let lessonCompleted = false;
let selectedQuizOption = null;
let quizPassed = false;
let lessonNeedsServerVerification = false;

let editor = null;
let editorResizeObserver = null;
let quizRequestInProgress = false;
let codeRunning = false;

function byId(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = byId(id);

  if (element) {
    element.textContent = value ?? "";
  }
}

function setStatus(message, type = "info") {
  const status = byId("pageStatus");

  if (!status) return;

  status.textContent = message || "";

  status.classList.remove(
    "success",
    "error",
    "info"
  );

  if (
    message &&
    ["success", "error", "info"].includes(type)
  ) {
    status.classList.add(type);
  }

  status.hidden = !message;
}

function setFeedback(element, message, type = "") {
  if (!element) return;

  element.textContent = message || "";

  element.classList.remove(
    "success",
    "error",
    "info"
  );

  if (["success", "error", "info"].includes(type)) {
    element.classList.add(type);
  }
}

function setBusy(isBusy) {
  codeRunning = isBusy;

  const runButton = byId("runCodeBtn");
  const nextButton = byId("nextLessonBtn");

  if (runButton) {
    runButton.disabled = isBusy;
  }

  if (nextButton) {
    nextButton.disabled = isBusy || !lessonCompleted;
  }
}

function getCodeEditorValue() {
  if (
    editor &&
    typeof editor.getValue === "function"
  ) {
    return editor.getValue();
  }

  return byId("codeEditor")?.value || "";
}

function setCodeEditorValue(value) {
  if (
    editor &&
    typeof editor.setValue === "function"
  ) {
    editor.setValue(value);
    return;
  }

  const textarea = byId("codeEditor");

  if (textarea) {
    textarea.value = value;
  }
}

function initializeEditor() {
  const textarea = byId("codeEditor");

  if (!textarea) return;

  if (
    window.CodeMirror &&
    typeof window.CodeMirror.fromTextArea === "function"
  ) {
    try {
      editorResizeObserver?.disconnect();
      editor = window.CodeMirror.fromTextArea(textarea, {
        lineNumbers: true,
        mode: LANGUAGE_CONFIG[languageKey].editorLanguage,
        theme: "dracula",
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        autofocus: false,
        inputStyle: "contenteditable",
        screenReaderLabel: "محرر الكود",
        extraKeys: {
          Tab: cm => {
            if (cm.somethingSelected()) cm.indentSelection("add");
            else cm.replaceSelection(" ".repeat(cm.getOption("indentUnit") || 4), "end");
          },
          "Shift-Tab": cm => cm.indentSelection("subtract")
        }
      });

      editor.setSize("100%", null);
      if (typeof ResizeObserver !== "undefined") {
        editorResizeObserver = new ResizeObserver(() => editor?.refresh());
        editorResizeObserver.observe(editor.getWrapperElement());
      }
      requestAnimationFrame(() => editor?.refresh());

    } catch (error) {
      console.warn(
        "تعذر تشغيل CodeMirror:",
        error
      );

      editor = null;
    }
  }
}

function updateEditorLanguage() {
  setText(
    "editorLanguage",
    LANGUAGE_CONFIG[languageKey]?.label || "JavaScript"
  );

  if (editor && window.CodeMirror) {
    editor.setOption(
      "mode",
      LANGUAGE_CONFIG[languageKey].editorLanguage
    );
  }
}

function normalizeQuiz(rawQuiz) {
  if (!rawQuiz) return null;

  if (Array.isArray(rawQuiz)) {
    rawQuiz = rawQuiz[0];

    if (!rawQuiz) return null;
  }

  const question =
    rawQuiz.question ||
    rawQuiz.prompt ||
    rawQuiz.text ||
    "";

  let options =
    rawQuiz.options ||
    rawQuiz.choices ||
    rawQuiz.answers ||
    [];

  if (!Array.isArray(options)) {
    options = Object.values(options);
  }

  const correctIndex = Number.isInteger(rawQuiz.correct_index)
    ? rawQuiz.correct_index
    : Number.isInteger(rawQuiz.correctIndex)
      ? rawQuiz.correctIndex
      : Number.isInteger(rawQuiz.correct)
        ? rawQuiz.correct
        : null;

  return {
    question: String(question),

    options: options.filter(
      (option) =>
        typeof option === "string" ||
        (option && typeof option === "object")
    ),

    correctIndex,

    explanation: String(
      rawQuiz.explanation ||
      rawQuiz.feedback ||
      ""
    ),

    successMessage: String(
      rawQuiz.success_msg ||
      rawQuiz.successMessage ||
      rawQuiz.explanation ||
      ""
    ),

    failMessage: String(
      rawQuiz.fail_msg ||
      rawQuiz.failMessage ||
      "الإجابة غير صحيحة. راجع شرح الدرس وحاول مرة أخرى."
    )
  };
}

function normalizeOption(option) {
  if (
    typeof option === "object" &&
    option !== null
  ) {
    return String(
      option.text ??
      option.label ??
      option.value ??
      ""
    );
  }

  return String(option ?? "");
}

function getLessonCode(lesson) {
  return (
    lesson?.starter_code ||
    lesson?.code_example ||
    lesson?.code ||
    LANGUAGE_CONFIG[languageKey].starter
  );
}

function getChapterList() {
  return Array.isArray(curriculum?.chapters)
    ? curriculum.chapters
    : [];
}

function getLessons(chapter) {
  return Array.isArray(chapter?.lessons)
    ? chapter.lessons
    : [];
}

function getTotalLessons() {
  return getChapterList().reduce(
    (total, chapter) =>
      total + getLessons(chapter).length,
    0
  );
}

function getNextLessonUrl() {
  const chapters = getChapterList();
  const lessons = getLessons(currentChapter);

  if (lessonIndex + 1 < lessons.length) {
    return (
      `lecture.html?lang=${encodeURIComponent(languageKey)}` +
      `&chapter=${chapterIndex}&lesson=${lessonIndex + 1}`
    );
  }

  for (
    let nextChapter = chapterIndex + 1;
    nextChapter < chapters.length;
    nextChapter++
  ) {
    if (getLessons(chapters[nextChapter]).length > 0) {
      return (
        `lecture.html?lang=${encodeURIComponent(languageKey)}` +
        `&chapter=${nextChapter}&lesson=0`
      );
    }
  }

  return null;
}

function getLevelsUrl() {
  return `levels.html?lang=${encodeURIComponent(languageKey)}`;
}

function getLocalProgressStorageKey() {
  return `codequest_lesson_progress_${currentUser?.uid || "anonymous"}_${languageKey}`;
}

function getLocalProgress() {
  try {
    const value = JSON.parse(
      localStorage.getItem(getLocalProgressStorageKey()) || "[]"
    );
    return Array.isArray(value)
      ? value.filter(item =>
          item &&
          item.completed === true &&
          Number.isSafeInteger(item.chapter) &&
          Number.isSafeInteger(item.lesson)
        )
      : [];
  } catch (error) {
    console.warn("تعذر قراءة التقدم المحلي:", error);
    return [];
  }
}

function saveLocalLessonCompletion({ serverVerified = true } = {}) {
  try {
    const records = getLocalProgress();
    const key = `${chapterIndex}:${lessonIndex}`;
    const next = records.filter(
      item => `${item.chapter}:${item.lesson}` !== key
    );
    next.push({
      language: languageKey,
      chapter: chapterIndex,
      lesson: lessonIndex,
      completed: true,
      serverVerified
    });
    localStorage.setItem(
      getLocalProgressStorageKey(),
      JSON.stringify(next)
    );
    return true;
  } catch (error) {
    console.warn("تعذر حفظ التقدم محليًا:", error);
    return false;
  }
}

async function syncLocalProgressToCloud() {
  const pending = getLocalProgress();
  const syncUid = currentUser?.uid;
  if (!pending.length || !syncUid) return;

  // A local completion without server verification must never become a
  // trusted cloud completion merely because connectivity returned.
  const unsynced = pending.filter(item => item.serverVerified !== true);
  for (const item of pending) {
    if (item.serverVerified !== true) continue;
    if (currentUser?.uid !== syncUid) {
      unsynced.push(item);
      continue;
    }

    try {
      await saveLessonProgress({
        language: languageKey,
        chapter: item.chapter,
        lesson: item.lesson,
        completed: true,
        expectedUid: syncUid
      });
    } catch (error) {
      console.warn("تعذرت مزامنة إنجاز محلي موثّق:", item, error);
      unsynced.push(item);
    }
  }

  try {
    localStorage.setItem(getLocalProgressStorageKey(), JSON.stringify(unsynced));
  } catch (error) {
    console.warn("تعذر تحديث سجل المزامنة المحلية:", error);
  }
}

function mergeProgressRecords(cloudRecords = []) {
  const records = new Map();
  // Local-only records remain visible, but the cloud record is authoritative
  // for timestamps and account-synced state when the same lesson exists.
  [...getLocalProgress(), ...(Array.isArray(cloudRecords) ? cloudRecords : [])]
    .forEach(item => {
      if (item?.completed === true) {
        records.set(`${item.chapter}:${item.lesson}`, item);
      }
    });
  return [...records.values()];
}

function renderProgress(progressData) {
  const total = Math.max(getTotalLessons(), 1);
  const completed = new Set();

  if (Array.isArray(progressData)) {
    progressData.forEach((item) => {
      if (item?.completed === true) {
        completed.add(
          `${item.chapter}:${item.lesson}`
        );
      }
    });

  } else if (
    progressData &&
    typeof progressData === "object"
  ) {
    Object.entries(progressData).forEach(([key, value]) => {
      if (
        value === true ||
        value?.completed === true ||
        value?.status === "completed"
      ) {
        completed.add(key);
      }
    });
  }

  const percent = Math.min(
    100,
    Math.round((completed.size / total) * 100)
  );

  const bar = byId("progressBar");
  const track = byId("progressTrack");

  if (bar) {
    bar.style.width = `${percent}%`;
  }

  if (track) {
    track.setAttribute(
      "aria-valuenow",
      String(percent)
    );
  }

  setText("progressText", `${percent}%`);
}

function renderLessonContent(lesson) {
  setText(
    "lessonNumber",
    `الدرس ${lessonIndex + 1}`
  );

  setText(
    "codyIntro",
    lesson.cody_intro ||
    lesson.intro ||
    "أهلًا بك! خلّينا نتعلم خطوة جديدة مع كودي."
  );

  setText(
    "lessonTitle",
    lesson.title || `الدرس ${lessonIndex + 1}`
  );

  setText(
    "lessonDescription",
    lesson.objective ||
    lesson.description ||
    ""
  );

  setText(
    "lessonExplanation",
    lesson.explanation ||
    lesson.description ||
    lesson.content ||
    ""
  );

  setText(
    "lessonTask",
    lesson.task ||
    lesson.exercise ||
    lesson.practice ||
    ""
  );

  setText(
    "languageLabel",
    LANGUAGE_CONFIG[languageKey].label
  );

  updateEditorLanguage();

  const hints = Array.isArray(lesson.hints)
    ? lesson.hints
    : lesson.hint
      ? [lesson.hint]
      : [];

  const hintButton = byId("hintBtn");
  const hintBox = byId("hintBox");

  if (hintButton) {
    hintButton.hidden = hints.length === 0;
  }

  if (hintBox) {
    hintBox.textContent = hints.join("\n\n");
    hintBox.hidden = true;
  }

  const quiz = normalizeQuiz(
    lesson.quiz || lesson.question
  );

  const questionElement = byId("quizQuestion");
  const optionsElement = byId("quizOptions");
  const checkButton = byId("checkQuizBtn");
  const feedback = byId("quizFeedback");

  selectedQuizOption = null;
  quizPassed = lessonCompleted && !lessonNeedsServerVerification;

  if (questionElement) {
    questionElement.textContent =
      quiz?.question ||
      "لا يوجد سؤال لهذا الدرس حاليًا.";
  }

  if (optionsElement) {
    optionsElement.replaceChildren();

    if (quiz && quiz.options.length > 0) {
      quiz.options.forEach((option, index) => {
        const label = document.createElement("label");

        label.className = "quiz-option";

        const input = document.createElement("input");

        input.type = "radio";
        input.name = "lessonQuiz";
        input.value = String(index);
        input.disabled = quizPassed;

        const span = document.createElement("span");

        span.textContent = normalizeOption(option);

        input.addEventListener("change", () => {
          selectedQuizOption = index;

          optionsElement
            .querySelectorAll(".quiz-option")
            .forEach((item) => {
              item.classList.remove("selected");
            });

          label.classList.add("selected");

          if (checkButton) {
            checkButton.disabled = false;
          }

          setFeedback(feedback, "");
        });

        label.append(input, span);
        optionsElement.append(label);
      });

    } else {
      const message = document.createElement("p");

      message.textContent =
        "لم يُضف سؤال لهذا الدرس بعد.";

      optionsElement.append(message);
    }
  }

  if (checkButton) {
    checkButton.disabled =
      quizPassed ||
      !quiz ||
      quiz.options.length === 0;
  }

  setFeedback(
    feedback,
    lessonNeedsServerVerification
      ? "تم حفظ تقدمك سابقًا، لكن يلزم إعادة التحقق لتأكيد المكافآت."
      : lessonCompleted
        ? "تم إكمال هذا الدرس سابقًا."
        : "",
    lessonNeedsServerVerification ? "info" : lessonCompleted ? "success" : ""
  );

  setCodeEditorValue(getLessonCode(lesson));

  const codeFeedback = byId("codeFeedback");
  if (codeFeedback) {
    codeFeedback.hidden = typeof lesson.expected_output !== "string";
    setFeedback(codeFeedback, "");
  }

  const nextButton = byId("nextLessonBtn");

  if (nextButton) {
    nextButton.textContent = getNextLessonUrl()
      ? "الدرس التالي ←"
      : "العودة للمستويات";

    nextButton.hidden = !lessonCompleted;
    nextButton.disabled = !lessonCompleted;
  }

  const content = byId("lessonContent");

  if (content) {
    content.hidden = false;
  }
}

async function loadCurriculum() {
  const config = LANGUAGE_CONFIG[languageKey];

  if (!config) {
    throw new Error(
      "لغة البرمجة المطلوبة غير معروفة."
    );
  }

  const response = await fetch(
    config.curriculumUrl,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(
      `تعذر تحميل المنهج. تأكد من وجود الملف: ${config.curriculumUrl}`
    );
  }

  curriculum = await response.json();

  if (!Array.isArray(curriculum?.chapters)) {
    throw new Error(
      "ملف المنهج غير صحيح: يجب أن يحتوي على chapters."
    );
  }

  const chapters = getChapterList();

  if (
    chapterIndex < 0 ||
    chapterIndex >= chapters.length
  ) {
    throw new Error("رقم الفصل غير صحيح.");
  }

  const lessons = getLessons(chapters[chapterIndex]);

  if (
    lessonIndex < 0 ||
    lessonIndex >= lessons.length
  ) {
    throw new Error("رقم الدرس غير صحيح.");
  }

  currentChapter = chapters[chapterIndex];
  currentLesson = lessons[lessonIndex];

  if (
    !currentLesson ||
    typeof currentLesson.id !== "string" ||
    !currentLesson.id.trim()
  ) {
    throw new Error(
      "معرّف الدرس غير موجود في ملف المنهج."
    );
  }
}
async function loadProgress() {
  let cloudProgress = [];

  try {
    cloudProgress = await getLessonProgress(languageKey);
  } catch (error) {
    console.warn("تعذر تحميل تقدم الدروس من الحساب:", error);
  }

  renderProgress(mergeProgressRecords(cloudProgress));
}

async function loadCurrentCompletion() {
  let cloudProgress = [];

  try {
    cloudProgress = await getLessonProgress(languageKey);
  } catch (error) {
    console.warn("تعذر قراءة تقدم الدرس من الحساب:", error);
  }

  const hasCloudCompletion = Array.isArray(cloudProgress) && cloudProgress.some(
    item =>
      item?.chapter === chapterIndex &&
      item?.lesson === lessonIndex &&
      item?.completed === true
  );

  lessonCompleted = hasCloudCompletion || mergeProgressRecords(cloudProgress).some(
    item =>
      item.chapter === chapterIndex &&
      item.lesson === lessonIndex &&
      item.completed === true
  );

  const localRecord = getLocalProgress().find(
    item =>
      item.chapter === chapterIndex &&
      item.lesson === lessonIndex &&
      item.completed === true
  );

  // A trusted cloud completion wins over an older offline cache for the
  // same lesson; do not force students to repeat an already verified lesson.
  lessonNeedsServerVerification =
    !hasCloudCompletion && localRecord?.serverVerified === false;
  if (lessonNeedsServerVerification) {
    // Keep navigation available while allowing a fresh server verification attempt.
    quizPassed = false;
  }
}

async function completeCurrentLesson({ serverVerified = true } = {}) {
  if (lessonCompleted && !lessonNeedsServerVerification) {
    quizPassed = true;
    return true;
  }

  try {
    // Only server-verified completions may be written to the trusted cloud
    // progress collection. Offline/unverified completions stay device-local.
    if (serverVerified) {
      await saveLessonProgress({
        language: languageKey,
        chapter: chapterIndex,
        lesson: lessonIndex,
        completed: true,
        expectedUid: currentUser?.uid
      });
    }

    const localSaved = saveLocalLessonCompletion({ serverVerified });
    if (!serverVerified && !localSaved) {
      throw new Error(
        "تعذر حفظ التقدم محليًا. تحقق من مساحة التخزين في المتصفح ثم حاول مرة أخرى."
      );
    }

    // A verified cloud save is authoritative even if the optional local cache
    // cannot be written. An offline completion, however, is valid only when
    // its device-local record was actually persisted.
    lessonCompleted = true;
    lessonNeedsServerVerification = !serverVerified;
    quizPassed = true;

    setStatus(
      serverVerified
        ? "ممتاز! تم حفظ تقدم الدرس في حسابك."
        : "إجابة صحيحة! تم حفظ التقدم على هذا الجهاز، لكن تعذر تأكيد حالة التحقق والمكافأة من الخادم الآن.",
      serverVerified ? "success" : "info"
    );

    const feedback = byId("quizFeedback");

    setFeedback(
      feedback,
      serverVerified
        ? "إجابة صحيحة! تم تسجيل إكمال الدرس."
        : "إجابة صحيحة! يمكنك متابعة الدرس التالي. حالة التحقق والمكافآت غير مؤكدة حتى نتمكن من مراجعة الخادم.",
      serverVerified ? "success" : "info"
    );

    const options = byId("quizOptions");

    if (options) {
      options
        .querySelectorAll('input[type="radio"]')
        .forEach((input) => {
          input.disabled = true;
        });

      const selected = options.querySelector(
        `input[value="${selectedQuizOption}"]`
      );

      selected
        ?.closest(".quiz-option")
        ?.classList.add("selected");
    }

    const checkButton = byId("checkQuizBtn");

    if (checkButton) {
      checkButton.disabled = true;
    }

    const nextButton = byId("nextLessonBtn");

    if (nextButton) {
      nextButton.hidden = false;
      nextButton.disabled = codeRunning;

      nextButton.textContent = getNextLessonUrl()
        ? "الدرس التالي ←"
        : "العودة للمستويات";
    }

    await loadProgress();

    return true;

  } catch (error) {
    console.error(
      "تعذر حفظ تقدم الدرس:",
      error
    );

    const localSaved = saveLocalLessonCompletion({ serverVerified: false });
    lessonCompleted = localSaved;
    lessonNeedsServerVerification = localSaved;
    quizPassed = localSaved;

    if (localSaved) {
      setStatus(
        "تم إكمال الدرس على هذا الجهاز، لكن تعذر مزامنته مع حسابك الآن.",
        "info"
      );
      setFeedback(
        byId("quizFeedback"),
        "إجابة صحيحة! تم حفظ تقدمك محليًا حتى لا يتوقف انتقالك للدرس التالي. ستحتاج المزامنة السحابية عند عودة الاتصال.",
        "info"
      );

      const checkButton = byId("checkQuizBtn");
      if (checkButton) checkButton.disabled = true;

      const options = byId("quizOptions");
      options?.querySelectorAll('input[type="radio"]').forEach(input => {
        input.disabled = true;
      });

      const nextButton = byId("nextLessonBtn");
      if (nextButton) {
        nextButton.hidden = false;
        nextButton.disabled = codeRunning;
        nextButton.textContent = getNextLessonUrl()
          ? "الدرس التالي ←"
          : "العودة للمستويات";
      }

      await loadProgress();
      return true;
    }

    lessonCompleted = false;
    quizPassed = false;
    setStatus(
      "تعذر حفظ التقدم. تحقق من مساحة التخزين والاتصال ثم حاول مرة أخرى.",
      "error"
    );
    setFeedback(
      byId("quizFeedback"),
      "الإجابة صحيحة، لكن تعذر حفظ التقدم على هذا الجهاز أو في الحساب.",
      "error"
    );
    return false;
  }
}

async function checkQuizAnswer() {
  if (
    quizRequestInProgress ||
    selectedQuizOption === null ||
    !currentLesson ||
    quizPassed
  ) {
    return;
  }

  const quiz = normalizeQuiz(
    currentLesson.quiz || currentLesson.question
  );

  const feedback = byId("quizFeedback");
  const checkButton = byId("checkQuizBtn");

  if (!quiz || quiz.options.length === 0) {
    setStatus(
      "لا توجد بيانات سؤال صالحة لهذا الدرس.",
      "error"
    );

    return;
  }

  if (
    !Number.isInteger(selectedQuizOption) ||
    selectedQuizOption < 0 ||
    selectedQuizOption >= quiz.options.length
  ) {
    setStatus(
      "اختيار الإجابة غير صالح. حدّث الصفحة وحاول مرة أخرى.",
      "error"
    );

    return;
  }

  quizRequestInProgress = true;

  if (checkButton) {
    checkButton.disabled = true;
  }

  setFeedback(
    feedback,
    "جاري التحقق من الإجابة...",
    "info"
  );

  try {
    if (!currentUser) {
      throw new Error(
        "انتهت جلسة تسجيل الدخول. سجّل الدخول مرة أخرى."
      );
    }

    const result = await checkQuizAnswerOnServer({
      language: languageKey,
      lessonId: currentLesson.id,
      selectedIndex: selectedQuizOption
    });

    if (result?.success !== true) {
      throw new Error(
        result?.message ||
        "تعذر التحقق من الإجابة حاليًا."
      );
    }

    if (result.correct === true) {
      setFeedback(
        feedback,
        result.explanation || "إجابة صحيحة!",
        "success"
      );

      await completeCurrentLesson();

    } else {
      setFeedback(
        feedback,
        result.explanation ||
          "الإجابة غير صحيحة. حاول مرة أخرى.",
        "error"
      );
    }

  } catch (error) {
    console.error(
      "Quiz check failed:",
      error
    );

    let message =
      error?.message ||
      "حدث خطأ أثناء التحقق من الإجابة.";

    if (error?.code === "functions/unauthenticated") {
      message =
        "انتهت جلسة تسجيل الدخول. سجّل الدخول مرة أخرى.";

    } else if (
      error?.code === "functions/not-found"
    ) {
      message =
        "دالة التحقق غير منشورة أو غير موجودة في Firebase.";

    } else if (
      error?.code === "functions/permission-denied"
    ) {
      message =
        "ليس لديك صلاحية لتنفيذ عملية التحقق.";

    } else if (
      error?.code === "functions/unavailable"
    ) {
      message =
        "خدمة التحقق غير متاحة حاليًا. حاول مرة أخرى.";

    } else if (
      error?.code === "functions/internal" ||
      message.trim().toLowerCase() === "internal"
    ) {
      message =
        "حدث خطأ داخلي أثناء التحقق من الإجابة. لم يتم تسجيل الدرس؛ حاول مرة أخرى بعد قليل.";
    }

    /*
     * عرض تغذية راجعة محلية عند تعذر الوصول إلى Firebase.
     * لا نسجل الدرس ولا نمنح مكافأة إلا بعد نجاح التحقق الخادمي.
     */
    if (Number.isInteger(quiz?.correctIndex)) {
      const locallyCorrect =
        selectedQuizOption === quiz.correctIndex;

      if (locallyCorrect) {
        const localMessage =
          quiz.successMessage ||
          quiz.explanation ||
          "إجابة صحيحة!";

        const completed = await completeCurrentLesson({
          serverVerified: false
        });

        if (completed) {
          setFeedback(
            feedback,
            `${localMessage} يمكنك متابعة الدرس التالي. تعذّر تأكيد التحقق والمكافآت الآن؛ أعِد المحاولة عند استقرار الاتصال.`,
            "info"
          );
        } else {
          setFeedback(
            feedback,
            `${localMessage} تعذر حفظ التقدم حتى على هذا الجهاز. تحقق من مساحة التخزين وحاول مرة أخرى.`,
            "error"
          );
        }
      } else {
        setFeedback(
          feedback,
          quiz.failMessage ||
            "الإجابة غير صحيحة. حاول مرة أخرى.",
          "error"
        );

        setStatus(
          "الإجابة غير صحيحة. يمكنك المحاولة مرة أخرى.",
          "error"
        );
      }

      return;
    }

    setFeedback(
      feedback,
      message,
      "error"
    );

    setStatus(
      message,
      "error"
    );

  } finally {
    quizRequestInProgress = false;

    if (checkButton && !quizPassed) {
      checkButton.disabled =
        selectedQuizOption === null;
    }
  }
}

function showHint() {
  const hintBox = byId("hintBox");
  const hintButton = byId("hintBtn");

  if (!hintBox) return;

  hintBox.hidden = !hintBox.hidden;

  if (hintButton) {
    hintButton.innerHTML = hintBox.hidden
      ? '<i class="ri-lightbulb-line"></i> أظهر التلميح'
      : '<i class="ri-eye-off-line"></i> إخفاء التلميح';
  }

  // لا نمسح نتيجة تشغيل الكود عند إظهار التلميح أو إخفائه.
}

function appendOutput(text, type = "normal") {
  const output = byId("terminalOutput");

  if (!output) return;

  const line = document.createElement("div");

  line.className = `terminal ${type}`;
  line.textContent = String(text ?? "");

  output.append(line);
  output.scrollTop = output.scrollHeight;
}

function checkExpectedOutput(actualOutput) {
  const feedback = byId("codeFeedback");
  const expected = currentLesson?.expected_output;

  if (!feedback || typeof expected !== "string") return;

  feedback.hidden = false;

  const actual = String(actualOutput ?? "").trim();
  const target = expected.trim();

  if (actual === target) {
    setFeedback(
      feedback,
      "ممتاز! الناتج صحيح تمامًا. فهمت المقارنة بشكل صحيح ⭐",
      "success"
    );
  } else {
    setFeedback(
      feedback,
      `الكود اشتغل، لكن الناتج مختلف عن المطلوب. المتوقع: ${target}. راجع علامة المقارنة وحاول مرة أخرى.`,
      "info"
    );
  }
}

function clearOutput() {
  const output = byId("terminalOutput");

  if (output) {
    output.replaceChildren();
  }

  setFeedback(byId("codeFeedback"), "");
}

function runJavaScriptLocally(code) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-scripts");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.cssText = "position:fixed;width:1px;height:1px;left:-10px;top:-10px;border:0;opacity:0;pointer-events:none";

    const encodedCode = encodeBase64Utf8(code);
    const source = "<!doctype html><html><head><meta charset=\\"utf-8\\">" +
      "<meta http-equiv=\\"Content-Security-Policy\\" content=\\"default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; img-src 'none'; media-src 'none'; style-src 'none'; form-action 'none'; base-uri 'none'\\">" +
      "</head><body><script>(() => {" +
      "const send = payload => parent.postMessage({__codeQuestRun:true,...payload}, '*');" +
      "const output = [];" +
      "const format = value => { if(typeof value==='string') return \\"'\\"+value.replace(/\\\\\\\\/g,'\\\\\\\\\\\\\\\\').replace(/'/g,\\"\\\\\\\\'\\").replace(/\\\\n/g,'\\\\\\\\n')+\\"'\\"; if(value===undefined)return 'undefined'; if(value===null)return 'null'; if(Array.isArray(value))return '[ '+value.map(format).join(', ')+' ]'; if(typeof value==='object'){try{return JSON.stringify(value)}catch(_){return '[object Object]'}} return String(value); };" +
      "console.log=(...args)=>output.push(args.map(format).join(' ')); console.info=console.log;" +
      "console.warn=(...args)=>output.push('Warning: '+args.map(format).join(' ')); console.error=(...args)=>output.push('Error: '+args.map(format).join(' '));" +
      "try { const binary=atob('__CODE_PLACEHOLDER__'); const bytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0)); const userCode=new TextDecoder().decode(bytes); (0,eval)(userCode); send({ok:true,stdout:output.join('\\\\n')}); }" +
      "catch(error){send({ok:false,error:(error&&error.name?error.name+': ':'')+(error&&error.message?error.message:String(error))});}" +
      "})();<\\/script></body></html>";
    frame.srcdoc = source.replace("__CODE_PLACEHOLDER__", encodedCode);

    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timeout);
      frame.remove();
      callback(value);
    };
    const onMessage = event => {
      if (event.source !== frame.contentWindow || event.data?.__codeQuestRun !== true) return;
      if (event.data.ok) finish(resolve, event.data.stdout || "تم تشغيل الكود بنجاح، لكن لم تظهر مخرجات.");
      else finish(reject, new Error(event.data.error || "حدث خطأ أثناء تشغيل JavaScript."));
    };
    const timeout = window.setTimeout(() => {
      finish(reject, new Error("توقف التشغيل لأنه استغرق وقتًا طويلًا. راجع الحلقات وتأكد أنها تنتهي."));
    }, 1800);

    window.addEventListener("message", onMessage);
    document.body.append(frame);
  });
}

async function runJavaScript(code) {
  // Run JavaScript lesson code locally in an isolated, opaque-origin iframe.
  // This avoids consuming the shared Judge0 daily quota for lesson examples.
  return runJavaScriptLocally(code);
}

async function runPython(code) {
  const result = await runCodeOnServer(
    "python",
    code,
    byId("stdinInput")?.value || ""
  );

  const diagnostics = [
    result.compileOutput,
    result.stderr,
    result.message
  ].filter(Boolean).join("\n").trim();

  if (!result.ok) {
    throw new Error(
      diagnostics ||
      result.status ||
      "لم ينجح تشغيل Python. راجع الكود وحاول مرة أخرى."
    );
  }

  return result.stdout || "تم تشغيل الكود بنجاح، لكن لم تظهر مخرجات.";
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function decodeBase64Utf8(value) {
  if (!value) return "";

  const binary = atob(value);

  const bytes = Uint8Array.from(
    binary,
    (character) => character.charCodeAt(0)
  );

  return new TextDecoder().decode(bytes);
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function runCpp(code) {
  const result = await runCodeOnServer("cpp", code, byId("stdinInput")?.value || "");

  const diagnostics = [
    result.compileOutput,
    result.stderr,
    result.message
  ].filter(Boolean).join("\n").trim();

  if (!result.ok) {
    throw new Error(
      diagnostics ||
      result.status ||
      "لم ينجح تجميع وتشغيل برنامج C++."
    );
  }

  return result.stdout || "تم تشغيل الكود بدون مخرجات.";
}

async function runCode() {
  const code = getCodeEditorValue();

  if (!code.trim()) {
    appendOutput(
      "اكتب الكود أولًا ثم اضغط تشغيل.",
      "error"
    );

    return;
  }

  if (codeRunning) return;

  clearOutput();
  setBusy(true);

  setStatus(
    "جاري تشغيل الكود...",
    "info"
  );

  try {
    let result;

    if (languageKey === "javascript") {
      result = await runJavaScript(code);

    } else if (languageKey === "python") {
      result = await runPython(code);

    } else if (languageKey === "cpp") {
      result = await runCpp(code);

    } else {
      throw new Error(
        "لغة البرمجة غير مدعومة."
      );
    }

    appendOutput(result, "success");

    if (languageKey === "javascript") {
      checkExpectedOutput(result);
    }

    setStatus(
      "تم تشغيل الكود.",
      "success"
    );

  } catch (error) {
    appendOutput(
      error?.message || String(error),
      "error"
    );

    setStatus(
      "لم ينجح تشغيل الكود. راجع رسالة الخطأ في نافذة النتائج.",
      "error"
    );

  } finally {
    setBusy(false);
  }
}

function resetCode() {
  if (!currentLesson) return;

  setCodeEditorValue(
    getLessonCode(currentLesson)
  );

  clearOutput();

  setStatus(
    "تمت استعادة كود الدرس.",
    "success"
  );
}

function navigateNextLesson() {
  if (!lessonCompleted || codeRunning) return;

  const nextUrl = getNextLessonUrl();

  window.location.href =
    nextUrl || getLevelsUrl();
}

function setEditorPanelExpanded(expanded) {
  const panel = byId("editorPanel");
  const button = byId("editorExpandBtn");
  if (!panel || !button) return;

  panel.classList.toggle("is-expanded", expanded);
  document.body.classList.toggle("editor-panel-open", expanded);
  button.setAttribute("aria-expanded", String(expanded));
  button.textContent = expanded ? "تصغير المحرر" : "تكبير المحرر";

  requestAnimationFrame(() => {
    editor?.refresh();
    if (expanded) {
      editor?.focus();
    } else {
      button.focus();
    }
  });
}

function attachEvents() {
  byId("editorExpandBtn")?.addEventListener("click", () => {
    setEditorPanelExpanded(!byId("editorPanel")?.classList.contains("is-expanded"));
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && byId("editorPanel")?.classList.contains("is-expanded")) {
      setEditorPanelExpanded(false);
    }
  });

  window.addEventListener("resize", () => requestAnimationFrame(() => editor?.refresh()));
  window.visualViewport?.addEventListener("resize", () => requestAnimationFrame(() => editor?.refresh()));

  byId("hintBtn")?.addEventListener(
    "click",
    showHint
  );

  byId("checkQuizBtn")?.addEventListener(
    "click",
    checkQuizAnswer
  );

  byId("runCodeBtn")?.addEventListener(
    "click",
    runCode
  );

  byId("resetCodeBtn")?.addEventListener(
    "click",
    resetCode
  );

  byId("clearOutputBtn")?.addEventListener(
    "click",
    clearOutput
  );

  byId("nextLessonBtn")?.addEventListener(
    "click",
    navigateNextLesson
  );

  byId("backBtn")?.addEventListener(
    "click",
    () => {
      window.location.href = getLevelsUrl();
    }
  );

  byId("backToLevels")?.addEventListener(
    "click",
    () => {
      window.location.href = getLevelsUrl();
    }
  );
}

async function loadLessonAvatar() {
  const container = byId("lessonUserAvatar");
  if (!container) return;
  try {
    const [profile, avatarModule] = await Promise.all([
      getUserProfile(),
      import("./avatars.js")
    ]);
    const inventory = Array.isArray(profile.inventory) ? profile.inventory : [];
    const activeAvatar = typeof profile.activeAvatar === "string" ? profile.activeAvatar : "cody";
    const selected = avatarModule.getAllAvatars().find(avatar =>
      avatar.id === activeAvatar && (!avatar.storeItem || inventory.includes(avatar.id))
    );
    avatarModule.installAvatarStyles();
    container.innerHTML = avatarModule.renderAvatar(selected?.id || "cody");
  } catch (error) {
    console.warn("تعذر تحميل صورة الحساب في الدرس:", error);
  }
}

async function initializeLecture() {
  setStatus(
    "جاري تحميل الدرس...",
    "info"
  );

  try {
    currentUser = await requireUser();

    if (!currentUser) return;

    await loadLessonAvatar();
    void syncLocalProgressToCloud().catch(error => {
      console.warn("تعذرت مزامنة التقدم المحلي:", error);
    });
    await loadCurriculum();

    initializeEditor();

    await loadCurrentCompletion();

    renderLessonContent(currentLesson);

    await loadProgress();

    setStatus("", "info");

  } catch (error) {
    console.error(
      "فشل تحميل الدرس:",
      error
    );

    setStatus(
      error?.message ||
        "تعذر تحميل الدرس. حاول تحديث الصفحة.",
      "error"
    );

    const content = byId("lessonContent");

    if (content) {
      content.hidden = true;
    }
  }
}

attachEvents();
initializeLecture();