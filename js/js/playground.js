
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const editorElement = document.getElementById('editor');
  const languageSelect = document.getElementById('langSelector');
  const runButton = document.getElementById('runBtn');
  const resetButton = document.getElementById('resetBtn');
  const output = document.getElementById('output');
  const fileName = document.getElementById('fileName');
  const languageLabel = document.getElementById('editorLanguage');
  const runStatus = document.getElementById('runStatus');
  const statusText = document.getElementById('statusText');

  if (
    !editorElement ||
    !languageSelect ||
    !runButton ||
    !resetButton ||
    !output
  ) {
    console.error('Cody Academy: editor elements are missing.');
    return;
  }

  const examples = {
    javascript: {
      name: 'JavaScript',
      file: 'main.js',
      mode: 'ace/mode/javascript',
      id: 63,
      code:
`console.log("Hello Cody Academy!");
console.log(10 + 20);`
    },

    python: {
      name: 'Python',
      file: 'main.py',
      mode: 'ace/mode/python',
      id: 71,
      code:
`print("Hello Cody Academy!")
print(10 + 20)`
    },

    cpp: {
      name: 'C++',
      file: 'main.cpp',
      mode: 'ace/mode/c_cpp',
      id: 54,
      code:
`#include <iostream>
using namespace std;

int main() {
    cout << "Hello Cody Academy!" << endl;
    cout << 10 + 20 << endl;
    return 0;
}`
    }
  };

  if (!window.ace) {
    showOutput(
      'تعذر تحميل محرر الأكواد. تحققي من اتصال الإنترنت ثم أعيدي تحميل الصفحة.',
      'error'
    );
    runButton.disabled = true;
    resetButton.disabled = true;
    return;
  }

  const editor = ace.edit(editorElement);

  editor.setTheme('ace/theme/monokai');
  editor.setOptions({
    fontSize: '15px',
    showPrintMargin: false,
    showFoldWidgets: true,
    highlightActiveLine: true,
    highlightSelectedWord: true,
    displayIndentGuides: true,
    scrollPastEnd: 0.2,
    tabSize: 4,
    useSoftTabs: true,
    wrap: true,
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true
  });

  let currentLanguage = languageSelect.value || 'javascript';
  let isRunning = false;

  function setStatus(message, state = 'idle') {
    statusText.textContent = message;
    runStatus.dataset.state = state;
  }

  function showOutput(message, state = 'idle') {
    output.textContent = message;
    setStatus(
      state === 'running' ? 'جارٍ التنفيذ...' :
      state === 'success' ? 'اكتمل التنفيذ' :
      state === 'error' ? 'حدث خطأ' : 'جاهز',
      state
    );
  }

  function setLanguage(language, resetCode = true) {
    const config = examples[language];

    if (!config) return;

    currentLanguage = language;
    editor.session.setMode(config.mode);

    fileName.textContent = config.file;
    languageLabel.textContent = config.name;

    if (resetCode) {
      editor.setValue(config.code, -1);
    }

    showOutput('اكتبي الكود واضغطي «تشغيل الكود» لعرض النتيجة.');
    editor.focus();
  }

  languageSelect.addEventListener('change', () => {
    if (isRunning) {
      languageSelect.value = currentLanguage;
      return;
    }

    setLanguage(languageSelect.value);
  });

  resetButton.addEventListener('click', () => {
    if (isRunning) return;

    setLanguage(currentLanguage, true);
  });

  runButton.addEventListener('click', runCode);

  async function runCode() {
    if (isRunning) return;

    const config = examples[currentLanguage];
    const sourceCode = editor.getValue();

    if (!config) {
      showOutput('اللغة المحددة غير مدعومة.', 'error');
      return;
    }

    if (!sourceCode.trim()) {
      showOutput('اكتبي الكود أولًا قبل التشغيل.', 'error');
      editor.focus();
      return;
    }

    isRunning = true;
    runButton.disabled = true;
    resetButton.disabled = true;
    languageSelect.disabled = true;

    showOutput('جارٍ إرسال الكود إلى خدمة التنفيذ...', 'running');

    try {
      const submissionResponse = await fetch(
        'https://ce.judge0.com/submissions?base64_encoded=false&wait=false',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            source_code: sourceCode,
            language_id: config.id
          })
        }
      );

      if (!submissionResponse.ok) {
        throw new Error(
          `خدمة التنفيذ غير متاحة حاليًا (HTTP ${submissionResponse.status}).`
        );
      }

      const submission = await submissionResponse.json();

      if (!submission.token) {
        throw new Error(
          submission.error || 'لم تستطع خدمة التنفيذ استقبال الكود.'
        );
      }

      showOutput('تم إرسال الكود. جارٍ انتظار النتيجة...', 'running');

      const result = await waitForResult(submission.token);

      displayResult(result);
    } catch (error) {
      console.error('Cody Academy execution error:', error);

      showOutput(
        'تعذر تشغيل الكود.\n\n' +
        getErrorMessage(error) +
        '\n\nتحققي من اتصال الإنترنت وإتاحة خدمة التنفيذ، ثم حاولي مرة أخرى.',
        'error'
      );
    } finally {
      isRunning = false;
      runButton.disabled = false;
      resetButton.disabled = false;
      languageSelect.disabled = false;
    }
  }

  async function waitForResult(token) {
    const maxAttempts = 35;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await delay(1000);

      const response = await fetch(
        'https://ce.judge0.com/submissions/' +
          encodeURIComponent(token) +
          '?base64_encoded=false&fields=stdout,stderr,compile_output,message,status,time,memory'
      );

      if (!response.ok) {
        throw new Error(
          `تعذر الحصول على النتيجة (HTTP ${response.status}).`
        );
      }

      const result = await response.json();
      const statusId = result.status?.id;

      // 1 = In Queue, 2 = Processing
      if (statusId !== 1 && statusId !== 2) {
        return result;
      }

      showOutput(
        `جارٍ تنفيذ الكود...\nالمحاولة ${attempt + 1} من ${maxAttempts}`,
        'running'
      );
    }

    throw new Error(
      'استغرق التنفيذ وقتًا طويلًا. حاولي مرة أخرى لاحقًا.'
    );
  }

  function displayResult(result) {
    const parts = [];
    const status = result.status?.description || 'حالة غير معروفة';

    if (result.stdout) {
      parts.push(result.stdout.replace(/\s+$/, ''));
    }

    if (result.stderr) {
      parts.push('--- أخطاء التشغيل ---\n' + result.stderr.trim());
    }

    if (result.compile_output) {
      parts.push('--- أخطاء الترجمة ---\n' + result.compile_output.trim());
    }

    if (result.message) {
      parts.push('--- رسالة الخدمة ---\n' + result.message);
    }

    if (!result.stdout && !result.stderr && !result.compile_output && !result.message) {
      parts.push(
        status === 'Accepted'
          ? 'تم التنفيذ بنجاح، لكن الكود لم ينتج أي مخرجات.'
          : 'لم تُرجع خدمة التنفيذ أي مخرجات.'
      );
    }

    parts.push('\nحالة التنفيذ: ' + status);

    if (result.time != null) {
      parts.push('وقت التنفيذ: ' + result.time + ' ثانية');
    }

    if (result.memory != null) {
      parts.push('الذاكرة المستخدمة: ' + result.memory + ' KB');
    }

    const successful = status === 'Accepted';

    showOutput(
      parts.join('\n\n'),
      successful ? 'success' : 'error'
    );
  }

  function getErrorMessage(error) {
    if (error instanceof TypeError) {
      return 'فشل الاتصال بالخدمة. قد تكون الخدمة غير متاحة أو تمنع طلبات المتصفح.';
    }

    return error?.message || 'حدث خطأ غير معروف.';
  }

  function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  setLanguage(currentLanguage);
});
