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
    file: "./json/js_curriculum.json",
    ext: ".js",
    mode: "javascript"
  },
  python: {
    file: "./json/python_curriculum.json",
    ext: ".py",
    mode: "python"
  },
  cpp: {
    file: "./json/cpp_curriculum.json",
    ext: ".cpp",
    mode: "text/x-c++src"
  }
};

const config = LANGUAGES[lang];

let currentUser = null;
let currentCurriculum = null;
let currentLesson = null;
let editor = null;
let quizQuestions = [];
let quizIndex = 0;
let selectedOption = null;
let activeQuiz = null;
let completedKeys = new Set();
let pythonWorker = null;
let executionTimer = null;
let executionId = 0;
let running = false;

function showOutput(message) {
  const terminal = $("terminalOutput");
  if (!terminal) return;
  terminal.textContent = String(message ?? "");
  terminal.scrollTop = terminal.scrollHeight;
}

function showError(message) {
  showOutput(`خطأ:\n${String(message || "حدث خطأ غير معروف.")}`);
}

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = String(value ?? "");
}

function setRunning(value) {
  running = value;
  const button = $("runCodeBtn");
  if (!button) return;

  button.disabled = value;
  button.textContent = value ? "جارٍ التشغيل..." : "▶ تشغيل الكود";
}

function lessonKey(chapter, lesson) {
  return `${chapter}:${lesson}`;
}

function getLessonCode(lesson) {
  const code =
    lesson?.starter_code ??
    lesson?.code_example ??
    lesson?.code ??
    "";

  return typeof code === "string" ? code : String(code);
}

function updateLessonProgress() {
  if (!currentCurriculum) return;

  const chapters = Array.isArray(currentCurriculum.chapters)
    ? currentCurriculum.chapters
    : [];

  let total = 0;
  let completed = 0;

  chapters.forEach((chapter, chapterIndex) => {
    const lessons = Array.isArray(chapter.lessons)
      ? chapter.lessons
      : [];

    lessons.forEach((_, lessonIndex) => {
      total++;
      if (completedKeys.has(lessonKey(chapterIndex, lessonIndex))) {
        completed++;
      }
    });
  });

  const percentage = total
    ? Math.round((completed / total) * 100)
    : 0;

  const bar = $("progressBar");
  if (bar) {
    bar.style.width = `${percentage}%`;
    bar.setAttribute("aria-valuenow", String(percentage));
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
  }

  setText("progressText", `${percentage}%`);
}

async function loadProgress() {
  if (!currentUser) {
    throw new Error("يجب تسجيل الدخول لحفظ تقدمك.");
  }

  const records = await getLessonProgress(lang);
  completedKeys = new Set(
    records
      .filter(item => item.completed === true)
      .map(item => lessonKey(item.chapter, item.lesson))
  );

  updateLessonProgress();
}

async function markCurrentLessonCompleted() {
  if (!currentUser) {
    throw new Error("سجّل الدخول أولًا لحفظ تقدمك.");
  }

  await saveLessonProgress({
    language: lang,
    chapter: chapterIdx,
    lesson: lessonIdx,
    completed: true
  });

  completedKeys.add(lessonKey(chapterIdx, lessonIdx));
  updateLessonProgress();

  setText(
    "quizFeedback",
    "إجابة صحيحة! تم حفظ تقدمك في حسابك."
  );
}

function getNextLesson() {
  const chapters = currentCurriculum?.chapters || [];
  const currentChapter = chapters[chapterIdx];
  const lessons = currentChapter?.lessons || [];

  if (lessonIdx + 1 < lessons.length) {
    return { chapter: chapterIdx, lesson: lessonIdx + 1 };
  }

  for (let i = chapterIdx + 1; i < chapters.length; i++) {
    if (Array.isArray(chapters[i].lessons) && chapters[i].lessons.length) {
      return { chapter: i, lesson: 0 };
    }
  }

  return null;
}

function showNextLessonAction() {
  const feedback = $("quizFeedback");
  if (!feedback) return;

  $("nextLessonBtn")?.remove();

  const next = getNextLesson();
  const button = document.createElement("button");

  button.id = "nextLessonBtn";
  button.type = "button";
  button.className = "quiz-action";
  button.textContent = next ? "الدرس التالي ←" : "العودة لمسارات التعلم";

  button.addEventListener("click", () => {
    if (!next) {
      window.location.href = "languages.html";
      return;
    }

    const url = new URL("lecture.html", window.location.href);
    url.searchParams.set("lang", lang);
    url.searchParams.set("chapter", String(next.chapter));
    url.searchParams.set("lesson", String(next.lesson));
    window.location.href = url.href;
  });

  feedback.insertAdjacentElement("afterend", button);
}

function stopPythonWorker() {
  if (executionTimer) {
    clearTimeout(executionTimer);
    executionTimer = null;
  }

  if (pythonWorker) {
    pythonWorker.terminate();
    pythonWorker = null;
  }
}

function resetExecution() {
  executionId++;
  stopPythonWorker();
  setRunning(false);
}

function runJavaScript(code, id) {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts");
  frame.setAttribute("title", "JavaScript code runner");
  frame.style.cssText =
    "position:absolute;width:0;height:0;border:0;visibility:hidden";

  const output = [];
  let finished = false;

  const finish = (message = "") => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    window.removeEventListener("message", listener);
    frame.remove();

    if (id !== executionId) return;
    if (message) output.push(message);
    showOutput(output.join("\n") || "تم تنفيذ الكود دون مخرجات.");
    setRunning(false);
  };

  const listener = (event) => {
    if (event.source !== frame.contentWindow) return;
    if (event.data?.source !== "cody-runner" || event.data.id !== id) return;

    if (event.data.type === "log") output.push(event.data.text);
    if (event.data.type === "error") output.push(`خطأ: ${event.data.text}`);
    showOutput(output.join("\n"));

    if (event.data.type === "done") finish();
  };

  const safeCode = JSON.stringify(code).replace(/</g, "\\u003c");
  const source = `<!doctype html><meta charset="utf-8">
  <script>
  (async () => {
    const send = (type, text = "") => parent.postMessage({
      source: "cody-runner", id: ${id}, type, text: String(text)
    }, "*");

    const format = value => {
      if (typeof value === "string") return value;
      try { return JSON.stringify(value) ?? String(value); }
      catch { return String(value); }
    };

    console.log = (...args) => send("log", args.map(format).join(" "));
    console.warn = (...args) => send("log", args.map(format).join(" "));
    console.error = (...args) => send("error", args.map(format).join(" "));
    window.onerror = message => send("error", message);

    try {
      await new Function('"use strict";\\n' + ${safeCode})();
    } catch (error) {
      send("error", error?.message || String(error));
    }

    send("done");
  })();
  <\/script>`;

  const timer = setTimeout(() => {
    finish("انتهت مهلة التشغيل. جرّب كودًا أبسط.");
  }, 5000);

  window.addEventListener("message", listener);
  document.body.appendChild(frame);
  frame.srcdoc = source;
}

function runPython(code, id) {
  const workerSource = `
    let pyodide;
    self.onmessage = async ({ data }) => {
      const send = (type, text = "") =>
        self.postMessage({ id: data.id, type, text: String(text) });

      try {
        if (!pyodide) {
          importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js");
          pyodide = await loadPyodide();
        }

        const output = [];
        pyodide.setStdout({ batched: text => output.push(text) });
        pyodide.setStderr({ batched: text => output.push(text) });
        await pyodide.runPythonAsync(data.code);
        send("done", output.join("\\n") || "تم تنفيذ الكود دون مخرجات.");
      } catch (error) {
        send("error", error?.message || String(error));
      }
    };
  `;

  try {
    const blob = new Blob([workerSource], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    pythonWorker = new Worker(url);
    URL.revokeObjectURL(url);

    const worker = pythonWorker;

    worker.onmessage = event => {
      if (id !== executionId || worker !== pythonWorker) return;

      if (event.data.type === "error") {
        showError(event.data.text);
      } else {
        showOutput(event.data.text);
      }

      stopPythonWorker();
      setRunning(false);
    };

    worker.onerror = () => {
      if (id !== executionId) return;
      showError("تعذر تشغيل Python. تحقق من اتصال الإنترنت.");
      stopPythonWorker();
      setRunning(false);
    };

    executionTimer = setTimeout(() => {
      if (id !== executionId) return;
      showError("انتهت مهلة تشغيل الكود.");
      stopPythonWorker();
      setRunning(false);
    }, 30000);

    worker.postMessage({ id, code });
  } catch (error) {
    showError(error?.message || "تعذر بدء بيئة Python.");
    stopPythonWorker();
    setRunning(false);
  }
}

window.runUserCode = function () {
  if (!editor || running) return;

  const code = editor.getValue();
  if (!code.trim()) {
    showOutput("اكتب الكود أولًا، ثم اضغط على تشغيل.");
    return;
  }

  resetExecution();
  const id = executionId;
  setRunning(true);
  showOutput("جارٍ تجهيز بيئة التشغيل...");

  if (lang === "javascript") {
    runJavaScript(code, id);
  } else if (lang === "python") {
    runPython(code, id);
  } else {
    showOutput("تشغيل C++ غير متاح حاليًا؛ خدمة التنفيذ غير مربوطة.");
    setRunning(false);
  }
};

window.resetCode = function () {
  if (!editor || !currentLesson) return;
  resetExecution();
  editor.setValue(getLessonCode(currentLesson));
  showOutput("تمت إعادة الكود إلى المثال الأصلي.");
};

window.showQuiz = function () {
  const modal = $("quizModal");
  if (modal) modal.style.display = "flex";
};

function renderQuiz(quiz) {
  quizQuestions = Array.isArray(quiz)
    ? quiz.filter(item =>
        item &&
        typeof item.question === "string" &&
        Array.isArray(item.options) &&
        Number.isInteger(item.correct_index)
      )
    : quiz &&
      typeof quiz.question === "string" &&
      Array.isArray(quiz.options) &&
      Number.isInteger(quiz.correct_index)
      ? [quiz]
      : [];

  quizIndex = 0;
  selectedOption = null;
  activeQuiz = null;

  $("nextLessonBtn")?.remove();

  const feedback = $("quizFeedback");
  if (feedback) feedback.textContent = "";

  if (!quizQuestions.length) {
    setText("quizQuestion", "لا يوجد اختبار صالح لهذا الدرس حاليًا.");
    $("quizOptions")?.replaceChildren();
    return;
  }

  displayQuizQuestion();
}

function displayQuizQuestion() {
  const options = $("quizOptions");
  const submit = $("submitQuizBtn");
  if (!options) return;

  activeQuiz = quizQuestions[quizIndex];
  selectedOption = null;
  options.replaceChildren();

  setText("quizQuestion", activeQuiz.question);

  if (submit) {
    submit.style.display = "none";
    submit.textContent = "تحقّق من الإجابة";
    submit.onclick = null;
  }

  activeQuiz.options.forEach((value, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option";
    button.textContent = String(value);

    button.addEventListener("click", () => {
      selectedOption = index;

      options.querySelectorAll(".quiz-option").forEach(item => {
        item.classList.toggle("selected", item === button);
      });

      if (submit) submit.style.display = "block";
      setText("quizFeedback", "");
    });

    options.appendChild(button);
  });
}

window.submitQuiz = async function () {
  const feedback = $("quizFeedback");
  const options = $("quizOptions");
  const submit = $("submitQuizBtn");

  if (!feedback || !options || !activeQuiz || selectedOption === null) return;

  if (selectedOption !== Number(activeQuiz.correct_index)) {
    feedback.textContent =
      activeQuiz.fail_msg || "الإجابة غير صحيحة. حاول مرة أخرى.";
    feedback.dataset.result = "incorrect";
    return;
  }

  options.querySelectorAll(".quiz-option").forEach(button => {
    button.disabled = true;
  });

  if (quizIndex + 1 < quizQuestions.length) {
    feedback.textContent =
      activeQuiz.success_msg || activeQuiz.explanation || "إجابة صحيحة!";
    feedback.dataset.result = "correct";

    if (submit) {
      submit.textContent = "السؤال التالي ←";
      submit.style.display = "block";
      submit.onclick = () => {
        quizIndex++;
        displayQuizQuestion();
      };
    }

    return;
  }

  try {
    await markCurrentLessonCompleted();
    feedback.dataset.result = "correct";
    if (submit) submit.style.display = "none";
    showNextLessonAction();
  } catch (error) {
    feedback.textContent =
      `نجحت في الاختبار، لكن تعذر حفظ التقدم: ${error.message}`;
    feedback.dataset.result = "error";
  }
};

async function initLesson() {
  if (!config) {
    showError("لغة البرمجة المحددة غير مدعومة.");
    return;
  }

  const response = await fetch(config.file, { cache: "no-cache" });
  if (!response.ok) throw new Error("تعذر تحميل ملف المنهج.");

  const data = await response.json();
  if (!Array.isArray(data.chapters)) {
    throw new Error("ملف المنهج لا يحتوي على فصول صحيحة.");
  }

  currentCurriculum = data;
  currentLesson = data.chapters[chapterIdx]?.lessons?.[lessonIdx];

  if (!currentLesson) {
    throw new Error("الدرس المطلوب غير موجود.");
  }

  setText("lessonTitle", currentLesson.title);
  setText(
    "codyIntro",
    currentLesson.cody_intro || "أهلًا بك! اقرأ الدرس وجرّب الكود بنفسك."
  );
  setText(
    "lessonDescription",
    currentLesson.description ||
      currentLesson.objective ||
      currentLesson.desc ||
      currentLesson.cody_intro ||
      "اقرأ الشرح، ثم جرّب المثال بنفسك."
  );
  setText("lessonTask", currentLesson.task || "جرّب تعديل المثال بنفسك.");
  setText("fileNameDisplay", "main" + config.ext);

  const hints = $("lessonHints");
  if (hints) {
    hints.replaceChildren();
    (Array.isArray(currentLesson.hints) ? currentLesson.hints : [])
      .forEach(value => {
        const item = document.createElement("li");
        item.textContent = String(value);
        hints.appendChild(item);
      });
  }

  if (!window.CodeMirror || !$("codeEditor")) {
    throw new Error("تعذر تحميل محرر الأكواد.");
  }

  editor = CodeMirror.fromTextArea($("codeEditor"), {
    mode: config.mode,
    theme: "dracula",
    lineNumbers: true,
    autoCloseBrackets: true,
    indentUnit: 4,
    tabSize: 4,
    lineWrapping: false
  });

  editor.setValue(getLessonCode(currentLesson));

  await loadProgress();
  renderQuiz(currentLesson.quiz || null);

  showOutput(
    lang === "cpp"
      ? "تم تحميل الدرس. تشغيل C++ يحتاج إلى ربط خدمة تنفيذ."
      : "تم تحميل الدرس. يمكنك تجربة الكود في المحرر."
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    currentUser = await requireUser();

    $("runCodeBtn")?.addEventListener("click", window.runUserCode);
    $("resetCodeBtn")?.addEventListener("click", window.resetCode);
    $("showQuizBtn")?.addEventListener("click", window.showQuiz);
    $("submitQuizBtn")?.addEventListener("click", window.submitQuiz);

    $("closeQuizBtn")?.addEventListener("click", () => {
      const modal = $("quizModal");
      if (modal) modal.style.display = "none";
    });

    $("quizModal")?.addEventListener("click", event => {
      if (event.target === $("quizModal")) {
        $("quizModal").style.display = "none";
      }
    });

    await initLesson();
  } catch (error) {
    console.error("Lecture initialization error:", error);
    showError(error?.message || "حدث خطأ أثناء تحميل الدرس.");
  }
});

window.addEventListener("beforeunload", resetExecution);