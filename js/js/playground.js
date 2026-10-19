
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);

  const editorBox = $('editor');
  const languageSelect = $('langSelector');
  const runButton = $('runBtn');
  const resetButton = $('resetBtn');
  const output = $('output');
  const fileName = $('fileName');
  const languageLabel = $('editorLanguage');
  const runStatus = $('runStatus');
  const statusText = $('statusText');

  function show(message, state = 'idle') {
    if (output) output.textContent = message;
    if (runStatus) runStatus.dataset.state = state;
    if (statusText) {
      statusText.textContent =
        state === 'running' ? 'جارٍ التنفيذ...' :
        state === 'success' ? 'اكتمل التنفيذ' :
        state === 'error' ? 'حدث خطأ' : 'جاهز';
    }
  }

  if (!editorBox || !languageSelect || !runButton ||
      !resetButton || !output) {
    console.error('Cody Academy: عناصر المحرر غير مكتملة.');
    return;
  }

  if (!window.ace) {
    show(
      'لم يتم تحميل Ace Editor. تأكدي من اتصال الإنترنت ثم أعيدي تحميل الصفحة.',
      'error'
    );
    runButton.disabled = true;
    return;
  }

  const examples = {
    javascript: {
      name: 'JavaScript',
      file: 'main.js',
      mode: 'ace/mode/javascript',
      id: 63,
      code: `console.log("Hello Cody Academy!");
console.log(10 + 20);`
    },
    python: {
      name: 'Python',
      file: 'main.py',
      mode: 'ace/mode/python',
      id: 71,
      code: `print("Hello Cody Academy!")
print(10 + 20)`
    },
    cpp: {
      name: 'C++',
      file: 'main.cpp',
      mode: 'ace/mode/c_cpp',
      id: 54,
      code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello Cody Academy!" << endl;
    cout << 10 + 20 << endl;
    return 0;
}`
    }
  };

  let editor;

  try {
    editor = window.ace.edit(editorBox);
    editor.setTheme('ace/theme/monokai');
    editor.session.setMode('ace/mode/javascript');
    editor.setOptions({
      fontSize: '15px',
      showPrintMargin: false,
      tabSize: 4,
      useSoftTabs: true,
      wrap: true,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true
    });
  } catch (error) {
    show('تعذر إعداد المحرر: ' + error.message, 'error');
    return;
  }

  let currentLanguage = examples[languageSelect.value]
    ? languageSelect.value
    : 'javascript';

  let isRunning = false;

  function setLanguage(language, resetCode = true) {
    const config = examples[language];
    if (!config) return;

    currentLanguage = language;
    editor.session.setMode(config.mode);

    if (fileName) fileName.textContent = config.file;
    if (languageLabel) languageLabel.textContent = config.name;

    if (resetCode) editor.setValue(config.code, -1);

    show('اكتبي الكود واضغطي «تشغيل الكود» لعرض النتيجة.');
  }

  languageSelect.addEventListener('change', () => {
    if (isRunning) {
      languageSelect.value = currentLanguage;
      return;
    }
    setLanguage(languageSelect.value);
  });

  resetButton.addEventListener('click', () => {
    if (!isRunning) setLanguage(currentLanguage);
  });

  runButton.addEventListener('click', runCode);

  async function runCode() {
    if (isRunning) return;

    const config = examples[currentLanguage];
    const sourceCode = editor.getValue();

    if (!config) {
      show('اللغة المحددة غير مدعومة.', 'error');
      return;
    }

    if (!sourceCode.trim()) {
      show('اكتبي الكود أولًا.', 'error');
      editor.focus();
      return;
    }

    isRunning = true;
    runButton.disabled = true;
    resetButton.disabled = true;
    languageSelect.disabled = true;

    show('جارٍ إرسال الكود إلى خدمة التنفيذ...', 'running');

    try {
      const response = await fetch(
        'https://ce.judge0.com/submissions?base64_encoded=false&wait=false',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_code: sourceCode,
            language_id: config.id
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          'خدمة التنفيذ ردّت برمز HTTP ' + response.status +
          '. قد تكون الخدمة مزدحمة أو غير متاحة.'
        );
      }

      const submission = await response.json();

      if (!submission.token) {
        throw new Error(
          submission.error || 'الخدمة لم تُرجع رمز طلب التنفيذ.'
        );
      }

      const result = await waitForResult(submission.token);
      displayResult(result);

    } catch (error) {
      console.error('Cody Academy:', error);

      let message;

      if (error.name === 'TypeError') {
        message =
          'تعذر الاتصال بخدمة التنفيذ.\n' +
          'قد يكون السبب مشكلة إنترنت أو أن الخدمة تمنع طلبات المتصفح (CORS).';
      } else {
        message = error.message || 'حدث خطأ غير معروف.';
      }

      show(
        message +
        '\n\nالمحرر يعمل، لكن تشغيل الكود يحتاج إلى خدمة تنفيذ متاحة.',
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
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const url =
        'https://ce.judge0.com/submissions/' +
        encodeURIComponent(token) +
        '?base64_encoded=false&fields=stdout,stderr,compile_output,message,status,time,memory';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          'تعذر جلب نتيجة التنفيذ. HTTP ' + response.status
        );
      }

      const result = await response.json();
      const statusId = result.status && result.status.id;

      if (statusId !== 1 && statusId !== 2) {
        return result;
      }

      show(
        'جارٍ تنفيذ الكود... (' + (attempt + 1) + '/30)',
        'running'
      );
    }

    throw new Error('التنفيذ استغرق وقتًا طويلًا. حاولي مرة أخرى.');
  }

  function displayResult(result) {
    const parts = [];
    const status = result.status?.description || 'Unknown';

    if (result.stdout) {
      parts.push(result.stdout.trimEnd());
    }

    if (result.stderr) {
      parts.push('خطأ أثناء التشغيل:\n' + result.stderr.trim());
    }

    if (result.compile_output) {
      parts.push('خطأ في الترجمة:\n' + result.compile_output.trim());
    }

    if (result.message) {
      parts.push('رسالة الخدمة:\n' + result.message);
    }

    if (parts.length === 0) {
      parts.push(
        status === 'Accepted'
          ? 'تم التنفيذ بنجاح، لكن لا توجد مخرجات.'
          : 'لا توجد مخرجات. راجعي حالة التنفيذ أدناه.'
      );
    }

    parts.push('حالة التنفيذ: ' + status);

    if (result.time != null) {
      parts.push('وقت التنفيذ: ' + result.time + ' ثانية');
    }

    show(
      parts.join('\n\n'),
      status === 'Accepted' ? 'success' : 'error'
    );
  }

  setLanguage(currentLanguage);
  console.log('Cody Academy editor initialized successfully.');
});
