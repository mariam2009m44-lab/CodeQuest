import {
  requireUser,
  saveLessonProgress,
  getLessonProgress
} from "./auth.js";

const $ = (id) => document.getElementById(id);

const params = new URLSearchParams(window.location.search);

const lang = (params.get("lang") || "javascript").toLowerCase();

function parseIndex(value) {
  if (value === null || !/^\d+$/.test(value)) return 0;

  const number = Number(value);
  return Number.isSafeInteger(number) ? number : 0;
}

const chapterIdx = parseIndex(params.get("chapter"));
const lessonIdx = parseIndex(params.get("lesson"));

const LANGUAGES = {
  javascript: {
    label: "JavaScript",
    file: "./json/js_curriculum.json",
    extension: ".js"
  },
  python: {
    label: "Python",
    file: "./json/python_curriculum.json",
    extension: ".py"
  },
  cpp: {
    label: "C++",
    file: "./json/cpp_curriculum.json",
    extension: ".cpp"
  }
};

const config = LANGUAGES[lang];

let currentUser = null;
let curriculum = null;
let currentLesson = null;
let completedKeys = new Set();
let quizQuestions = [];
let quizIndex = 0;
let selectedOption = null;
let hintIndex = 0;
let quizPassed = false;
let savingProgress = false;
let pyodideInstance = null;
let runCounter = 0;
let running = false;

const currentLessonKey = `${chapterIdx}:${lessonIdx}`;

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = String(value ?? "");
}

function showStatus(message) {
  const status = $("pageStatus");
  if (!status) return;

  status.hidden = false;
  status.textContent = message;

  const content = $("lessonContent");
  if (content) content.hidden = true;
}

function showOutput(message, isError = false) {
  const terminal = $("terminalOutput");
  if (!terminal) return;

  terminal.textContent = String(message ?? "");
  terminal.classList.toggle("error", isError);
  terminal.scrollTop = terminal.scrollHeight;
}

function setRunning(value) {
  running = value;

  const button = $("runCodeBtn");
  if (button) {
    button.disabled = value;
    button.innerHTML = value
      ? "جارٍ تشغيل الكود..."
      : '<i class="ri-play-fill"></i> تشغيل الكود';
  }
}

function getLessonCode(lesson) {
  const code =
    lesson?.starter_code ??
    lesson?.code_example ??
    lesson?.code ??
    "";

  return typeof code === "string" ? code : String(code);
}

function getAllLessons() {
  const chapters = Array.isArray(curriculum?.chapters)
    ? curriculum.chapters
    : [];

  return chapters.flatMap((chapter, chapterIndex) =>
    (Array.isArray(chapter.lessons) ? chapter.lessons : [])
      .map((lesson, lessonIndex) => ({
        chapter: chapterIndex,
        lesson: lessonIndex,
        data: lesson
      }))
  );
}

function updateProgress() {
  const lessons = getAllLessons();
  const total = lessons.length;

  const completed = lessons.filter(item =>
    completedKeys.has(`${item.chapter}:${item.lesson}`)
  ).length;

  const percentage = total
    ? Math.round((completed / total) * 100)
    : 0;

  const bar = $("progressBar");
  const track = $("progressTrack");

  if (bar) bar.style.width = `${percentage}%`;

  if (track) {
    track.setAttribute("aria-valuenow", String(percentage));
  }

  setText("progressText", `${percentage}%`);
}

async function loadProgress() {
  if (!currentUser) {
    throw new Error("يجب تسجيل الدخول لعرض تقدمك.");
  }

  const records = await getLessonProgress(lang);

  completedKeys = new Set(
    (Array.isArray(records) ? records : [])
      .filter(item => item?.completed === true)
      .map(item => `${item.chapter}:${item.lesson}`)
  );

  updateProgress();
}

async function markLessonCompleted() {
  if (!currentUser) {
    throw new Error("سجّل الدخول أولًا لحفظ تقدمك.");
  }

  if (savingProgress) return;

  savingProgress = true;

  const button = $("checkQuizBtn");
  if (button) button.disabled = true;

  try {
    await saveLessonProgress({
      language: lang,
      chapter: chapterIdx,
      lesson: lessonIdx,
      completed: true
    });

    completedKeys.add(currentLessonKey);
    quizPassed = true;

    updateProgress();
    updateNavigation();

    setFeedback(
      "إجابة صحيحة! تم حفظ إكمال الدرس في حسابك.",
      "success"
    );
  } catch (error) {
    console.error("Lesson progress save failed:", error);

    setFeedback(
      "إجابتك صحيحة، لكن تعذر حفظ التقدم. تحقق من اتصالك ثم حاول مرة أخرى.",
      "error"
    );
  } finally {
    savingProgress = false;

    if (button) button.disabled = false;
  }
}

function setFeedback(message, type = "") {
  const feedback = $("quizFeedback");
  if (!feedback) return;

  feedback.textContent = message;
  feedback.className = "feedback";

  if (type === "success") feedback.classList.add("success");
  if (type === "error") feedback.classList.add("error");
}

function getNextLesson() {
  const chapters = curriculum?.chapters || [];
  const currentChapter = chapters[chapterIdx];
  const currentLessons = currentChapter?.lessons || [];

  if (lessonIdx + 1 < currentLessons.length) {
    return {
      chapter: chapterIdx,
      lesson: lessonIdx + 1
    };
  }

  for (let index = chapterIdx + 1; index < chapters.length; index++) {
    if (
      Array.isArray(chapters[index].lessons) &&
      chapters[index].lessons.length > 0
    ) {
      return {
        chapter: index,
        lesson: 0
      };
    }
  }

  return null;
}

function updateNavigation() {
  const button = $("nextLessonBtn");
  if (!button) return;

  button.hidden = !quizPassed;
  button.textContent = getNextLesson()
    ? "الدرس التالي ←"
    : "أنهيت المسار! العودة ←";
}

function normalizeQuiz(quiz) {
  if (Array.isArray(quiz)) {
    return quiz.filter(item =>
      item &&
      typeof item.question === "string" &&
      Array.isArray(item.options) &&
      Number.isInteger(item.correct_index) &&
      item.correct_index >= 0 &&
      item.correct_index < item.options.length
    );
  }

  if (
    quiz &&
    typeof quiz.question === "string" &&
    Array.isArray(quiz.options) &&
    Number.isInteger(quiz.correct_index) &&
    quiz.correct_index >= 0 &&
    quiz.correct_index < quiz.options.length
  ) {
    return [quiz];
  }

  return [];
}

function renderQuiz() {
  quizQuestions = normalizeQuiz(currentLesson?.quiz);
  quizIndex = 0;
  selectedOption = null;

  const options = $("quizOptions");
  const question = $("quizQuestion");
  const checkButton = $("checkQuizBtn");

  if (!options || !question || !checkButton) return;

  options.replaceChildren();
  setFeedback("");

  if (!quizQuestions.length) {
    question.textContent =
      "لا يوجد سؤال صالح لهذا الدرس في ملف المنهج.";

    checkButton.disabled = true;
    return;
  }

  checkButton.disabled = false;
  displayQuizQuestion();
}

function displayQuizQuestion() {
  const question = quizQuestions[quizIndex];
  const options = $("quizOptions");

  if (!question || !options) return;

  selectedOption = null;
  options.replaceChildren();

  setText(
    "quizQuestion",
    quizQuestions.length > 1
      ? `السؤال ${quizIndex + 1} من ${quizQuestions.length}: ${question.question}`
      : question.question
  );

  question.options.forEach((option, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "quiz-option";
    button.textContent = String(option);

    button.addEventListener("click", () => {
      if (quizPassed || savingProgress) return;

      selectedOption = index;

      options.querySelectorAll(".quiz-option").forEach(item => {
        item.classList.toggle("selected", item === button);
      });

      setFeedback("");
    });

    options.appendChild(button);
  });

  const checkButton = $("checkQuizBtn");

  if (checkButton) {
    checkButton.disabled = quizPassed;
    checkButton.textContent = "تحقّق من الإجابة";
  }
}

async function checkQuizAnswer() {
  if (quizPassed || savingProgress) return;

  const question = quizQuestions[quizIndex];

  if (!question) return;

  if (selectedOption === null) {
    setFeedback("اختَر إجابة أولًا.", "error");
    return;
  }

  if (selectedOption !== question.correct_index) {
    setFeedback(
      question.fail_msg || "الإجابة غير صحيحة. حاول مرة أخرى.",
      "error"
    );
    return;
  }

  if (quizIndex + 1 < quizQuestions.length) {
    setFeedback(
      question.success_msg ||
      question.explanation ||
      "إجابة صحيحة! انتقل إلى السؤال التالي.",
      "success"
    );

    quizIndex++;
    displayQuizQuestion();
    return;
  }

  await markLessonCompleted();
}

function renderHints() {
  const hints = Array.isArray(currentLesson?.hints)
    ? currentLesson.hints
    : [];

  hintIndex = 0;

  const button = $("hintBtn");
  const box = $("hintBox");

  if (!button || !box) return;

  box.hidden = true;
  box.textContent = "";

  button.disabled = hints.length === 0;
  button.textContent = "أظهر تلميحًا";
}

function showNextHint() {
  const hints = Array.isArray(currentLesson?.hints)
    ? currentLesson.hints
    : [];

  const box = $("hintBox");
  const button = $("hintBtn");

  if (!box || !button || !hints.length) return;

  if (hintIndex >= hints.length) {
    hintIndex = 0;
  }

  box.hidden = false;
  box.textContent =
    `تلميح ${hintIndex + 1} من ${hints.length}: ${hints[hintIndex]}`;

  hintIndex++;

  button.textContent =
    hintIndex >= hints.length
      ? "ابدأ التلميحات من جديد"
      : "أظهر التلميح التالي";
}

function updateLessonPage() {
  const chapter = curriculum.chapters[chapterIdx];
  const lessons = Array.isArray(chapter?.lessons)
    ? chapter.lessons
    : [];

  currentLesson = lessons[lessonIdx];

  if (!currentLesson) {
    showStatus(
      "لم يتم العثور على هذا الدرس. ارجع إلى المنهج واختر درسًا صحيحًا."
    );
    return false;
  }

  setText("languageLabel", `مسار ${config.label}`);
  setText("lessonTitle", currentLesson.title || "درس برمجي");

  setText(
    "lessonDescription",
    currentLesson.objective ||
    currentLesson.description ||
    currentLesson.desc ||
    "تعلّم المفهوم ثم جرّب بنفسك."
  );

  setText(
    "lessonNumber",
    `الفصل ${chapterIdx + 1} · الدرس ${lessonIdx + 1}`
  );

  setText(
    "codyIntro",
    currentLesson.cody_intro ||
    "أهلًا بك! اقرأ الدرس وجرّب الكود بنفسك."
  );

  setText(
    "lessonExplanation",
    currentLesson.description ||
    currentLesson.objective ||
    currentLesson.explanation ||
    "اقرأ المثال ثم جرّبه بنفسك."
  );

  setText(
    "lessonTask",
    currentLesson.task || "جرّب تعديل المثال بنفسك."
  );

  setText("editorLanguage", config.label.toUpperCase());

  const editor = $("codeEditor");
  if (editor) editor.value = getLessonCode(currentLesson);

  showOutput("اكتب الكود واضغط على تشغيل.");

  quizPassed = completedKeys.has(currentLessonKey);

  renderHints();
  renderQuiz();
  updateProgress();
  updateNavigation();

  const levelsUrl = new URL("levels.html", window.location.href);
  levelsUrl.searchParams.set("lang", lang);

  const backButton = $("backBtn");
  const backToLevels = $("backToLevels");

  if (backButton) backButton.href = levelsUrl.href;
  if (backToLevels) backToLevels.href = levelsUrl.href;

  return true;
}

function runJavaScript(code, runId) {
  const frame = document.createElement("iframe");

  frame.setAttribute("sandbox", "allow-scripts");
  frame.title = "JavaScript code runner";
  frame.style.cssText =
    "position:absolute;width:1px;height:1px;border:0;visibility:hidden";

  let finished = false;
  const output = [];

  const cleanup = () => {
    clearTimeout(timeoutId);
    window.removeEventListener("message", onMessage);
    frame.remove();
  };

  const finish = () => {
    if (finished) return;

    finished = true;
    cleanup();

    if (runId !== runCounter) return;

    showOutput(output.join("\n") || "تم تنفيذ الكود دون مخرجات.");
    setRunning(false);
  };

  const onMessage = event => {
    if (event.source !== frame.contentWindow) return;

    const data = event.data;

    if (
      data?.source !== "codequest-runner" ||
      data.runId !== runId ||
      finished
    ) {
      return;
    }

    if (data.type === "log") {
      output.push(data.text);
      showOutput(output.join("\n"));
    }

    if (data.type === "error") {
      output.push(`خطأ: ${data.text}`);
      showOutput(output.join("\n"), true);
    }

    if (data.type === "done") finish();
  };

  const safeCode = JSON.stringify(code).replace(/</g, "\\u003c");

  const source = `<!doctype html>
<meta charset="utf-8">
<script>
(() => {
  const send = (type, text = "") =>
    parent.postMessage({
      source: "codequest-runner",
      runId: ${runId},
      type,
      text: String(text)
    }, "*");

  const format = value => {
    if (typeof value === "string") return value;
    try { return JSON.stringify(value) ?? String(value); }
    catch { return String(value); }
  };

  console.log = (...args) =>
    send("log", args.map(format).join(" "));

  console.info = console.log;
  console.warn = console.log;

  console.error = (...args) =>
    send("error", args.map(format).join(" "));

  window.onerror = message => send("error", message);

  (async () => {
    try {
      await new Function('"use strict";\\\\n' + ${safeCode})();
    } catch (error) {
      send("error", error?.message || String(error));
    }
    send("done");
  })();
})();
<\/script>`;

  const timeoutId = setTimeout(() => {
    if (finished) return;

    finished = true;
    cleanup();

    if (runId === runCounter) {
      showOutput("انتهت مهلة التشغيل. جرّب كودًا أبسط.", true);
      setRunning(false);
    }
  }, 5000);

  window.addEventListener("message", onMessage);
  document.body.appendChild(frame);
  frame.srcdoc = source;
}

async function runPython(code, runId) {
  showOutput("جارٍ تجهيز بيئة Python لأول مرة...");

  try {
    if (!pyodideInstance) {
      const module = await import(
        "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs"
      );

      pyodideInstance = await module.loadPyodide();
    }

    if (runId !== runCounter) return;

    const output = [];

    pyodideInstance.setStdout({
      batched: text => output.push(text)
    });

    pyodideInstance.setStderr({
      batched: text => output.push(text)
    });

    await pyodideInstance.runPythonAsync(code);

    if (runId === runCounter) {
      showOutput(output.join("\n") || "تم تنفيذ الكود دون مخرجات.");
    }
  } catch (error) {
    if (runId === runCounter) {
      showOutput(
        `تعذر تشغيل Python:\n${error?.message || String(error)}`,
        true
      );
    }
  } finally {
    if (runId === runCounter) setRunning(false);
  }
}

async function runCode() {
  if (running) return;

  const editor = $("codeEditor");
  const code = editor?.value || "";

  if (!code.trim()) {
    showOutput("اكتب الكود أولًا، ثم اضغط على تشغيل.", true);
    return;
  }

  const runId = ++runCounter;

  setRunning(true);
  showOutput("جارٍ تشغيل الكود...");

  if (lang === "javascript") {
    runJavaScript(code, runId);
  } else if (lang === "python") {
    await runPython(code, runId);
  } else if (lang === "cpp") {
    showOutput(
      "تشغيل C++ غير متاح حاليًا؛ لا توجد خدمة تنفيذ مجانية مربوطة بهذا الملف.",
      true
    );
    setRunning(false);
  } else {
    showOutput("لغة البرمجة غير مدعومة.", true);
    setRunning(false);
  }
}

function resetCode() {
  if (!currentLesson) return;

  runCounter++;
  setRunning(false);

  const editor = $("codeEditor");
  if (editor) editor.value = getLessonCode(currentLesson);

  showOutput("تمت إعادة الكود إلى المثال الأصلي.");
}

function navigateToNextLesson() {
  if (!quizPassed) return;

  const next = getNextLesson();

  if (!next) {
    window.location.href = "languages.html";
    return;
  }

  const url = new URL("lecture.html", window.location.href);

  url.searchParams.set("lang", lang);
  url.searchParams.set("chapter", String(next.chapter));
  url.searchParams.set("lesson", String(next.lesson));

  window.location.href = url.href;
}

async function initLesson() {
  if (!config) {
    showStatus("لغة البرمجة المحددة غير مدعومة.");
    return;
  }

  try {
    currentUser = await requireUser();

    if (!currentUser) {
      showStatus("يجب تسجيل الدخول إلى حسابك أولًا.");
      return;
    }

    const response = await fetch(config.file, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`تعذر تحميل المنهج (${response.status}).`);
    }

    curriculum = await response.json();

    if (!Array.isArray(curriculum.chapters)) {
      throw new Error("ملف المنهج لا يحتوي على فصول صحيحة.");
    }

    await loadProgress();

    if (!updateLessonPage()) return;

    const status = $("pageStatus");
    if (status) status.hidden = true;

    const content = $("lessonContent");
    if (content) content.hidden = false;
  } catch (error) {
    console.error("Lecture initialization error:", error);

    showStatus(
      `تعذر تحميل الدرس: ${error?.message || String(error)}`
    );
  }
}

function attachEvents() {
  $("hintBtn")?.addEventListener("click", showNextHint);
  $("checkQuizBtn")?.addEventListener("click", checkQuizAnswer);
  $("runCodeBtn")?.addEventListener("click", runCode);
  $("resetCodeBtn")?.addEventListener("click", resetCode);
  $("clearOutputBtn")?.addEventListener("click", () => showOutput(""));
  $("nextLessonBtn")?.addEventListener("click", navigateToNextLesson);
}

document.addEventListener("DOMContentLoaded", () => {
  attachEvents();
  initLesson();
});

window.addEventListener("beforeunload", () => {
  runCounter++;
});