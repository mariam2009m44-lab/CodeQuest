const CONFIG = { pointsPerQuestion: 10, codyUrl: 'https://cdn-icons-png.flaticon.com/512/4712/4712139.png' };
const STATE = { user: null, uid: null, lang: 'js', level: 'level1', stepIndex: 0, questionIndex: 0, score: 0, correctAnswers: 0, story: null, totalSteps: 0 };

const STORIES = {
    js: {
        level1: { langName: 'JavaScript', levelTitle: 'المستوى الأول: المتغيرات', steps: [{ type: 'cody', text: 'أهلاً بك يا بطل! أنا كودي. 🤖' }, { type: 'cody', text: 'النهاردة هنتعلم المتغيرات.' }, { type: 'code', code: 'let name = "أحمد";' }, { type: 'choice', question: 'فهمت؟', options: [{ text: 'أيوه! ✅', reply: 'برافو!' }, { text: 'مش أوي 🤔', reply: 'المتغير ده زي الصندوق بنحط فيه حاجة.' }] }, { type: 'cody', text: 'دلوقتي جاهز للامتحان؟' }], questions: [{ q: 'إزاي نعرّف متغير اسمه age وقيمته 10؟', options: ['let age = 10;', 'age = 10', 'int age = 10;'], answer: 'let age = 10;', explanation: 'بنستخدم let.' }] }
    },
    py: {
        level1: { langName: 'Python', levelTitle: 'المستوى الأول: المتغيرات', steps: [{ type: 'cody', text: 'أهلاً! النهاردة Python! 🐍' }, { type: 'code', code: 'name = "أحمد"' }, { type: 'cody', text: 'من غير أي كلمة زيادة!' }, { type: 'choice', question: 'فهمت؟', options: [{ text: 'أيوه ✅', reply: 'يلا!' }, { text: 'مش أوي 🤔', reply: 'في Python بنكتب الاسم والقيمة وبس.' }] }], questions: [{ q: 'إزاي نعرّف متغير في Python؟', options: ['age = 10', 'let age = 10;', 'int age = 10;'], answer: 'age = 10', explanation: 'بنكتب اسم المتغير وبعدين = والقيمة.' }] }
    },
    cpp: {
        level1: { langName: 'C++', levelTitle: 'المستوى الأول: المتغيرات', steps: [{ type: 'cody', text: 'أهلاً! النهاردة C++! 🚀' }, { type: 'code', code: 'int age = 15;' }, { type: 'cody', text: 'لازم نقول للكمبيوتر نوع البيانات.' }, { type: 'choice', question: 'فهمت؟', options: [{ text: 'أيوه ✅', reply: 'يلا!' }, { text: 'مش أوي 🤔', reply: 'بنستخدم int للأرقام الصحيحة.' }] }], questions: [{ q: 'إزاي نعرّف رقم صحيح في C++؟', options: ['int age = 10;', 'let age = 10;', 'age = 10'], answer: 'int age = 10;', explanation: 'بنستخدم int.' }] }
    }
};

function $(id) { return document.getElementById(id); }
function scrollChat() { const c = $('chatArea'); if (c) c.scrollTop = c.scrollHeight; }
function codyBubble(html) { const b = document.createElement('div'); b.className = 'chat-row cody-bubble'; b.innerHTML = html; $('chatArea').appendChild(b); scrollChat(); }
function codeBubble(code) { const b = document.createElement('div'); b.className = 'chat-row code-bubble'; b.innerHTML = '<pre dir="ltr">' + code + '</pre>'; $('chatArea').appendChild(b); scrollChat(); }

function initGame() {
    STATE.user = Auth.getCurrentUser(); STATE.uid = Auth.getUserId();
    STATE.lang = localStorage.getItem('cq_language') || 'js'; STATE.level = localStorage.getItem('cq_current_level') || 'level1';
    STATE.story = (STORIES[STATE.lang] || STORIES.js)[STATE.level] || STORIES.js.level1;
    STATE.totalSteps = STATE.story.steps.length;
    if($('levelInfo')) $('levelInfo').innerText = STATE.story.levelTitle;
    advanceStep();
}

function showChoices(step) {
    const area = $('choicesArea'); area.innerHTML = ''; area.classList.remove('hidden'); $('nextBtn').classList.add('hidden');
    step.options.forEach(opt => {
        const btn = document.createElement('button'); btn.className = 'choice-btn'; btn.innerText = opt.text;
        btn.onclick = () => { area.classList.add('hidden'); codyBubble(opt.reply); setTimeout(() => { STATE.stepIndex++; advanceStep(); }, 800); };
        area.appendChild(btn);
    });
}

function advanceStep() {
    if (STATE.stepIndex >= STATE.totalSteps) { startQuiz(); return; }
    const step = STATE.story.steps[STATE.stepIndex];
    if (step.type === 'cody') { codyBubble(step.text); $('choicesArea').classList.add('hidden'); $('nextBtn').classList.remove('hidden'); }
    else if (step.type === 'code') { codeBubble(step.code); $('choicesArea').classList.add('hidden'); $('nextBtn').classList.remove('hidden'); }
    else if (step.type === 'choice') { if (step.question) codyBubble(step.question); showChoices(step); }
}

function startQuiz() {
    $('nextBtn').classList.add('hidden'); $('choicesArea').classList.add('hidden');
    codyBubble('🎯 يلا بينا على الامتحان!');
    setTimeout(() => loadQuestion(), 1000);
}

function loadQuestion() {
    if (STATE.questionIndex >= STATE.story.questions.length) { finishGame(); return; }
    const q = STATE.story.questions[STATE.questionIndex];
    codyBubble('❓ ' + q.q);
    const area = $('choicesArea'); area.innerHTML = ''; area.classList.remove('hidden');
    q.options.forEach(opt => {
        const btn = document.createElement('button'); btn.className = 'choice-btn'; btn.innerText = opt;
        btn.onclick = () => checkAnswer(btn, opt, q.answer, q.explanation);
        area.appendChild(btn);
    });
}

function checkAnswer(btn, selected, correct, explanation) {
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
    if (selected === correct) {
        btn.classList.add('correct'); STATE.score += CONFIG.pointsPerQuestion; STATE.correctAnswers++; $('score').innerText = STATE.score;
        setTimeout(() => { codyBubble('🎉 صح! ' + explanation); setTimeout(() => { STATE.questionIndex++; $('choicesArea').classList.add('hidden'); loadQuestion(); }, 1500); }, 500);
    } else {
        btn.classList.add('wrong');
        setTimeout(() => { codyBubble('❌ الصح: ' + correct + ' — ' + explanation); setTimeout(() => { STATE.questionIndex++; $('choicesArea').classList.add('hidden'); loadQuestion(); }, 2000); }, 500);
    }
}

async function finishGame() {
    if (STATE.uid) {
        try {
            const userRef = firebase.firestore().collection('users').doc(STATE.uid);
            const doc = await userRef.get();
            let prog = doc.data().progress || {};
            let key = STATE.lang + '_' + STATE.level;
            let stars = (STATE.correctAnswers / STATE.story.questions.length) * 3;
            prog[key] = { completed: true, bestScore: Math.max((prog[key]?.bestScore||0), STATE.score) };
            await userRef.update({ bonusPoints: firebase.firestore.FieldValue.increment(STATE.score), progress: prog });
        } catch(e) {}
    }
    codyBubble('🎉 مبروك! كسبت ' + STATE.score + ' نقطة!');
    const backBtn = document.createElement('button'); backBtn.className = 'choice-btn'; backBtn.innerText = 'الرجوع للخريطة'; backBtn.onclick = () => window.location.href = 'levels.html';
    $('choicesArea').appendChild(backBtn); $('choicesArea').classList.remove('hidden');
}
