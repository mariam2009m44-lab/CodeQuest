
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  const languageSelect = $("language");
  const runButton = $("run");
  const resetButton = $("reset");
  const codeElement = $("code");
  const output = $("output");
  const status = $("status");

  if (!languageSelect || !runButton || !resetButton ||
      !codeElement || !output || !status) {
    console.error("Playground: عناصر HTML المطلوبة غير موجودة.");
    return;
  }

  if (!window.CodeMirror) {
    output.textContent = "تعذر تحميل CodeMirror. تحققي من الإنترنت.";
    status.textContent = "فشل تحميل المحرر.";
    runButton.disabled = true;
    return;
  }

  const TOTAL_TIMEOUT_MS = 30_000;
  const POLL_INTERVAL_MS = 1_000;
  const MAX_CODE_LENGTH = 50_000;

  const examples = {
    javascript: {
      mode: "javascript",
      code: 'console.log("Hello Cody Academy!");\nconsole.log(10 + 20);'
    },
    python: {
      mode: "python",
      code: 'print("Hello Cody Academy!")\nprint(10 + 20)'
    },
    cpp: {
      mode: "text/x-c++src",
      code: [
        "#include <iostream>",
        "using namespace std;",
        "",
        "int main() {",
        '    cout << "Hello Cody Academy!" << endl;',
        "    cout << 10 + 20 << endl;",
        "    return 0;",
        "}"
      ].join("\n")
    }
  };

  const editor = CodeMirror.fromTextArea(codeElement, {
    mode: "javascript",
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: true,
    autofocus: false,
    viewportMargin: 30
  });

  let runId = 0;
  let activeController = null;
  let pyodidePromise = null;

  function setStatus(message) {
    status.textContent = message;
  }

  function setOutput(message) {
    output.textContent = message || "";
  }

  function setBusy(busy) {
    runButton.disabled = busy;
    resetButton.disabled = busy;
    languageSelect.disabled = busy;
    runButton.textContent = busy ? "جارٍ التنفيذ..." : "▶ تشغيل الكود";
  }

  function getLanguage() {
    const value = languageSelect.value.toLowerCase();
    if (value === "js") return "javascript";
    if (value === "c++") return "cpp";
    return value;
  }

  function getRemaining(deadline) {
    const remaining = deadline - Date.now();

    if (remaining <= 0) {
      throw new Error("انتهت مهلة التنفيذ (30 ثانية).");
    }

    return remaining;
  }

  function checkRun(id) {
    if (id !== runId) {
      throw new Error("تم إلغاء التنفيذ.");
    }

    if (activeController?.signal.aborted) {
      throw new Error("تم إلغاء التنفيذ.");
    }
  }

  function cancelCurrentRun() {
    runId++;

    if (activeController) {
      activeController.abort();
      activeController = null;
    }

    setBusy(false);
  }

  function wait(ms, signal, deadline) {
    return new Promise((resolve, reject) => {
      const remaining = deadline - Date.now();

      if (remaining <= 0) {
        reject(new Error("انتهت مهلة التنفيذ."));
        return;
      }

      const timer = setTimeout(
        () => {
          cleanup();
          resolve();
        },
        Math.min(ms, remaining)
      );

      function onAbort() {
        clearTimeout(timer);
        cleanup();
        reject(new Error("تم إلغاء التنفيذ."));
      }

      function cleanup() {
        signal.removeEventListener("abort", onAbort);
      }

      if (signal.aborted) {
        onAbort();
      } else {
        signal.addEventListener("abort", onAbort, { once: true });
      }
    });
  }

  async function fetchWithDeadline(url, options, deadline, id) {
    checkRun(id);

    const controller = activeController;
    const requestController = new AbortController();

    const abortRequest = () => requestController.abort();

    controller.signal.addEventListener("abort", abortRequest, {
      once: true
    });

    const timer = setTimeout(
      abortRequest,
      getRemaining(deadline)
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: requestController.signal
      });

      checkRun(id);
      return response;
    } catch (error) {
      checkRun(id);

      if (Date.now() >= deadline || requestController.signal.aborted) {
        throw new Error("انتهت مهلة الاتصال بخدمة التنفيذ.");
      }

      throw new Error(
        "تعذر الاتصال بخدمة التنفيذ. تحققي من الإنترنت أو من إعدادات CORS."
      );
    } finally {
      clearTimeout(timer);
      controller.signal.removeEventListener("abort", abortRequest);
    }
  }

  function loadPyodide() {
    if (window.loadPyodide) {
      if (!pyodidePromise) {
        pyodidePromise = window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/"
        }).catch(error => {
          pyodidePromise = null;
          throw error;
        });
      }

      return pyodidePromise;
    }

    if (!pyodidePromise) {
      pyodidePromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js";
        script.async = true;

        const timer = setTimeout(() => {
          script.remove();
          reject(new Error("انتهت مهلة تحميل Python."));
        }, TOTAL_TIMEOUT_MS);

        script.onload = async () => {
          clearTimeout(timer);

          try {
            if (typeof window.loadPyodide !== "function") {
              throw new Error("تعذر تحميل محرك Python.");
            }

            resolve(await window.loadPyodide({
              indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/"
            }));
          } catch (error) {
            reject(error);
          }
        };

        script.onerror = () => {
          clearTimeout(timer);
          reject(new Error("فشل تحميل Python. تحققي من الإنترنت."));
        };

        document.head.appendChild(script);
      }).catch(error => {
        pyodidePromise = null;
        throw error;
      });
    }

    return pyodidePromise;
  }

  async function runPython(source, deadline, id) {
    const pyodide = await loadPyodide();

    checkRun(id);
    getRemaining(deadline);

    const captured = [];

    pyodide.setStdout({
      batched: text => captured.push(text)
    });

    pyodide.setStderr({
      batched: text => captured.push(text)
    });

    try {
      pyodide.runPython(source);
      checkRun(id);

      if (Date.now() > deadline) {
        throw new Error("تجاوز تنفيذ Python المهلة المحددة.");
      }

      return captured.join("\n") || "تم التنفيذ دون مخرجات.";
    } catch (error) {
      if (id !== runId) throw error;

      return [
        captured.join("\n"),
        "خطأ: " + (error.message || String(error))
      ].filter(Boolean).join("\n");
    } finally {
      pyodide.setStdout({});
      pyodide.setStderr({});
    }
  }

  async function runJavaScript(source, deadline, id) {
    getRemaining(deadline);

    return new Promise((resolve, reject) => {
      const frame = document.createElement("iframe");

      frame.setAttribute("sandbox", "allow-scripts");
      frame.setAttribute("title", "JavaScript execution");
      frame.style.display = "none";

      let finished = false;

      function finish(error, result) {
        if (finished) return;
        finished = true;

        clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        frame.remove();

        if (error) reject(error);
        else resolve(result);
      }

      function onMessage(event) {
        if (event.source !== frame.contentWindow) return;
        if (event.data?.channel !== "cody-playground") return;
        if (id !== runId) return;

        if (event.data.type === "done") {
          finish(null, event.data.output || "تم التنفيذ دون مخرجات.");
        } else if (event.data.type === "error") {
          finish(null, "خطأ: " + event.data.message);
        }
      }

      const timer = setTimeout(() => {
        finish(new Error("انتهت مهلة JavaScript."));
      }, getRemaining(deadline));

      window.addEventListener("message", onMessage);

      const safeSource = JSON.stringify(source);

      frame.srcdoc = `
        <!doctype html>
        <html>
        <body>
        <script>
          (() => {
            const channel = "cody-playground";
            const logs = [];

            const stringify = value => {
              if (typeof value === "string") return value;
              try { return JSON.stringify(value); }
              catch { return String(value); }
            };

            console.log = (...args) =>
              logs.push(args.map(stringify).join(" "));
            console.info = console.log;
            console.warn = (...args) =>
              logs.push("تحذير: " + args.map(stringify).join(" "));
            console.error = (...args) =>
              logs.push("خطأ: " + args.map(stringify).join(" "));

            window.onerror = (message, url, line, column, error) => {
              parent.postMessage({
                channel,
                type: "error",
                message: error?.message || String(message)
              }, "*");
              return true;
            };

            Promise.resolve()
              .then(() => (new Function("console", ${safeSource}))(console))
              .then(() => {
                parent.postMessage({
                  channel,
                  type: "done",
                  output: logs.join("\\n")
                }, "*");
              })
              .catch(error => {
                parent.postMessage({
                  channel,
                  type: "error",
                  message: error?.message || String(error)
                }, "*");
              });
          })();
        <\/script>
        </body>
        </html>
      `;

      document.body.appendChild(frame);

      activeController.signal.addEventListener("abort", () => {
        finish(new Error("تم إلغاء التنفيذ."));
      }, { once: true });
    });
  }

  async function runCpp(source, deadline, id) {
    const baseUrl = "https://ce.judge0.com";

    const response = await fetchWithDeadline(
      `${baseUrl}/submissions?base64_encoded=false&wait=false`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source_code: source,
          language_id: 54
        })
      },
      deadline,
      id
    );

    if (!response.ok) {
      throw new Error(`خدمة C++ أعادت HTTP ${response.status}.`);
    }

    const submission = await response.json();

    if (!submission.token) {
      throw new Error(submission.error || "لم يصل رمز التنفيذ.");
    }

    while (true) {
      checkRun(id);

      const check = await fetchWithDeadline(
        `${baseUrl}/submissions/${encodeURIComponent(submission.token)}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status`,
        { method: "GET" },
        deadline,
        id
      );

      if (!check.ok) {
        throw new Error(`تعذر جلب النتيجة: HTTP ${check.status}.`);
      }

      const result = await check.json();
      const statusId = result.status?.id;

      if (statusId !== 1 && statusId !== 2) {
        return [
          result.stdout,
          result.stderr ? "خطأ أثناء التشغيل:\n" + result.stderr : "",
          result.compile_output
            ? "خطأ في الترجمة:\n" + result.compile_output
            : "",
          result.message ? "رسالة:\n" + result.message : "",
          result.status?.description
            ? "حالة التنفيذ: " + result.status.description
            : ""
        ].filter(Boolean).join("\n\n") || "تم التنفيذ دون مخرجات.";
      }

      await wait(POLL_INTERVAL_MS, activeController.signal, deadline);
    }
  }

  async function executeCode() {
    if (runButton.disabled) return;

    const language = getLanguage();
    const source = editor.getValue();

    if (!source.trim()) {
      setOutput("اكتبي الكود أولًا.");
      setStatus("لا يوجد كود للتنفيذ.");
      return;
    }

    if (source.length > MAX_CODE_LENGTH) {
      setOutput("حجم الكود أكبر من الحد المسموح.");
      return;
    }

    if (!examples[language]) {
      setOutput("اللغة المحددة غير مدعومة.");
      return;
    }

    cancelCurrentRun();

    const id = runId;
    const deadline = Date.now() + TOTAL_TIMEOUT_MS;

    activeController = new AbortController();
    setBusy(true);
    setOutput("جارٍ تنفيذ الكود...");
    setStatus("جارٍ التنفيذ، برجاء الانتظار.");

    try {
      let result;

      if (language === "javascript") {
        result = await runJavaScript(source, deadline, id);
      } else if (language === "python") {
        result = await runPython(source, deadline, id);
      } else {
        result = await runCpp(source, deadline, id);
      }

      checkRun(id);
      setOutput(result);
      setStatus("انتهى التنفيذ.");
    } catch (error) {
      if (id === runId) {
        setOutput(error.message || "حدث خطأ غير متوقع.");
        setStatus("تعذر إكمال التنفيذ.");
      }
    } finally {
      if (id === runId) {
        activeController = null;
        setBusy(false);
      }
    }
  }

  function resetEditor() {
    cancelCurrentRun();

    const language = getLanguage();
    editor.setOption("mode", examples[language].mode);
    editor.setValue(examples[language].code);

    setOutput("الكود جاهز للتشغيل.");
    setStatus("جاهز للكتابة.");
    editor.refresh();
    editor.focus();
  }

  languageSelect.addEventListener("change", resetEditor);
  resetButton.addEventListener("click", resetEditor);
  runButton.addEventListener("click", executeCode);

  setOutput("أهلًا بكِ في Cody Academy!");
  setStatus("جاهز للكتابة.");
  resetEditor();
});
