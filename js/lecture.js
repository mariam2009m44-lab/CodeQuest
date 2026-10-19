
import { showToast } from "./ui.js";

const params = new URLSearchParams(location.search);
const lang = params.get("lang") || "javascript";
const chapterIdx = Number.parseInt(params.get("chapter") || "0", 10);
const lessonIdx = Number.parseInt(params.get("lesson") || "0", 10);

const languages = {
  javascript: {
    file: "json/js_curriculum.json",
    ext: ".js",
    mode: "javascript"
  },
  python: {
    file: "json/python_curriculum.json",
    ext: ".py",
    mode: "python"
  },
  cpp: {
    file: "json/cpp_curriculum.json",
    ext: ".cpp",
    mode: "text/x-c++src"
  }
};

const config = languages[lang] || languages.javascript;

const $ = (id) => document.getElementById(id);

const editorElement = $("codeEditor");
const terminal = $("terminalOutput");

let editor;
let currentLesson = null;
let currentData = null;
let selectedOptionIdx = null;
let pythonWorker = null;
let executionId = 0;
let running = false;

function showOutput(message) {
  terminal.textContent = String(message ?? "");
}

function showError(message) {
  showOutput("خطأ:\n" + String(message || "حدث خطأ غير معروف."));
}

function setRunning(value) {
  running = value;

  const button = $("runCodeBtn");
  if (button) {
    button.disabled = value;
    button.textContent = value ? "جارٍ التشغيل..." : "▶ تشغيل الكود";
  }
}

function escapeText(value) {
  return String(value ?? "");
}

function displayLessonText(id, value) {
  const element = $(id);
  if (element) element.textContent = escapeText(value);
}

function getLessonCode(lesson) {
  return lesson?.code_example ?? lesson?.code ?? "// اكتب الكود هنا";
}

function stopPythonWorker() {
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

function makePythonWorker() {
  const workerSource = `
    let pyodide = null;

    self.onmessage = async (event) => {
      const { id, code } = event.data;

      try {
        if (!pyodide) {
          self.postMessage({ id, type: "status", text: "تحميل بيئة Python..." });

          importScripts(
            "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js"
          );

          pyodide = await loadPyodide();
        }

        const logs = [];

        pyodide.setStdout({
          batched: (text) => logs.push(text)
        });

        pyodide.setStderr({
          batched: (text) => logs.push(text)
        });

        await pyodide.runPythonAsync(code);

        self.postMessage({
          id,
          type: "result",
          text: logs.join("\\n") || "تم التنفيذ بنجاح."
        });
      } catch (error) {
        self.postMessage({
          id,
          type: "error",
          text: String(error?.message || error)
        });
      }
    };
  `;

  const blob = new Blob([workerSource], {
    type: "text/javascript"
  });

  const workerUrl = URL.createObjectURL(blob);

  const worker = new Worker(workerUrl);

  URL.revokeObjectURL(workerUrl);

  return worker;
}

function runPython(code, id) {
  stopPythonWorker();

  try {
    pythonWorker = makePythonWorker();
  } catch (error) {
    showError("تعذر إنشاء بيئة Python: " + error.message);
    setRunning(false);
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

    showOutput(data.text);
    stopPythonWorker();
    setRunning(false);
  };

  worker.onerror = () => {
    if (id !== executionId) return;

    showError("تعذر تشغيل Python. تأكدي من اتصال الإنترنت.");
    stopPythonWorker();
    setRunning(false);
  };

  worker.postMessage({ id, code });

  // حد زمني تقريبي للتنفيذ داخل عامل Python.
  setTimeout(() => {
    if (id !== executionId || !running) return;

    showError("انتهى الوقت المسموح للتنفيذ. جرّبي كودًا أبسط.");
    resetExecution();
  }, 10000);
}

function runJavaScript(code, id) {
  const frame = document.createElement("iframe");

  frame.setAttribute("sandbox", "allow-scripts");
  frame.setAttribute("title", "JavaScript code sandbox");
  frame.style.display = "none";

  const source = `
    <!doctype html>
    <html>
    <body>
    <script>
      (() => {
        const send = (type, text) => {
          parent.postMessage({
            source: "cody-js-runner",
            id: ${JSON.stringify(id)},
            type,
            text: String(text)
          }, "*");
        };

        const format = (value) => {
          if (typeof value === "string") return value;
          try { return JSON.stringify(value); }
          catch { return String(value); }
        };

        console.log = (...args) => send("log", args.map(format).join(" "));
        console.error = (...args) => send("error", args.map(format).join(" "));
        console.warn = (...args) => send("log", args.map(format).join(" "));

        window.onerror = (message) => {
          send("error", message);
        };

        try {
          const code = ${JSON.stringify(code)};
          const result = new Function('"use strict";\\n' + code)();

          if (result && typeof result.then === "function") {
            result.catch(error => send("error", error?.message || error));
          }
        } catch (error) {
          send("error", error?.stack || error?.message || error);
        }

        send("done", "");
      })();
    <\/script>
    </body>
    </html>
  `;

  const outputs = [];

  const listener = (event) => {
    if (event.source !== frame.contentWindow) return;
    if (event.data?.source !== "cody-js-runner") return;
    if (event.data?.id !== id) return;

    if (event.data.type === "log") {
      outputs.push(event.data.text);
      showOutput(outputs.join("\n") || "جارٍ التنفيذ...");
    } else if (event.data.type === "error") {
      outputs.push("Error: " + event.data.text);
      showOutput(outputs.join("\n"));
    } else if (event.data.type === "done") {
      window.removeEventListener("message", listener);
      frame.remove();
      setRunning(false);

      if (!outputs.length) showOutput("تم التنفيذ.");
    }
  };

  window.addEventListener("message", listener);
  document.body.appendChild(frame);

  frame.srcdoc = source;

  setTimeout(() => {
    if (id !== executionId || !running) return;

    window.removeEventListener("message", listener);
    frame.remove();

    showError("انتهى الوقت المسموح للتنفيذ.");
    setRunning(false);
  }, 3000);
}

async function runCpp(code) {
  showOutput(
    "تشغيل C++ غير مفعّل في هذه النسخة.\n" +
    "نحتاج اختيار خدمة تنفيذ موثوقة تدعم CORS وحدود الاستخدام قبل تفعيلها."
  );
  setRunning(false);
}

async function runUserCode() {
  if (!editor || running) return;

  const code = editor.getValue();

  if (!code.trim()) {
    showOutput("اكتبي الكود أولًا ثم اضغطي تشغيل.");
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
    await runCpp(code);
  }
}

window.runUserCode = runUserCode;

window.resetCode = () => {
  if (!currentLesson || !editor) return;

  resetExecution();
  editor.setValue(getLessonCode(currentLesson));
  showOutput("Console Ready...");
};

window.showQuiz = () => {
  if ($("quizModal")) $("quizModal").style.display = "flex";
};

async function initLesson() {
  if (!languages[lang]) {
    showError("لغة البرمجة المحددة غير مدعومة.");
    return;
  }

  try {
    const response = await fetch(config.file);

    if (!response.ok) {
      throw new Error("تعذر تحميل ملف المنهج.");
    }

    currentData = await response.json();

    const chapter = currentData.chapters?.[chapterIdx];
    currentLesson = chapter?.lessons?.[lessonIdx];

    if (!currentLesson) {
      throw new Error("الدرس المطلوب غير موجود.");
    }

    displayLessonText("lessonTitle", currentLesson.title);
    displayLessonText("codyIntro", currentLesson.cody_intro);
    displayLessonText("lessonDescription", currentLesson.description || currentLesson.desc || "");
    displayLessonText("lessonTask", currentLesson.task);

    const hintsList = $("lessonHints");
    hintsList.replaceChildren();

    (currentLesson.hints || []).forEach((hint) => {
      const li = document.createElement("li");
      li.textContent = hint;
      hintsList.appendChild(li);
    });

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

    displayLessonText(
      "fileNameDisplay",
      "main" + config.ext
    );

    const lessons = currentData.chapters.flatMap((item) => item.lessons || []);
    const currentIndex = lessons.indexOf(currentLesson);
    const percentage = lessons.length > 0
      ? Math.round(((Math.max(0, currentIndex) + 1) / lessons.length) * 100)
      : 0;

    if ($("progressBar")) $("progressBar").style.width = percentage + "%";
    displayLessonText("progressText", percentage + "%");

    displayLessonText("quizQuestion", currentLesson.quiz?.question || "لا يوجد سؤال لهذا الدرس.");

    const optionsDiv = $("quizOptions");
    optionsDiv.replaceChildren();

    (currentLesson.quiz?.options || []).forEach((option, index) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "quiz-option";
      button.textContent = option;

      button.addEventListener("click", () => {
        selectedOptionIdx = index;

        optionsDiv.querySelectorAll(".quiz-option").forEach((item) => {
          item.classList.toggle("selected", item === button);
        });

        $("submitQuizBtn").style.display = "block";
      });

      optionsDiv.appendChild(button);
    });

    showOutput("Console Ready...");
  } catch (error) {
    console.error("Lesson loading error:", error);
    displayLessonText(
      "codyIntro",
      "تعذر تحميل الدرس. تأكدي من وجود ملف المنهج واتصلي بالإنترنت ثم أعيدي المحاولة."
    );
    showError(error.message);
  }
}

window.submitQuiz = async () => {
  if (selectedOptionIdx === null || !currentLesson?.quiz) return;

  const feedback = $("quizFeedback");
  const quiz = currentLesson.quiz;

  if (selectedOptionIdx === quiz.correct_index) {
    feedback.textContent = quiz.success_msg || "إجابة صحيحة! أحسنتِ.";

    // لا نمنح XP من المتصفح قبل مراجعة نظام التحقق وقواعد قاعدة البيانات.
    feedback.textContent +=
      "\nإجابة صحيحة! نظام النقاط سيُفعّل بعد تأمين التحقق من الإجابات.";

    $("submitQuizBtn").style.display = "none";
  } else {
    feedback.textContent = quiz.fail_msg || "الإجابة غير صحيحة. حاولي مرة أخرى.";

    setTimeout(() => {
      feedback.textContent = "";
      selectedOptionIdx = null;

      $("quizOptions").querySelectorAll(".quiz-option").forEach((button) => {
        button.classList.remove("selected");
      });

      $("submitQuizBtn").style.display = "none";
    }, 1800);
  }
};

window.addEventListener("beforeunload", () => {
  stopPythonWorker();
});

initLesson();
