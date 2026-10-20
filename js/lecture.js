
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

const config = languages[lang];
const $ = (id) => document.getElementById(id);

const editorElement = $("codeEditor");
const terminal = $("terminalOutput");

let editor = null;
let currentLesson = null;
let currentData = null;
let selectedOptionIdx = null;
let pythonWorker = null;
let executionId = 0;
let running = false;
let pythonTimeout = null;

function showOutput(message) {
  if (terminal) terminal.textContent = String(message ?? "");
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

function displayLessonText(id, value) {
  const element = $(id);
  if (element) element.textContent = String(value ?? "");
}

function getLessonCode(lesson) {
  return lesson?.code_example ?? lesson?.code ?? "// اكتب الكود هنا";
}

function stopPythonWorker() {
  if (pythonTimeout !== null) {
    clearTimeout(pythonTimeout);
    pythonTimeout = null;
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

function makePythonWorker() {
  const workerSource = `
    let pyodide = null;

    self.onmessage = async (event) => {
      const { id, code } = event.data;

      try {
        if (!pyodide) {
          self.postMessage({
            id,
            type: "status",
            text: "تحميل بيئة Python..."
          });

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

  try {
    return new Worker(workerUrl);
  } finally {
    URL.revokeObjectURL(workerUrl);
  }
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

    if (data.type === "error") {
      showError(data.text);
    } else {
      showOutput(data.text);
    }

    stopPythonWorker();
    setRunning(false);
  };

  worker.onerror = () => {
    if (id !== executionId || worker !== pythonWorker) return;

    showError("تعذر تشغيل Python. تأكدي من اتصال الإنترنت.");
    stopPythonWorker();
    setRunning(false);
  };

  pythonTimeout = setTimeout(() => {
    if (id !== executionId || worker !== pythonWorker) return;

    showError("انتهى الوقت المسموح للتنفيذ. جرّبي كودًا أبسط.");
    resetExecution();
  }, 10000);

  worker.postMessage({ id, code });
}

function runJavaScript(code, id) {
  const frame = document.createElement("iframe");

  frame.setAttribute("sandbox", "allow-scripts");
  frame.setAttribute("title", "JavaScript code sandbox");
  frame.style.display = "none";

  const outputs = [];
  let finished = false;

  const finish = (message = null) => {
    if (finished) return;
    finished = true;

    clearTimeout(timeout);
    window.removeEventListener("message", listener);
    frame.remove();

    if (id !== executionId) return;

    if (message) outputs.push(message);

    showOutput(outputs.join("\n") || "تم التنفيذ.");
    setRunning(false);
  };

  const source = `<!doctype html>
<html>
<body>
<script>
(async () => {
  const send = (type, text = "") => {
    parent.postMessage({
      source: "cody-js-runner",
      id: ${JSON.stringify(id)},
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
    const code = ${JSON.stringify(code)};
    await new Function('"use strict";\\n' + code)();
  } catch (error) {
    send("error", error?.stack || error?.message || error);
  }

  send("done");
})();
<\/script>
</body>
</html>`;

  const listener = (event) => {
    if (event.source !== frame.contentWindow) return;
    if (event.data?.source !== "cody-js-runner") return;
    if (event.data?.id !== id || finished) return;

    if (event.data.type === "log") {
      outputs.push(event.data.text);
      showOutput(outputs.join("\n"));
    } else if (event.data.type === "error") {
      outputs.push("Error: " + event.data.text);
      showOutput(outputs.join("\n"));
    } else if (event.data.type === "done") {
      finish();
    }
  };

  const timeout = setTimeout(() => {
    finish("انتهى الوقت المسموح للتنفيذ.");
  }, 3000);

  window.addEventListener("message", listener);
  document.body.appendChild(frame);
  frame.srcdoc = source;
}

async function runCpp() {
  showOutput(
    "تشغيل C++ غير مفعّل حاليًا.\n" +
    "سنحتاج خدمة تنفيذ مناسبة تدعم CORS وحدود الاستخدام قبل تفعيله."
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
  } else if (lang === "cpp") {
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
  const modal = $("quizModal");
  if (modal) modal.style.display = "flex";
};

async function initLesson() {
  if (!config) {
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
    displayLessonText(
      "lessonDescription",
      currentLesson.description || currentLesson.desc || ""
    );
    displayLessonText("lessonTask", currentLesson.task);

    const hintsList = $("lessonHints");

    if (hintsList) {
      hintsList.replaceChildren();

      (currentLesson.hints || []).forEach((hint) => {
        const li = document.createElement("li");
        li.textContent = hint;
        hintsList.appendChild(li);
      });
    }

    if (!window.CodeMirror || !editorElement) {
      throw new Error("تعذر تحميل محرر الأكواد. أعيدي تحميل الصفحة.");
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

    const chapters = Array.isArray(currentData.chapters)
      ? currentData.chapters
      : [];

    const lessons = chapters.flatMap((item) =>
      Array.isArray(item.lessons) ? item.lessons : []
    );

    const currentIndex = lessons.indexOf(currentLesson);

    const percentage = lessons.length > 0 && currentIndex >= 0
      ? Math.round(((currentIndex + 1) / lessons.length) * 100)
      : 0;

    if ($("progressBar")) {
      $("progressBar").style.width = percentage + "%";
    }

    displayLessonText("progressText", percentage + "%");

    const quiz = currentLesson.quiz;
    displayLessonText(
      "quizQuestion",
      quiz?.question || "لا يوجد سؤال لهذا الدرس."
    );

    const optionsDiv = $("quizOptions");

    if (optionsDiv) {
      optionsDiv.replaceChildren();
      selectedOptionIdx = null;

      (quiz?.options || []).forEach((option, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "quiz-option";
        button.textContent = option;

        button.addEventListener("click", () => {
          selectedOptionIdx = index;

          optionsDiv.querySelectorAll(".quiz-option").forEach((item) => {
            item.classList.toggle("selected", item === button);
          });

          const submitButton = $("submitQuizBtn");
          if (submitButton) submitButton.style.display = "block";

          displayLessonText("quizFeedback", "");
        });

        optionsDiv.appendChild(button);
      });
    }

    const submitButton = $("submitQuizBtn");
    if (submitButton) submitButton.style.display = "none";

    showOutput("Console Ready...");
  } catch (error) {
    console.error("Lesson loading error:", error);

    displayLessonText(
      "codyIntro",
      "تعذر تحميل الدرس. تأكدي من وجود ملف المنهج واتصال الإنترنت."
    );

    showError(error.message);
  }
}

window.submitQuiz = async () => {
  if (selectedOptionIdx === null || !currentLesson?.quiz) return;

  const feedback = $("quizFeedback");
  const quiz = currentLesson.quiz;

  if (!feedback) return;

  if (selectedOptionIdx === quiz.correct_index) {
    feedback.textContent = quiz.success_msg || "إجابة صحيحة! أحسنتِ.";

    const submitButton = $("submitQuizBtn");
    if (submitButton) submitButton.style.display = "none";
  } else {
    feedback.textContent = quiz.fail_msg || "الإجابة غير صحيحة. حاولي مرة أخرى.";

    setTimeout(() => {
      feedback.textContent = "";
      selectedOptionIdx = null;

      $("quizOptions")
        ?.querySelectorAll(".quiz-option")
        .forEach((button) => {
          button.classList.remove("selected");
        });

      const submitButton = $("submitQuizBtn");
      if (submitButton) submitButton.style.display = "none";
    }, 1800);
  }
};

window.addEventListener("beforeunload", () => {
  resetExecution();
});

initLesson();
