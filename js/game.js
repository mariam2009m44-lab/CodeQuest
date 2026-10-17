const CONFIG = { pointsPerQuestion: 10 };
const STATE = { user: null, uid: null, lang: 'js', level: 'level1', stepIndex: 0, questionIndex: 0, score: 0, correctAnswers: 0, story: null, totalSteps: 0, totalQuestions: 0, currentStars: 0 };

const STORIES = {
    js: {
        level1: { levelTitle: 'JS: المتغيرات', steps: [
            { type: 'cody', text: 'أهلاً بك يا بطل! أنا كودي. 🤖' },
            { type: 'cody', text: 'في JavaScript، عشان نخزن معلومة، بنستخدم حاجة اسمها "متغير".' },
            { type: 'code', code: 'let name = "أحمد";' },
            { type: 'cody', text: 'كلمة let بتعمل صندوق جديد، و name هو اسم الصندوق، و "أحمد" هي القيمة.' },
            { type: 'choice', question: 'فهمت؟', options: [{ text: 'أيوه ✅', reply: 'برافو!' }, { text: 'مش أوي 🤔', reply: 'المتغير ده زي الصندوق بنحط فيه أي حاجة.' }] },
            { type: 'cody', text: 'عظيم! جاهز للامتحان؟' }
        ], questions: [
            { q: 'إزاي نعرّف متغير اسمه age وقيمته 10؟', options: ['let age = 10;', 'age = 10', 'int age = 10;'], answer: 'let age = 10;', explanation: 'بنستخدم let في JS.' },
            { q: 'إيه الكلمة اللي بتعرف متغير ثابت؟', options: ['let', 'var', 'const', 'fixed'], answer: 'const', explanation: 'const بتعني إن القيمة ثابتة.' }
        ]},
        level2: { levelTitle: 'JS: الشروط', steps: [
            { type: 'cody', text: 'النهاردة هنتعلم الشروط! 🎯' },
            { type: 'code', code: 'if (score > 50) {\n  console.log("كسبت");\n}' },
            { type: 'cody', text: 'لو اللاعب عنده أكتر من 50، هتطبع "كسبت".' },
            { type: 'cody', text: 'جاهز للامتحان؟' }
        ], questions: [
            { q: 'إيه الكلمة اللي بنستخدمها للشرط؟', options: ['if', 'for', 'let', 'else'], answer: 'if', explanation: 'if معناها "لو".' }
        ]}
    },
    py: {
        level1: { levelTitle: 'Python: المتغيرات', steps: [
            { type: 'cody', text: 'مرحباً! النهاردة لغة Python! 🐍' },
            { type: 'code', code: 'name = "سارة"' },
            { type: 'cody', text: 'في Python، بنكتب الاسم وبعدين = والقيمة. من غير let ولا const!' },
            { type: 'cody', text: 'سهلة جداً، صح؟ جاهز للامتحان؟' }
        ], questions: [
            { q: 'إزاي نعرف متغير في Python؟', options: ['let x = 5', 'x = 5', 'int x = 5'], answer: 'x = 5', explanation: 'بنكتب الاسم = والقيمة.' }
        ]}
    },
    cpp: {
        level1: { levelTitle: 'C++: المتغيرات', steps: [
            { type: 'cody', text: 'أهلاً! النهاردة C++! 🚀' },
            { type: 'code', code: 'int age = 15;' },
            { type: 'cody', text: 'لازم نقول للكمبيوتر نوع البيانات (int) وبعدها اسم المتغير.' },
            { type: 'cody', text: 'جاهز للامتحان؟' }
        ], questions: [
            { q: 'إيه الكلمة اللي بنستخدمها للأرقام الصحيحة؟', options: ['int', 'let', 'var', 'num'], answer: 'int', explanation: 'int اختصار لـ Integer.' }
        ]}
    }
};

function $(id) { return document.getElementById(id); }
function scrollChat() { const c = $('chatArea'); if (c) c.scrollTop = c.scrollHeight; }

function typeWriter(element, text, i = 0) {
    if (i === 0) element.innerHTML = '';
    if (i < text.length) {
        element.innerHTML += text.charAt(i);
        scrollChat();
        setTimeout(() => typeWriter(element, text, i + 1), 20);
    }
}

function codyBubble(html) {
    const b = document.createElement('div'); b.className = 'chat-row cody-bubble';
    const span = document.createElement('span'); b.appendChild(span);
    $('chatArea').appendChild(b); scrollChat();
    typeWriter(span, html);
    try { playSound('pop'); } catch(e) {}
}

function codeBubble(code) {
    const b = document.createElement('div'); b.className = 'chat-row code-bubble';
    let formatted = code.replace(/let|const|if|int/g, '<span class="keyword">$&</span>')
                        .replace(/"[^"]*"/g, '<span class="string">$&</span>');
    b.innerHTML = '<pre dir="ltr">' + formatted + '</pre>';
    $('chatArea').appendChild(b); scrollChat();
    try { playSound('pop'); } catch(e) {}
}

function initGame() {
    STATE.user = Auth.getCurrentUser(); STATE.uid = Auth.getUserId();
    STATE.lang = localStorage.getItem('cq_language') || 'js'; STATE.level = localStorage.getItem('cq_current_level') || 'level1';
    STATE.story = (STORIES[STATE.lang] || STORIES.js)[STATE.level] || STORIES.js.level1;
    STATE.totalSteps = STATE.story.steps.length; STATE.totalQuestions = STATE.story.questions.length;
    if($('levelInfo')) $('levelInfo').innerText = STATE.story.levelTitle;
    advanceStep();
}

function showChoices(step) {
    const area = $('choicesArea'); area.innerHTML = ''; area.classList.remove('hidden'); $('nextBtn').classList.add('hidden');
    step.options.forEach(opt => {
        const btn = document.createElement('button'); btn.className = 'choice-btn'; btn.innerText = opt.text;
        btn.onclick = () => { area.classList.add('hidden'); codyBubble(opt.reply); setTimeout(() => { STATE.stepIndex++; advanceStep(); }, 1500); };
        area.appendChild(btn);
    });
}

function advanceStep() {
    if (STATE.stepIndex >= STATE.totalSteps) { startQuiz(); return; }
    const step = STATE.story.steps[STATE.stepIndex];
    if (step.type === 'cody') { codyBubble(step.text); $('choicesArea').classList.add('hidden'); $('nextBtn').classList.remove('hidden'); }
    else if (step.type === 'code') { codeBubble(step.code); $('choicesArea').classList.add('hidden'); $('nextBtn').classList.remove('hidden'); }
    else if (step.type === 'choice') { if (step.question) codyBubble(step.question); setTimeout(() => showChoices(step), 1000); }
    $('progressFill').style.width = ((STATE.stepIndex / STATE.totalSteps) * 50) + '%';
}

window.nextStep = function() { $('nextBtn').classList.add('hidden'); STATE.stepIndex++; setTimeout(advanceStep, 500); };

function startQuiz() {
    $('nextBtn').classList.add('hidden'); $('choicesArea').classList.add('hidden');
    codyBubble('🎯 يلا بينا على الامتحان السريع!');
    setTimeout(() => loadQuestion(), 1500);
}

function loadQuestion() {
    if (STATE.questionIndex >= STATE.totalQuestions) { finishGame(); return; }
    const q = STATE.story.questions[STATE.questionIndex];
    codyBubble('❓ ' + q.q);
    const area = $('choicesArea'); area.innerHTML = ''; area.classList.remove('hidden');
    setTimeout(() => {
        q.options.forEach(opt => {
            const btn = document.createElement('button'); btn.className = 'choice-btn'; btn.innerText = opt;
            btn.onclick = () => checkAnswer(btn, opt, q.answer, q.explanation);
            area.appendChild(btn);
        });
    }, 1000);
    $('progressFill').style.width = (50 + ((STATE.questionIndex / STATE.totalQuestions) * 50)) + '%';
}

function checkAnswer(btn, selected, correct, explanation) {
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
    if (selected === correct) {
        btn.classList.add('correct'); STATE.score += CONFIG.pointsPerQuestion; STATE.correctAnswers++; $('score').innerText = STATE.score;
        try { playSound('success'); confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#00e5ff', '#27ae60'] }); } catch(e) {}
        setTimeout(() => { codyBubble('🎉 صح! ' + explanation); setTimeout(() => { STATE.questionIndex++; $('choicesArea').classList.add('hidden'); loadQuestion(); }, 2000); }, 500);
    } else {
        btn.classList.add('wrong'); try { playSound('error'); } catch(e) {}
        setTimeout(() => { codyBubble('❌ الصح: ' + correct + ' — ' + explanation); setTimeout(() => { STATE.questionIndex++; $('choicesArea').classList.add('hidden'); loadQuestion(); }, 2500); }, 500);
    }
}

async function finishGame() {
    $('progressFill').style.width = '100%'; $('codyStatusText').innerText = 'كودي خلّص الشرح! 🎉';
    STATE.currentStars = STATE.correctAnswers === STATE.totalQuestions ? 3 : (STATE.correctAnswers >= STATE.totalQuestions/2 ? 2 : 1);
    
    if (STATE.uid) {
        try {
            const userRef = firebase.firestore().collection('users').doc(STATE.uid);
            const doc = await userRef.get();
            let prog = doc.data().progress || {};
            let key = STATE.lang + '_' + STATE.level;
            prog[key] = { completed: true, stars: Math.max((prog[key]?.stars||0), STATE.currentStars) };
            
            // فتح المستوى التالي
            let nextLevelNum = parseInt(STATE.level.replace('level', '')) + 1;
            if (nextLevelNum <= 5) {
                let nextKey = STATE.lang + '_level' + nextLevelNum;
                if(!prog[nextKey]) prog[nextKey] = { completed: false, stars: 0, unlocked: true };
                else prog[nextKey].unlocked = true;
            }

            await userRef.update({ bonusPoints: firebase.firestore.FieldValue.increment(STATE.score), progress: prog });
        } catch(e) { console.error(e); }
    }
    
    codyBubble('🎉 مبروك يا ' + STATE.user + '! كسبت ' + STATE.score + ' نقطة!');
    try { confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } }); } catch(e) {}
    const backBtn = document.createElement('button'); backBtn.className = 'choice-btn'; backBtn.style.background = 'linear-gradient(135deg, #27ae60, #1e8449)'; backBtn.innerText = 'الرجوع للخريطة'; backBtn.onclick = () => window.location.href = 'levels.html';
    $('choicesArea').appendChild(backBtn); $('choicesArea').classList.remove('hidden');
}
