import { App } from './app.js';

const editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
    lineNumbers: true,
    theme: 'dracula',
    mode: 'javascript',
    autoCloseBrackets: true,
    indentUnit: 4,
    tabSize: 4
});

editor.setValue("console.log('Hello Cody Academy!');");

App.init().catch(err => console.log("Auth status:", err.message));

document.getElementById('langSelector').addEventListener('change', (e) => {
    const lang = e.target.value;
    const fileName = document.getElementById('fileName');
    const output = document.getElementById('terminalOutput');
    
    output.textContent = '> جاهز للتشغيل...';

    if (lang === 'javascript') {
        editor.setOption('mode', 'javascript');
        fileName.textContent = 'main.js';
        editor.setValue("console.log('Hello Cody Academy!');");
    } else if (lang === 'python') {
        editor.setOption('mode', 'python');
        fileName.textContent = 'main.py';
        editor.setValue("print('Hello Cody Academy!')");
    } else if (lang === 'cpp') {
        editor.setOption('mode', 'text/x-c++src');
        fileName.textContent = 'main.cpp';
        editor.setValue("#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello Cody Academy!\" << endl;\n    return 0;\n}");
    }
});

document.getElementById('runBtn').addEventListener('click', async () => {
    const lang = document.getElementById('langSelector').value;
    const code = editor.getValue();
    const output = document.getElementById('terminalOutput');
    const runBtn = document.getElementById('runBtn');

    if (!code.trim()) {
        output.textContent = '> اكتب الكود أولاً.';
        return;
    }

    runBtn.disabled = true;
    output.textContent = '> جاري التشغيل...';

    try {
        if (lang === 'javascript') {
            runJavaScript(code, output);
        } else if (lang === 'python') {
            await runPython(code, output);
        } else if (lang === 'cpp') {
            await runCpp(code, output);
        }
    } catch (error) {
        output.textContent = `> خطأ: ${error.message}`;
    } finally {
        runBtn.disabled = false;
    }
});

function runJavaScript(code, outputElement) {
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.style.display = 'none';

    const source = `
        <!doctype html>
        <html>
        <body>
        <script>
            const send = (type, text) => {
                parent.postMessage({ source: 'cody-playground', type, text: String(text) }, '*');
            };

            const format = (value) => {
                if (typeof value === 'string') return value;
                try { return JSON.stringify(value); }
                catch { return String(value); }
            };

            console.log = (...args) => send('log', args.map(format).join(' '));
            console.error = (...args) => send('error', args.map(format).join(' '));
            window.onerror = (message) => send('error', message);

            try {
                const code = ${JSON.stringify(code)};
                new Function('"use strict";\\n' + code)();
                send('done', '');
            } catch (error) {
                send('error', error.message);
                send('done', '');
            }
        <\/script>
        </body>
        </html>
    `;

    const listener = (event) => {
        if (event.source !== frame.contentWindow) return;
        if (event.data?.source !== 'cody-playground') return;

        if (event.data.type === 'log') {
            if (outputElement.textContent === '> جاري التشغيل...') outputElement.textContent = '';
            outputElement.textContent += '> ' + event.data.text + '\n';
        }
        if (event.data.type === 'error') {
            if (outputElement.textContent === '> جاري التشغيل...') outputElement.textContent = '';
            outputElement.textContent += '> خطأ: ' + event.data.text + '\n';
        }
        if (event.data.type === 'done') {
            window.removeEventListener('message', listener);
            frame.remove();
            if (!outputElement.textContent.trim() || outputElement.textContent === '> جاري التشغيل...') {
                outputElement.textContent = '> تم التنفيذ بدون مخرجات.';
            }
        }
    };

    window.addEventListener('message', listener);
    document.body.appendChild(frame);
    frame.srcdoc = source;

    setTimeout(() => {
        if (document.body.contains(frame)) {
            window.removeEventListener('message', listener);
            frame.remove();
            outputElement.textContent += '\n> خطأ: انتهى الوقت المسموح.';
        }
    }, 3000);
}

async function runPython(code, outputElement) {
    if (!window.pyodide) {
        outputElement.textContent = "> جاري تحميل بيئة بايثون لأول مرة (قد يستغرق 10 ثواني)...";
        window.pyodide = await loadPyodide();
    }
    
    let finalOutput = "";
    window.pyodide.setStdout({ batched: (str) => { finalOutput += str + "\n"; } });
    window.pyodide.setStderr({ batched: (str) => { finalOutput += "Error: " + str + "\n"; } });
    
    try {
        await window.pyodide.runPythonAsync(code);
        outputElement.textContent = finalOutput || "> تم التنفيذ بدون مخرجات.";
    } catch (e) {
        outputElement.textContent = finalOutput + `\n> خطأ: ${e.message}`;
    }
}

async function runCpp(code, outputElement) {
    const encodeB64 = (str) => btoa(unescape(encodeURIComponent(str)));
    const decodeB64 = (str) => decodeURIComponent(escape(atob(str)));

    const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent('https://ce.judge0.com/submissions?base64_encoded=true&wait=true')}`;
    
    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source_code: encodeB64(code), language_id: 54 })
        });
        
        const data = await response.json();
        let out = "";
        if (data.stdout) out += decodeB64(data.stdout);
        if (data.stderr) out += decodeB64(data.stderr);
        if (data.compile_output) out += decodeB64(data.compile_output);
        
        outputElement.textContent = out || "> تم التنفيذ بدون مخرجات.";
    } catch (error) {
        outputElement.textContent = `> خطأ في الاتصال بخدمة C++: ${error.message}`;
    }
}
