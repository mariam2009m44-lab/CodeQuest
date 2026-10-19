import { showToast } from './ui.js';
import { addXP, auth, db, doc, getDoc, setDoc } from './app.js';

const urlParams = new URLSearchParams(window.location.search);
const lang = urlParams.get('lang') || 'javascript';
const chapterIdx = parseInt(urlParams.get('chapter')) || 0;
const lessonIdx = parseInt(urlParams.get('lesson')) || 0;

const langMap = {
    javascript: { file: 'json/js_curriculum.json', ext: '.js', mode: 'javascript', id: 63 },
    python: { file: 'json/python_curriculum.json', ext: '.py', mode: 'python', id: 71 },
    cpp: { file: 'json/cpp_curriculum.json', ext: '.cpp', mode: 'text/x-c++src', id: 54 }
};

const editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
    mode: langMap[lang].mode, theme: 'dracula', lineNumbers: true, autoCloseBrackets: true
});

document.getElementById('fileNameDisplay').innerText = 'main' + langMap[lang].ext;
let currentData = null;
let currentLesson = null;
let selectedOptionIdx = null;

async function initLesson() {
    try {
        const res = await fetch(langMap[lang].file);
        currentData = await res.json();
        const chapter = currentData.chapters[chapterIdx];
        if (!chapter) throw new Error('Chapter not found');
        currentLesson = chapter.lessons[lessonIdx];
        if (!currentLesson) throw new Error('Lesson not found');

        document.getElementById('lessonTitle').innerText = currentLesson.title;
        document.getElementById('codyIntro').innerText = currentLesson.cody_intro;
        document.getElementById('lessonTask').innerText = currentLesson.task;
        
        const hintsList = document.getElementById('lessonHints');
        hintsList.innerHTML = '';
        currentLesson.hints.forEach(h => {
            const li = document.createElement('li');
            li.innerText = h;
            hintsList.appendChild(li);
        });
        
        editor.setValue(currentLesson.code_example);
        
        const totalLessons = currentData.chapters.reduce((acc, ch) => acc + ch.lessons.length, 0);
        let completedCount = 0;
        let currentIdx = 0;
        currentData.chapters.forEach((ch, cIdx) => {
            ch.lessons.forEach((l, lIdx) => {
                if (cIdx === chapterIdx && lIdx === lessonIdx) currentIdx = completedCount;
                completedCount++;
            });
        });
        
        document.getElementById('progressBar').style.width = Math.round((currentIdx / totalLessons) * 100) + '%';
        
        document.getElementById('quizQuestion').innerText = currentLesson.quiz.question;
        const optionsDiv = document.getElementById('quizOptions');
        optionsDiv.innerHTML = '';
        currentLesson.quiz.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.innerText = opt;
            btn.onclick = () => {
                document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedOptionIdx = idx;
                document.getElementById('submitQuizBtn').style.display = 'block';
            };
            optionsDiv.appendChild(btn);
        });
    } catch (err) { document.getElementById('codyIntro').innerText = 'حدث خطأ في تحميل الدرس.'; }
}

window.resetCode = () => {
    if (currentLesson) {
        editor.setValue(currentLesson.code_example);
        document.getElementById('terminalOutput').innerHTML = '> Console Ready...';
    }
};

window.runUserCode = async () => {
    const code = editor.getValue();
    const terminal = document.getElementById('terminalOutput');
    terminal.innerHTML = '> Compiling and running...';
    
    if (lang === 'javascript') {
        let logs = [];
        const origLog = console.log;
        console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
        try {
            new Function(code)();
            console.log = origLog;
            terminal.innerHTML = logs.length > 0 ? logs.map(l => '> ' + l).join('<br>') : '> Execution completed.';
        } catch (e) {
            console.log = origLog;
            terminal.innerHTML = '<span style="color:#FF6B6B;">> Error: ' + e.message + '</span>';
        }
    } else {
        const encodeB64 = (str) => btoa(unescape(encodeURIComponent(str)));
        const decodeB64 = (str) => decodeURIComponent(escape(atob(str)));
        try {
            const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source_code: encodeB64(code), language_id: langMap[lang].id })
            });
            const data = await res.json();
            let out = '';
            if (data.stdout) out += decodeB64(data.stdout);
            if (data.stderr) out += '<span style="color:#FF6B6B;">' + decodeB64(data.stderr) + '</span>';
            if (data.compile_output) out += '<span style="color:#FF6B6B;">' + decodeB64(data.compile_output) + '</span>';
            terminal.innerHTML = out ? out.replace(/\n/g, '<br>') : '> Execution completed.';
        } catch (err) { terminal.innerHTML = '<span style="color:#FF6B6B;">> Network Error: ' + err.message + '</span>'; }
    }
};

window.showQuiz = () => { document.getElementById('quizModal').style.display = 'flex'; };

window.submitQuiz = async () => {
    if (selectedOptionIdx === null) return;
    const feedback = document.getElementById('quizFeedback');
    
    if (selectedOptionIdx === currentLesson.quiz.correct_index) {
        feedback.innerHTML = '<span style="color: var(--accent-green);">' + currentLesson.quiz.success_msg + ' +' + currentLesson.quiz.xp_reward + ' XP</span>';
        if (auth.currentUser) {
            const progressRef = doc(db, "progress", auth.currentUser.uid);
            const progressSnap = await getDoc(progressRef);
            let completed = progressSnap.exists() ? progressSnap.data().completedLessons || [] : [];
            const lessonKey = lang + '_ch' + chapterIdx + '_l' + lessonIdx;
            if (!completed.includes(lessonKey)) {
                completed.push(lessonKey);
                await setDoc(progressRef, { completedLessons: completed }, { merge: true });
                await addXP(currentLesson.quiz.xp_reward);
                showToast('تمت إضافة النقاط بنجاح!', 'success');
            }
        }
        setTimeout(() => {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn-primary';
            nextBtn.style.cssText = 'width:100%; margin-top:20px; padding: 15px; font-size: 1.1rem;';
            nextBtn.innerText = 'الدرس التالي';
            nextBtn.onclick = () => { window.location.href = 'lecture.html?lang=' + lang + '&chapter=' + chapterIdx + '&lesson=' + (lessonIdx + 1); };
            document.querySelector('.quiz-modal').appendChild(nextBtn);
            document.getElementById('submitQuizBtn').style.display = 'none';
        }, 1500);
    } else {
        feedback.innerHTML = '<span style="color: var(--accent-coral);">' + currentLesson.quiz.fail_msg + '</span>';
        setTimeout(() => {
            feedback.innerHTML = '';
            document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
            selectedOptionIdx = null;
            document.getElementById('submitQuizBtn').style.display = 'none';
        }, 2000);
    }
};
initLesson();
