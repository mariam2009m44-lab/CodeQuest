import { requireUser, saveLessonProgress, getLessonProgress } from "./auth.js";

const LANGUAGE_CONFIG = {
  javascript: {
    label: "JavaScript",
    curriculumUrl: "./json/js_curriculum.json",
    editorLanguage: "javascript",
    starter: "console.log('مرحبًا بك في Cody Academy');"
  },
  python: {
    label: "Python",
    curriculumUrl: "./json/python_curriculum.json",
    editorLanguage: "python",
    starter: 'print("مرحبًا بك في Cody Academy")'
  },
  cpp: {
    label: "C++",
    curriculumUrl: "./json/cpp_curriculum.json",
    editorLanguage: "cpp",
    starter: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, Cody Academy!" << endl;
    return 0;
}`
  }
};

const params = new URLSearchParams(window.location.search);
const languageKey = (params.get("lang") || "javascript").toLowerCase();

function parseIndex(value) {
  if (value === null || value.trim() === "") return 0;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : -1;
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
let pyodideInstance = null;
let editor = null;

function byId(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = value ?? "";
}

function setStatus(message, type = "info") {
  const status = byId("pageStatus");
  if (!status) return;

  status.textContent = message;
  status.dataset.type = type;
  status.hidden = !message;
}

function setBusy(isBusy) {
  const runButton = byId("runCodeBtn");
  const nextButton = byId("nextLessonBtn");

  if (runButton) runButton.disabled = isBusy;
  if (nextButton) nextButton.disabled = isBusy;
}

function getCodeEditorValue() {
  if (editor && typeof editor.getValue === "function") {
    return editor.getValue();
  }

  return byId("codeEditor")?.value || "";
}

function setCodeEditorValue(value) {
  if (editor && typeof editor.setValue === "function") {
    editor.setValue(value);
    return;
  }

  const textarea = byId("codeEditor");
  if (textarea) textarea.value = value;
}

function initializeEditor() {
  const textarea = byId("codeEditor");
  if (!textarea) return;

  if (
    window.CodeMirror &&
    typeof window.CodeMirror.fromTextArea === "function"
  ) {
    try {
      editor = window.CodeMirror.fromTextArea(textarea, {
        lineNumbers: true,
        mode: LANGUAGE_CONFIG[languageKey].editorLanguage,
        theme: "dracula",
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        autofocus: false
      });

      editor.setSize("100%", "auto");
    } catch (error) {
      console.warn("تعذر تشغيل CodeMirror:", error);
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

  let correctIndex = Number.isInteger(rawQuiz.correct_index)
    ? rawQuiz.correct_index
    : Number.isInteger(rawQuiz.correctIndex)
      ? rawQuiz.correctIndex
      : Number.isInteger(rawQuiz.answer_index)
        ? rawQuiz.answer_index
        : -1;

  if (
    correctIndex < 0 &&
    rawQuiz.correct_answer !== undefined
  ) {
    correctIndex = options.findIndex((option) => {
      if (typeof option === "object" && option !== null) {
        return (
          option.text === rawQuiz.correct_answer ||
          option.value === rawQuiz.correct_answer
        );
      }

      return option === rawQuiz.correct_answer;
    });
  }

  return {
    question,
    options,
    correctIndex,
    explanation: rawQuiz.explanation || rawQuiz.feedback || ""
  };
}

function normalizeOption(option) {
  if (typeof option === "object" && option !== null) {
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
    (total, chapter) => total + getLessons(chapter).length,
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

function renderProgress(progressData) {
  const total = Math.max(getTotalLessons(), 1);
  const completed = new Set();

  if (Array.isArray(progressData)) {
    progressData.forEach((item) => {
      if (
        item &&
        (item.completed === true || item.status === "completed")
      ) {
        completed.add(`${item.chapter}:${item.lesson}`);
      }
    });
  } else if (progressData && typeof progressData === "object") {
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

  if (bar) bar.style.width = `${percent}%`;

  if (track) {
    track.setAttribute("aria-valuenow", String(percent));
  }

  setText("progressText", `${percent}%`);
}

function renderLessonContent(lesson) {
  setText("lessonNumber", `الدرس ${lessonIndex + 1}`);

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
    lesson.objective || lesson.description || ""
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

  setText("languageLabel", LANGUAGE_CONFIG[languageKey].label);
  updateEditorLanguage();

  const hints = Array.isArray(lesson.hints)
    ? lesson.hints
    : lesson.hint
      ? [lesson.hint]
      : [];

  const hintButton = byId("hintBtn");
  const hintBox = byId("hintBox");

  if (hintButton) hintButton.hidden = hints.length === 0;

  if (hintBox) {
    hintBox.textContent = hints.join("\n\n");
    hintBox.hidden = true;
  }

  const quiz = normalizeQuiz(lesson.quiz || lesson.question);
  const questionElement = byId("quizQuestion");
  const optionsElement = byId("quizOptions");
  const checkButton = byId("checkQuizBtn");
  const feedback = byId("quizFeedback");

  selectedQuizOption = null;
  quizPassed = lessonCompleted;

  if (questionElement) {
    questionElement.textContent =
      quiz?.question || "لا يوجد سؤال لهذا الدرس حاليًا.";
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

          if (checkButton) {
            checkButton.disabled = false;
          }

          if (feedback) {
            feedback.textContent = "";
          }
        });

        label.append(input, span);
        optionsElement.append(label);
      });
    } else {
      const message = document.createElement("p");
      message.textContent = "لم يُضف سؤال لهذا الدرس بعد.";
      optionsElement.append(message);
    }
  }

  if (checkButton) {
    checkButton.disabled =
      quizPassed || !quiz || quiz.options.length === 0;
  }

  if (feedback) {
    feedback.textContent = lessonCompleted
      ? "تم إكمال هذا الدرس سابقًا."
      : "";

    feedback.dataset.type = lessonCompleted ? "success" : "";
  }

  setCodeEditorValue(getLessonCode(lesson));

  const nextButton = byId("nextLessonBtn");

  if (nextButton) {
    nextButton.textContent = getNextLessonUrl()
      ? "الدرس التالي ←"
      : "العودة للمستويات";

    nextButton.disabled = false;
  }

  const content = byId("lessonContent");
  if (content) content.hidden = false;
}

async function loadCurriculum() {
  const config = LANGUAGE_CONFIG[languageKey];

  if (!config) {
    throw new Error("لغة البرمجة المطلوبة غير معروفة.");
  }

  const response = await fetch(config.curriculumUrl, {
    cache: "no-store"
  });

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
}

async function loadProgress() {
  try {
    const progress = await getLessonProgress(languageKey);
    renderProgress(progress);
  } catch (error) {
    console.warn("تعذر تحميل تقدم الدروس:", error);
    renderProgress([]);
  }
}

async function loadCurrentCompletion() {
  lessonCompleted = false;

  try {
    const progress = await getLessonProgress(languageKey);

    if (Array.isArray(progress)) {
      lessonCompleted = progress.some((item) =>
        item &&
        Number(item.chapter) === chapterIndex &&
        Number(item.lesson) === lessonIndex &&
        (
          item.completed === true ||
          item.status === "completed"
        )
      );

      return;
    }

    if (progress && typeof progress === "object") {
      const keys = [
        `${chapterIndex}:${lessonIndex}`,
        `${languageKey}:${chapterIndex}:${lessonIndex}`,
        `${chapterIndex}_${lessonIndex}`
      ];

      lessonCompleted = keys.some((key) => {
        const value = progress[key];

        return (
          value === true ||
          value?.completed === true ||
          value?.status === "completed"
        );
      });
    }
  } catch (error) {
    console.warn("تعذر قراءة حالة إكمال الدرس:", error);
  }
}

async function completeCurrentLesson() {
  if (lessonCompleted) {
    quizPassed = true;
    return true;
  }

  try {
    await saveLessonProgress({
      language: languageKey,
      chapter: chapterIndex,
      lesson: lessonIndex,
      completed: true
    });

    lessonCompleted = true;
    quizPassed = true;

    setStatus("ممتاز! تم حفظ تقدم الدرس.", "success");

    const feedback = byId("quizFeedback");

    if (feedback) {
      feedback.textContent = "إجابة صحيحة! تم تسجيل إكمال الدرس.";
      feedback.dataset.type = "success";
    }

    const options = byId("quizOptions");

    if (options) {
      options
        .querySelectorAll('input[type="radio"]')
        .forEach((input) => {
          input.disabled = true;
        });
    }

    const checkButton = byId("checkQuizBtn");
    if (checkButton) checkButton.disabled = true;

    await loadProgress();
    return true;
  } catch (error) {
    console.error("تعذر حفظ تقدم الدرس:", error);

    setStatus(
      "إجابتك صحيحة، لكن تعذر حفظ التقدم. تحقق من الاتصال وحاول مجددًا.",
      "error"
    );

    return false;
  }
}

async function checkQuizAnswer() {
  if (selectedQuizOption === null || !currentLesson) {
    return;
  }

  const quiz = normalizeQuiz(
    currentLesson.quiz || currentLesson.question
  );

  if (
    !quiz ||
    quiz.correctIndex < 0 ||
    quiz.correctIndex >= quiz.options.length
  ) {
    setStatus(
      "بيانات الإجابة الصحيحة غير مكتملة في ملف المنهج.",
      "error"
    );
    return;
  }

  const feedback = byId("quizFeedback");

  if (selectedQuizOption !== quiz.correctIndex) {
    if (feedback) {
      feedback.textContent = quiz.explanation
        ? `الإجابة غير صحيحة. حاول مرة أخرى. تلميح: ${quiz.explanation}`
        : "الإجابة غير صحيحة. حاول مرة أخرى.";

      feedback.dataset.type = "error";
    }

    return;
  }

  await completeCurrentLesson();
}

function showHint() {
  const hintBox = byId("hintBox");
  if (hintBox) hintBox.hidden = !hintBox.hidden;
}

function appendOutput(text, type = "normal") {
  const output = byId("terminalOutput");
  if (!output) return;

  const line = document.createElement("div");
  line.className = `terminal-line terminal-${type}`;
  line.textContent = String(text ?? "");

  output.append(line);
  output.scrollTop = output.scrollHeight;
}

function clearOutput() {
  const output = byId("terminalOutput");
  if (output) output.replaceChildren();
}

function runJavaScript(code) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");

    frame.setAttribute("sandbox", "allow-scripts");
    frame.title = "JavaScript code execution sandbox";
    frame.style.display = "none";

    let finished = false;
    let timeoutId = null;
    const output = [];

    function finish(error = null) {
      if (finished) return;
      finished = true;

      window.removeEventListener("message", onMessage);

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      frame.remove();

      if (error) reject(error);
      else resolve(output.join("\n"));
    }

    function onMessage(event) {
      if (
        event.source !== frame.contentWindow ||
        !event.data ||
        event.data.source !== "codequest-js-runner"
      ) {
        return;
      }

      if (event.data.type === "output") {
        output.push(String(event.data.value));
      }

      if (event.data.type === "done") {
        finish();
      }

      if (event.data.type === "error") {
        finish(
          new Error(
            event.data.value || "حدث خطأ أثناء تشغيل JavaScript."
          )
        );
      }
    }

    window.addEventListener("message", onMessage);

    timeoutId = window.setTimeout(() => {
      finish(
        new Error(
          "انتهى وقت التشغيل. تأكد من عدم وجود حلقة لا نهائية."
        )
      );
    }, 5000);

    const safeCode = JSON.stringify(code);

    frame.srcdoc = `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
(() => {
  const send = (type, value = "") => {
    parent.postMessage({
      source: "codequest-js-runner",
      type,
      value: String(value)
    }, "*");
  };

  const format = (value) => {
    if (typeof value === "string") return value;
    if (typeof value === "undefined") return "undefined";

    try {
      const result = JSON.stringify(value);
      return result === undefined ? String(value) : result;
    } catch {
      return String(value);
    }
  };

  console.log = (...args) => {
    send("output", args.map(format).join(" "));
  };

  console.error = (...args) => {
    send("output", "خطأ: " + args.map(format).join(" "));
  };

  window.onerror = (message) => {
    send("error", message);
  };

  try {
    const userCode = ${safeCode};
    (new Function('"use strict";\\n' + userCode))();
    send("done");
  } catch (error) {
    send(
      "error",
      error && error.message ? error.message : error
    );
  }
})();
<\/script>
</body>
</html>`;

    document.body.append(frame);
  });
}

async function loadPyodide() {
  if (pyodideInstance) return pyodideInstance;

  setStatus("جاري تجهيز بيئة Python لأول مرة...", "info");

  await new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-pyodide-loader="true"]'
    );

    if (existing) {
      if (window.loadPyodide) {
        resolve();
      } else {
        existing.addEventListener("load", resolve, { once: true });

        existing.addEventListener(
          "error",
          () => reject(new Error("تعذر تحميل بيئة Python.")),
          { once: true }
        );
      }

      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";

    script.dataset.pyodideLoader = "true";
    script.onload = resolve;

    script.onerror = () => {
      reject(
        new Error("تعذر تحميل بيئة Python. تحقق من اتصال الإنترنت.")
      );
    };

    document.head.append(script);
  });

  if (typeof window.loadPyodide !== "function") {
    throw new Error("لم يتم تحميل مشغل Python بشكل صحيح.");
  }

  pyodideInstance = await window.loadPyodide();

  return pyodideInstance;
}

async function runPython(code) {
  const pyodide = await loadPyodide();
  const output = [];

  pyodide.setStdout({
    batched: (text) => output.push(text)
  });

  pyodide.setStderr({
    batched: (text) => output.push(`خطأ: ${text}`)
  });

  try {
    await pyodide.runPythonAsync(code);

    return output.join("\n") || "تم تشغيل الكود بدون مخرجات.";
  } catch (error) {
    throw new Error(error?.message || String(error));
  }
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
  const endpoint = "https://ce.judge0.com";

  setStatus("جاري إرسال كود C++ إلى خدمة التشغيل...", "info");

  const submitResponse = await fetch(
    `${endpoint}/submissions?base64_encoded=true&wait=false`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        language_id: 54,
        source_code: encodeBase64Utf8(code),
        stdin: ""
      })
    }
  );

  if (!submitResponse.ok) {
        throw new Error(
      `خدمة تشغيل C++ غير متاحة حاليًا (HTTP ${submitResponse.status}).`
    );
  }

  const submission = await submitResponse.json();

  if (!submission.token) {
    throw new Error("لم تُرجع خدمة التشغيل رمز التنفيذ.");
  }

  for (let attempt = 0; attempt < 15; attempt++) {
    await wait(1000);

    const response = await fetch(
      `${endpoint}/submissions/${encodeURIComponent(submission.token)}?base64_encoded=true`,
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `تعذر جلب نتيجة C++ (HTTP ${response.status}).`
      );
    }

    const result = await response.json();
    const statusId = result.status?.id;

    if (statusId === 1 || statusId === 2) {
      continue;
    }

    const stdout = decodeBase64Utf8(result.stdout);
    const stderr = decodeBase64Utf8(result.stderr);
    const compileOutput = decodeBase64Utf8(result.compile_output);
    const message = decodeBase64Utf8(result.message);

    if (statusId === 3) {
      return stdout || "تم تشغيل الكود بدون مخرجات.";
    }

    if (compileOutput) throw new Error(compileOutput);
    if (stderr) throw new Error(stderr);
    if (message) throw new Error(message);

    if (statusId === 5) {
      throw new Error("انتهى الوقت المسموح لتشغيل البرنامج.");
    }

    if (statusId === 6) {
      throw new Error("حدث خطأ أثناء تجميع كود C++.");
    }

    throw new Error(
      result.status?.description || "تعذر تشغيل كود C++."
    );
  }

  throw new Error(
    "استغرق تشغيل C++ وقتًا أطول من المتوقع. حاول مرة أخرى."
  );
}

async function runCode() {
  const code = getCodeEditorValue();

  if (!code.trim()) {
    appendOutput("اكتب الكود أولًا ثم اضغط تشغيل.", "error");
    return;
  }

  clearOutput();
  setBusy(true);
  setStatus("جاري تشغيل الكود...", "info");

  try {
    let result;

    if (languageKey === "javascript") {
      result = await runJavaScript(code);
    } else if (languageKey === "python") {
      result = await runPython(code);
    } else if (languageKey === "cpp") {
      result = await runCpp(code);
    } else {
      throw new Error("لغة البرمجة غير مدعومة.");
    }

    appendOutput(result, "success");
    setStatus("تم تشغيل الكود.", "success");
  } catch (error) {
    appendOutput(error?.message || String(error), "error");

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

  setCodeEditorValue(getLessonCode(currentLesson));
  clearOutput();
  setStatus("تمت استعادة كود الدرس.", "success");
}

function navigateNextLesson() {
  const nextUrl = getNextLessonUrl();

  if (nextUrl) {
    window.location.href = nextUrl;
  } else {
    window.location.href = getLevelsUrl();
  }
}

function attachEvents() {
  byId("hintBtn")?.addEventListener("click", showHint);

  byId("checkQuizBtn")?.addEventListener(
    "click",
    checkQuizAnswer
  );

  byId("runCodeBtn")?.addEventListener("click", runCode);

  byId("resetCodeBtn")?.addEventListener("click", resetCode);

  byId("clearOutputBtn")?.addEventListener("click", clearOutput);

  byId("nextLessonBtn")?.addEventListener(
    "click",
    navigateNextLesson
  );

  byId("backBtn")?.addEventListener("click", () => {
    window.location.href = getLevelsUrl();
  });

  byId("backToLevels")?.addEventListener("click", () => {
    window.location.href = getLevelsUrl();
  });
}

async function initializeLecture() {
  setStatus("جاري تحميل الدرس...", "info");

  try {
    currentUser = await requireUser();

    if (!currentUser) return;

    await loadCurriculum();
    initializeEditor();
    await loadCurrentCompletion();

    renderLessonContent(currentLesson);
    await loadProgress();

    setStatus("", "info");
  } catch (error) {
    console.error("فشل تحميل الدرس:", error);

    setStatus(
      error?.message || "تعذر تحميل الدرس. حاول تحديث الصفحة.",
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