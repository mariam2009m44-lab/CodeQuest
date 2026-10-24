import { requireUser } from "./auth.js";

const params = new URLSearchParams(window.location.search);
const lang = (params.get("lang") || "javascript").toLowerCase();

function parseIndex(value) {
  if (value === null || !/^\d+$/.test(value)) return 0;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : 0;
}

const chapterIdx = parseIndex(params.get("chapter"));
const lessonIdx = parseIndex(params.get("lesson"));

const LANGUAGES = Object.freeze({
  javascript: {
    file: "./json/js_curriculum.json",
    ext: ".js",
    mode: "javascript",
    label: "JavaScript"
  },
  python: {
    file: "./json/python_curriculum.json",
    ext: ".py",
    mode: "python",
    label: "Python"
  },
  cpp: {
    file: "./json/cpp_curriculum.json",
    ext: ".cpp",
    mode: "text/x-c++src",
    label: "C++"
  }
});

const config = LANGUAGES[lang];
const $ = (id) => document.getElementById(id);
const editorElement = $("codeEditor");

let editor = null;
let currentLesson = null;
let currentCurriculum = null;
let selectedOptionIdx = null;
let pythonWorker = null;
let pythonTimeout = null;
let executionId = 0;
let running = false;

function showOutput(message) {
  const terminal = $("terminalOutput");

  if (terminal) {
    terminal.textContent = String(message ?? "");
    terminal.scrollTop = terminal.scrollHeight;
  }
}

function showError(message) {
  showOutput(`خطأ:\n${String(message || "حدث خطأ غير معروف.")}`);
}

function displayLessonText(id, value) {
  const element = $(id);
  if (element) element.textContent = String(value ?? "");
}

function setRunning(value) {
  running = value;
  const button = $("runCodeBtn");

  if (button) {
    button.disabled = value;
    button.textContent = value ? "جارٍ التشغيل..." : "▶ تشغيل الكود";
  }
}

function getLessonCode(lesson) {
  const code = lesson?.code_example ?? lesson?.code ?? "";
  return typeof code === "string" ? code : String(code);
}

function getLessonDescription(lesson) {
  return (
    lesson?.objective ||
    lesson?.description ||
    lesson?.desc ||
    lesson?.cody_intro ||
    "ابدأ بقراءة الشرح، ثم جرّب المثال بنفسك."
  );
}

function getCompletedLessons() {
  try {
    const raw = localStorage.getItem(`cq_completed_lessons_${lang}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function getLessonKey() {
  return `${chapterIdx}:${lessonIdx}`;
}

function markCurrentLessonCompleted() {
  try {
    const completed = getCompletedLessons();
    completed.add(getLessonKey());

    localStorage.setItem(
      `cq_completed_lessons_${lang}`,
      JSON.stringify([...completed])
    );

    updateLessonProgress();
  } catch {
    displayLessonText(
      "quizFeedback",
      "الإجابة صحيحة، لكن تعذر حفظ التقدم على هذا الجهاز."
    );
  }
}

function updateLessonProgress() {
  if (!currentCurriculum) return;

  const chapters = currentCurriculum.chapters || [];
  const validKeys = new Set();
  let total = 0;

  chapters.forEach((chapter, chapterIndex) => {
    const lessons = Array.isArray(chapter.lessons) ? chapter.lessons : [];

    lessons.forEach((_, lessonIndex) => {
      validKeys.add(`${chapterIndex}:${lessonIndex}`);
      total += 1;
    });
  });

  const completed = getCompletedLessons();
  const done = [...completed].filter((key) => validKeys.has(key)).length;
  const percentage = total ? Math.round((done / total) * 100) : 0;
  const progressBar = $("progressBar");

  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute("aria-valuenow", String(percentage));
  }

  displayLessonText("progressText", `${percentage}%`);
}

function getNextLessonDestination() {
  if (!currentCurriculum || !Array.isArray(currentCurriculum.chapters)) {
    return null;
  }

  const chapters = currentCurriculum.chapters;
  const currentChapter = chapters[chapterIdx];
  const currentLessons = Array.isArray(currentChapter?.lessons)
    ? currentChapter.lessons
    : [];

  if (lessonIdx + 1 < currentLessons.length) {
    return {
      chapter: chapterIdx,
      lesson: lessonIdx + 1
    };
  }

  for (let index = chapterIdx + 1; index < chapters.length; index += 1) {
        const lessons = Array.isArray(chapters[index].lessons)
      ? chapters[index].lessons
      : [];

    if (lessons.length > 0) {
      return {
        chapter: index,
        lesson: 0
      };
    }
  }

  return null;
}

function showNextLessonAction() {
  const feedback = $("quizFeedback");
  if (!feedback) return;

  $("nextLessonBtn")?.remove();
  $("quizCompletionMessage")?.remove();

  const destination = getNextLessonDestination();
  const button = document.createElement("button");

  button.id = "nextLessonBtn";
  button.type = "button";
  button.className = "quiz-action";

  button.style.cssText = [
    "display:block",
    "width:100%",
    "margin-top:14px",
    "background:linear-gradient(135deg,#7955E8,#36BFE5)",
    "color:#fff",
    "border:0",
    "border-radius:12px",
    "padding:12px 16px",
    "font:inherit",
    "font-weight:700",
    "cursor:pointer"
  ].join(";");

  if (destination) {
    button.textContent = "الدرس التالي ←";

    button.addEventListener("click", () => {
      const url = new URL("lecture.html", window.location.href);

      url.searchParams.set("lang", lang);
      url.searchParams.set("chapter", String(destination.chapter));
      url.searchParams.set("lesson", String(destination.lesson));

      window.location.href = url.href;
    });
  } else {
    button.textContent = "إنهاء المسار والعودة ←";

    button.addEventListener("click", () => {
      window.location.href = "languages.html";
    });

    const message = document.createElement("p");

    message.id = "quizCompletionMessage";
    message.textContent = "أحسنت! لقد أنهيت جميع دروس هذا المسار.";
    message.style.cssText =
      "margin-top:14px;line-height:1.8;color:#36BFE5";

    feedback.insertAdjacentElement("afterend", message);
  }

  feedback.insertAdjacentElement("afterend", button);
}

function stopPythonWorker() {
  if (pythonTimeout !== null) {
    clearTimeout(pythonTimeout);
    pythonTimeout = null;
  }

  if (pythonWorker) {
    pythonWorker.onmessage = null;
    pythonWorker.onerror = null;
    pythonWorker.terminate();
    pythonWorker = null;
  }
}

function resetExecution() {
  executionId += 1;
  stopPythonWorker();
  setRunning(false);
}

function finishExecution(id) {
  if (id !== executionId) return;

  stopPythonWorker();
  setRunning(false);
}

function createPythonWorker() {
  const workerSource = `
    let pyodide = null;

    self.onmessage = async (event) => {
      const { id, code } = event.data;

      const send = (type, text) => {
        self.postMessage({
          id,
          type,
          text: String(text ?? "")
        });
      };

      try {
        if (!pyodide) {
          send("status", "جارٍ تحميل بيئة Python لأول مرة...");

          importScripts(
            "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js"
          );

          pyodide = await loadPyodide();
        }

        const output = [];

        pyodide.setStdout({
          batched(text) {
            output.push(text);
          }
        });

        pyodide.setStderr({
          batched(text) {
            output.push(text);
          }
        });

        await pyodide.runPythonAsync(code);

        send(
          "result",
          output.join("\\n") || "تم تنفيذ الكود دون مخرجات."
        );
      } catch (error) {
        send("error", error?.message || String(error));
      }
    };
  `;

  const blob = new Blob([workerSource], {
    type: "text/javascript"
  });

  const workerUrl = URL.createObjectURL(blob);

  try {
    return new Worker(workerUrl);
  } finally {
    URL.revokeObjectURL(workerUrl);
  }
}

function runPython(code, id) {
  try {
    pythonWorker = createPythonWorker();
  } catch {
    showError(
      "تعذر إنشاء بيئة Python. شغّل المنصة عبر خادم محلي أو HTTPS."
    );

    finishExecution(id);
    return;
  }

  const worker = pythonWorker;

  worker.onmessage = (event) => {
    if (id !== executionId || worker !== pythonWorker) return;

    const data = event.data;

    if (data.type === "status") {
      showOutput(data.text);
      return;
    }

    if (data.type === "error") {
      showError(data.text);
    } else {
      showOutput(data.text);
    }

    finishExecution(id);
  };

  worker.onerror = () => {
    if (id !== executionId || worker !== pythonWorker) return;

    showError("تعذر تشغيل Python. تحقّق من اتصال الإنترنت.");
    finishExecution(id);
  };

  pythonTimeout = setTimeout(() => {
    if (id !== executionId || worker !== pythonWorker) return;

    showError("انتهت مهلة التشغيل.");
    finishExecution(id);
  }, 30000);

  worker.postMessage({ id, code });
}

function runJavaScript(code, id) {
  const frame = document.createElement("iframe");

  frame.setAttribute("sandbox", "allow-scripts");
  frame.setAttribute("title", "JavaScript code runner");
  frame.setAttribute("aria-hidden", "true");

  frame.style.cssText =
    "position:absolute;width:0;height:0;border:0;visibility:hidden;";

  const outputs = [];

  let finished = false;
  let timeout = null;

  const finish = (message = "") => {
    if (finished) return;

    finished = true;

    if (timeout !== null) clearTimeout(timeout);

    window.removeEventListener("message", listener);
    frame.remove();

    if (id !== executionId) return;

    if (message) outputs.push(message);

    showOutput(
      outputs.join("\n") || "تم تنفيذ الكود دون مخرجات."
    );

    setRunning(false);
  };

  const safeCode = JSON.stringify(code).replace(/</g, "\\u003c");
  const safeId = JSON.stringify(id);

  const source = `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
</head>
<body>
<script>
(async () => {
  const send = (type, text = "") => {
    parent.postMessage({
      source: "cody-js-runner",
      id: ${safeId},
      type,
      text: String(text)
    }, "*");
  };

  const format = (value) => {
    if (typeof value === "string") return value;

    try {
      const result = JSON.stringify(value);
      return result === undefined ? String(value) : result;
    } catch {
      return String(value);
    }
  };

  console.log = (...args) =>
    send("log", args.map(format).join(" "));

  console.warn = (...args) =>
    send("log", args.map(format).join(" "));

  console.error = (...args) =>
    send("error", args.map(format).join(" "));

  window.onerror = (message) => {
    send("error", message);
  };

  window.onunhandledrejection = (event) => {
    send("error", event.reason?.message || event.reason);
  };

  try {
    const code = ${safeCode};
    await new Function('"use strict";\\n' + code)();
  } catch (error) {
    send("error", error?.stack || error?.message || String(error));
  }

  send("done");
})();
<\/script>
</body>
</html>`;

  function listener(event) {
    if (event.source !== frame.contentWindow) return;
    if (event.data?.source !== "cody-js-runner") return;
    if (event.data?.id !== id || finished) return;

    if (event.data.type === "log") {
      outputs.push(event.data.text);
      showOutput(outputs.join("\n"));
      return;
    }

    if (event.data.type === "error") {
      outputs.push("Error: " + event.data.text);
      showOutput(outputs.join("\n"));
      return;
    }

    if (event.data.type === "done") finish();
  }

  timeout = setTimeout(() => {
    finish("انتهت مهلة التشغيل. جرّب كودًا أبسط.");
  }, 5000);

  window.addEventListener("message", listener);

  document.body.appendChild(frame);
  frame.srcdoc = source;
}

function runCpp() {
  showOutput(
    "تشغيل C++ غير متاح حاليًا.\n\nلم يتم ربط خدمة تنفيذ لهذه اللغة بعد."
  );

  setRunning(false);
}

window.runUserCode = async function runUserCode() {
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

  try {
    if (lang === "javascript") {
      runJavaScript(code, id);
    } else if (lang === "python") {
      runPython(code, id);
    } else if (lang === "cpp") {
      runCpp();
    } else {
      showError("لغة البرمجة المحددة غير مدعومة.");
      finishExecution(id);
    }
  } catch (error) {
    showError(error?.message || "حدث خطأ أثناء التشغيل.");
    finishExecution(id);
  }
};

window.resetCode = function resetCode() {
  if (!currentLesson || !editor) return;

  resetExecution();

  editor.setValue(getLessonCode(currentLesson));
  showOutput("تمت إعادة الكود إلى المثال الأصلي.");
};

window.showQuiz = function showQuiz() {
  const modal = $("quizModal");

  if (modal) modal.style.display = "flex";
};

function renderQuiz(quiz) {
  const optionsDiv = $("quizOptions");
  const submitButton = $("submitQuizBtn");

  selectedOptionIdx = null;

  $("nextLessonBtn")?.remove();
  $("quizCompletionMessage")?.remove();

  const feedback = $("quizFeedback");

  if (feedback) {
    feedback.textContent = "";
    delete feedback.dataset.result;
  }

  displayLessonText(
    "quizQuestion",
    quiz?.question || "لا يوجد اختبار لهذا الدرس حاليًا."
  );

  if (optionsDiv) optionsDiv.replaceChildren();
  if (submitButton) submitButton.style.display = "none";

  if (!quiz || !Array.isArray(quiz.options) || !optionsDiv) return;

  quiz.options.forEach((option, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "quiz-option";
    button.textContent = option;

    button.addEventListener("click", () => {
      selectedOptionIdx = index;

      optionsDiv.querySelectorAll(".quiz-option").forEach((item) => {
        item.classList.toggle("selected", item === button);
      });

      if (submitButton) submitButton.style.display = "block";

      if (feedback) {
        feedback.textContent = "";
        delete feedback.dataset.result;
      }

      $("nextLessonBtn")?.remove();
      $("quizCompletionMessage")?.remove();
    });

    optionsDiv.appendChild(button);
  });
}

window.submitQuiz = function submitQuiz() {
  if (selectedOptionIdx === null || !currentLesson?.quiz) return;

  const quiz = currentLesson.quiz;
  const feedback = $("quizFeedback");
  const submitButton = $("submitQuizBtn");

  if (!feedback) return;

  if (selectedOptionIdx === quiz.correct_index) {
    feedback.textContent = quiz.success_msg || "إجابة صحيحة!";
    feedback.dataset.result = "correct";

    markCurrentLessonCompleted();

    if (submitButton) submitButton.style.display = "none";

    $("quizOptions")?.querySelectorAll(".quiz-option").forEach((button) => {
      button.disabled = true;
    });

    showNextLessonAction();
    return;
  }

  feedback.textContent =
    quiz.fail_msg || "الإجابة غير صحيحة. حاول مرة أخرى.";

  feedback.dataset.result = "incorrect";
};

async function initLesson() {
  if (!config) {
    showError("لغة البرمجة المحددة غير مدعومة.");
    return;
  }

  try {
    showOutput("جارٍ تحميل الدرس...");

    const response = await fetch(config.file, {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(
        `تعذر تحميل المنهج. رمز الاستجابة: ${response.status}`
      );
    }

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("ملف المنهج ليس بصيغة JSON صحيحة.");
    }

    if (!Array.isArray(data.chapters)) {
      throw new Error("ملف المنهج لا يحتوي على فصول صحيحة.");
    }

    currentCurriculum = data;

    const chapter = data.chapters[chapterIdx];
    currentLesson = chapter?.lessons?.[lessonIdx];

    if (!currentLesson) {
      throw new Error("الدرس المطلوب غير موجود. ارجع إلى قائمة الدروس.");
    }

    displayLessonText("lessonTitle", currentLesson.title);
    displayLessonText("codyIntro", currentLesson.cody_intro);

    displayLessonText(
      "lessonDescription",
      getLessonDescription(currentLesson)
    );

    displayLessonText("lessonTask", currentLesson.task);

    const hintsList = $("lessonHints");

    if (hintsList) {
      hintsList.replaceChildren();

      const hints = Array.isArray(currentLesson.hints)
        ? currentLesson.hints
        : [];

      hints.forEach((hint) => {
        const item = document.createElement("li");
        item.textContent = hint;
        hintsList.appendChild(item);
      });
    }

    if (!window.CodeMirror || !editorElement) {
      throw new Error("تعذر تحميل محرر CodeMirror.");
    }

    if (editor) {
      editor.toTextArea();
      editor = null;
    }

    editor = CodeMirror.fromTextArea(editorElement, {
      mode: config.mode,
      theme: "dracula",
      lineNumbers: true,
      autoCloseBrackets: true,
      indentUnit: 4,
      tabSize: 4,
      lineWrapping: false
    });

    editor.setValue(getLessonCode(currentLesson));

    displayLessonText("fileNameDisplay", "main" + config.ext);

    updateLessonProgress();
    renderQuiz(currentLesson.quiz || null);

    showOutput(
      lang === "cpp"
        ? "تم تحميل الدرس. تشغيل C++ غير متاح حتى ربط خدمة تنفيذ."
        : "تم تحميل الدرس. يمكنك تجربة الكود في المحرر."
    );
  } catch (error) {
    console.error("Lesson initialization failed:", error);

    displayLessonText(
      "codyIntro",
      "تعذر تحميل الدرس. تحقق من ملف المنهج واتصال الإنترنت."
    );

    showError(error?.message || "حدث خطأ أثناء تحميل الدرس.");
  }
}

window.addEventListener("beforeunload", () => {
  executionId += 1;
  stopPythonWorker();
});

requireUser()
  .then(() => initLesson())
  .catch((error) => {
    console.error("Authentication failed:", error);

    if (error?.message === "يجب تسجيل الدخول.") return;

    showError(
      "تعذر التحقق من الحساب. أعد تحميل الصفحة أو سجّل الدخول مجددًا."
    );
  });