
import { App } from './app.js';

const output = document.getElementById('terminalOutput');
const runButton = document.getElementById('runButton');
const clearButton = document.getElementById('clearButton');

let editor;

function formatValue(value) {
  if (typeof value === 'string') return value;

  if (value instanceof Error) {
    return value.stack || value.message;
  }

  try {
    const result = JSON.stringify(value, null, 2);
    return result === undefined ? String(value) : result;
  } catch {
    return String(value);
  }
}

function showOutput(message) {
  output.textContent += message + '\n';
}

function runCode() {
  if (!editor || runButton.disabled) return;

  const code = editor.getValue();

  output.textContent = 'جارٍ التشغيل...\n';
  runButton.disabled = true;

  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.setAttribute('title', 'JavaScript code runner');
  frame.style.display = 'none';

  let finished = false;
  let timeoutId;

  function finish() {
    if (finished) return;

    finished = true;
    clearTimeout(timeoutId);
    window.removeEventListener('message', onMessage);
    frame.remove();
    runButton.disabled = false;

    if (!output.textContent.trim() ||
        output.textContent === 'جارٍ التشغيل...\n') {
      output.textContent = 'تم التنفيذ، ولم يظهر أي ناتج.';
    }
  }

  function onMessage(event) {
    if (event.source !== frame.contentWindow) return;

    const data = event.data;

    if (!data || data.source !== 'cody-playground') return;
    if (finished) return;

    if (data.type === 'log') {
      if (output.textContent === 'جارٍ التشغيل...\n') {
        output.textContent = '';
      }

      showOutput(data.text);
    }

    if (data.type === 'error') {
      if (output.textContent === 'جارٍ التشغيل...\n') {
        output.textContent = '';
      }

      showOutput('خطأ: ' + data.text);
    }

    if (data.type === 'done') {
      finish();
    }
  }

  window.addEventListener('message', onMessage);

  const source = `<!doctype html>
<html>
<body>
<script>
  const send = (type, text) => {
    parent.postMessage({
      source: 'cody-playground',
      type,
      text: String(text)
    }, '*');
  };

  function format(value) {
    if (typeof value === 'string') return value;

    try {
      const result = JSON.stringify(value);
      return result === undefined ? String(value) : result;
    } catch {
      return String(value);
    }
  }

  console.log = (...args) => {
    send('log', args.map(format).join(' '));
  };

  console.error = (...args) => {
    send('error', args.map(format).join(' '));
  };

  console.warn = (...args) => {
    send('log', 'تحذير: ' + args.map(format).join(' '));
  };

  window.onerror = (message) => {
    send('error', message);
    return true;
  };

  try {
    const userCode = ${JSON.stringify(code)};
    new Function('"use strict";\\n' + userCode)();
  } catch (error) {
    send('error', error && error.message ? error.message : error);
  } finally {
    send('done', '');
  }
<\/script>
</body>
</html>`;

  document.body.appendChild(frame);
  frame.srcdoc = source;

  // تنبيه عند تجاوز الوقت المحدد.
  // هذا المؤقت ليس ضمانًا لإيقاف كل حلقة لا نهائية.
  timeoutId = setTimeout(() => {
    if (!finished) {
      if (output.textContent === 'جارٍ التشغيل...\n') {
        output.textContent = '';
      }

      showOutput('انتهى الوقت المحدد. قد تحتاجين إلى إعادة تحميل الصفحة.');
      finish();
    }
  }, 3000);
}

async function initPlayground() {
  try {
    // app.js يتولى التهيئة تلقائيًا في المشروع الحالي.
    // ننتظر تهيئة المستخدم إذا كانت الصفحة تعتمد عليها.
    if (window.CodeMirror) {
      editor = CodeMirror.fromTextArea(
        document.getElementById('codeEditor'),
        {
          lineNumbers: true,
          theme: 'dracula',
          mode: 'javascript',
          tabSize: 2,
          indentUnit: 2,
          lineWrapping: true
        }
      );

      editor.setValue(
        "console.log('Hello Cody Academy!');\n" +
        "console.log({ name: 'Ali', age: 10 });\n" +
        "console.log([1, 2, 3]);"
      );

      runButton.addEventListener('click', runCode);

      clearButton.addEventListener('click', () => {
        output.textContent = '';
      });
    } else {
      output.textContent = 'تعذر تحميل محرر الأكواد. تحققي من اتصال الإنترنت.';
      runButton.disabled = true;
    }
  } catch (error) {
    console.error('Playground initialization error:', error);
    output.textContent = 'حدث خطأ أثناء تجهيز المحرر.';
  }
}

initPlayground();
