
import { requireUser } from "./auth.js";

/* =========================================
   1. إعدادات الصفحة والمنهج
========================================= */

const params = new URLSearchParams(window.location.search);

const lang = params.get("lang") || "javascript";

function parseIndex(value) {
  if (value === null || !/^\d+$/.test(value)) {
    return 0;
  }

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
let selectedOptionIdx = null;

let pythonWorker = null;
let pythonTimeout = null;
let executionId = 0;
let running = false;
let lessonInitialized = false;

/* =========================================
   2. أدوات الواجهة
========================================= */

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

  if (element) {
    element.textContent = String(value ?? "");
  }
}

function setRunning(value) {
  running = value;

  const button = $("runCodeBtn");

  if (button) {
    button.disabled = value;
    button.textContent = value
      ? "جارٍ التشغيل..."
      : "▶ تشغيل الكود";
  }
}

function getLessonCode(lesson) {
  const code =
    lesson?.code_example ??
    lesson?.code ??
    "";

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

/* =========================================
   3. إدارة عمليات التنفيذ
========================================= */

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

/* =========================================
   4. تشغيل Python باستخدام Pyodide
========================================= */

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
        send(
          "error",
          error?.message || String(error)
        );
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
  } catch (error) {
    showError(
      "تعذر إنشاء بيئة Python. تأكدي من تشغيل المنصة عبر خادم محلي أو استضافتها على HTTPS."
    );

    finishExecution(id);
    return;
  }

  const worker = pythonWorker;

  worker.onmessage = (event) => {
    if (id !== executionId || worker !== pythonWorker) {
      return;
    }

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
    if (id !== executionId || worker !== pythonWorker) {
      return;
    }

    showError(
      "تعذر تشغيل Python. تحققي من اتصال الإنترنت وإمكانية تحميل Pyodide."
    );

    finishExecution(id);
  };

  pythonTimeout = setTimeout(() => {
    if (id !== executionId || worker !== pythonWorker) {
      return;
    }

    showError(
      "انتهت مهلة التشغيل. قد يكون تحميل Python بطيئًا أو أن الكود يستغرق وقتًا طويلًا."
    );

    finishExecution(id);
  }, 30000);

  worker.postMessage({ id, code });
}

/* =========================================
   5. تشغيل JavaScript في إطار معزول
========================================= */

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

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    window.removeEventListener("message", listener);
    frame.remove();

    if (id !== executionId) return;

    if (message) {
      outputs.push(message);
    }

    showOutput(
      outputs.join("\n") || "تم تنفيذ الكود دون مخرجات."
    );

    setRunning(false);
  };

  /*
   * حماية النص المدخل من إنهاء وسم script
   * عند تضمين نص مثل </script> داخل الكود.
   */
  const safeCode = JSON.stringify(code).replace(
    /</g,
    "\\u003c"
  );

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
    send(
      "error",
      event.reason?.message || event.reason
    );
  };

  try {
    const code = ${safeCode};

    await new Function('"use strict";\\n' + code)();
  } catch (error) {
    send(
      "error",
      error?.stack || error?.message || String(error)
    );
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

    if (event.data.type === "done") {
      finish();
    }
  }

  timeout = setTimeout(() => {
    finish("انتهت مهلة التشغيل. جرّبي كودًا أبسط.");
  }, 5000);

  window.addEventListener("message", listener);

  document.body.appendChild(frame);
  frame.srcdoc = source;
}

/* =========================================
   6. تشغيل C++
========================================= */

function runCpp() {
  showOutput(
    "تشغيل C++ غير متاح حاليًا.\n\n" +
    "لم يتم ربط خدمة تنفيذ حقيقية لهذه اللغة بعد. " +
    "لن يتم اعتبار الكود منفذًا حتى يتم ربط خدمة مناسبة."
  );

  setRunning(false);
}

/* =========================================
   7. أزرار المحرر
========================================= */

window.runUserCode = async function runUserCode() {
  if (!editor || running) return;

  const code = editor.getValue();

  if (!code.trim()) {
    showOutput("اكتبي الكود أولًا، ثم اضغطي على تشغيل.");
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

  if (modal) {
    modal.style.display = "flex";
  }
};

/* =========================================
   8. تجهيز الاختبار
========================================= */

function renderQuiz(quiz) {
  const optionsDiv = $("quizOptions");
  const submitButton = $("submitQuizBtn");

  selectedOptionIdx = null;

  displayLessonText(
    "quizQuestion",
    quiz?.question || "لا يوجد اختبار لهذا الدرس حاليًا."
  );

  displayLessonText("quizFeedback", "");

  if (optionsDiv) {
    optionsDiv.replaceChildren();
  }

  if (submitButton) {
    submitButton.style.display = "none";
  }

  if (!quiz || !Array.isArray(quiz.options) || !optionsDiv) {
    return;
  }

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

      if (submitButton) {
        submitButton.style.display = "block";
      }

      displayLessonText("quizFeedback", "");
    });

    optionsDiv.appendChild(button);
  });
}

window.submitQuiz = function submitQuiz() {
  if (selectedOptionIdx === null || !currentLesson?.quiz) {
    return;
  }

  const quiz = currentLesson.quiz;
  const feedback = $("quizFeedback");
  const submitButton = $("submitQuizBtn");

  if (!feedback) return;

  if (selectedOptionIdx === quiz.correct_index) {
    feedback.textContent =
      quiz.success_msg || "إجابة صحيحة! أحسنت.";

    feedback.dataset.result = "correct";

    if (submitButton) {
      submitButton.style.display = "none";
    }

    const optionsDiv = $("quizOptions");

    optionsDiv?.querySelectorAll(".quiz-option").forEach((button) => {
      button.disabled = true;
    });

    return;
  }

  feedback.textContent =
    quiz.fail_msg || "الإجابة غير صحيحة. حاولي مرة أخرى.";

  feedback.dataset.result = "incorrect";
};

/* =========================================
   9. تحميل الدرس
========================================= */

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

    const chapter = data.chapters[chapterIdx];
    currentLesson = chapter?.lessons?.[lessonIdx];

    if (!currentLesson) {
      throw new Error(
        "الدرس المطلوب غير موجود. ارجعي إلى قائمة الدروس واختاري درسًا صحيحًا."
      );
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
      throw new Error(
        "تعذر تحميل محرر CodeMirror. تحققي من ملفات المحرر في الصفحة."
      );
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

    displayLessonText(
      "fileNameDisplay",
      "main" + config.ext
    );

    /*
     * هذا مؤشر لموضع الدرس داخل المنهج،
     * وليس نسبة إنجاز محفوظة في الحساب.
     */
    const allLessons = data.chapters.flatMap((item) =>
      Array.isArray(item.lessons) ? item.lessons : []
    );

    const currentIndex = allLessons.indexOf(currentLesson);

    const percentage =
      allLessons.length > 0 && currentIndex >= 0
        ? Math.round(((currentIndex + 1) / allLessons.length) * 100)
        : 0;

    const progressBar = $("progressBar");

    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
      progressBar.setAttribute("aria-valuenow", String(percentage));
    }

    displayLessonText("progressText", `${percentage}%`);

    renderQuiz(currentLesson.quiz || null);

    showOutput(
      lang === "cpp"
        ? "تم تحميل الدرس. تشغيل C++ غير متاح حتى ربط خدمة تنفيذ."
        : "تم تحميل الدرس. يمكنك تجربة الكود في المحرر."
    );

    lessonInitialized = true;
  } catch (error) {
    console.error("Lesson initialization failed:", error);

    displayLessonText(
      "codyIntro",
      "تعذر تحميل الدرس. تحققي من ملف المنهج واتصال الإنترنت."
    );

    showError(error?.message || "حدث خطأ أثناء تحميل الدرس.");
  }
}

/* =========================================
   10. إغلاق الصفحة والتحقق من الحساب
========================================= */

window.addEventListener("beforeunload", () => {
  executionId += 1;
  stopPythonWorker();
});

requireUser()
  .then(() => initLesson())
  .catch((error) => {
    console.error("Authentication failed:", error);

    if (error?.message === "يجب تسجيل الدخول.") {
      return;
    }

    showError(
      "تعذر التحقق من الحساب. أعيدي تحميل الصفحة أو سجلي الدخول مجددًا."
    );
  });
