const CONFIG = { pointsPerQuestion: 10, codyUrl: 'https://cdn-icons-png.flaticon.com/512/4712/4712139.png' };
const STATE = { user: null, uid: null, lang: 'js', level: 'level1', stepIndex: 0, questionIndex: 0, score: 0, correctAnswers: 0, inQuiz: false, story: null, totalSteps: 0 };

const STORIES = {
    js: {
        level1: {
            langName: 'JavaScript', levelTitle: 'المستوى الأول: المتغيرات',
            steps: [
                { type: 'cody', text: 'الجزء الأول: إيه هو المتغير؟ 🤔' },
                { type: 'cody', text: 'تخيل إن عندك صندوق بتخزن فيه حاجتك. في البرمجة، الصندوق ده اسمه متغير.' },
                { type: 'code', code: 'let name = "أحمد";' },
                { type: 'choice', question: 'فهمت يعني إيه متغير؟', options: [{ text: 'أيوه! ✅', reply: 'برافو! يلا نكمل.' }, { text: 'مش أوي 🤔', reply: 'المتغير ده زي الصندوق بنحط فيه حاجة. جرب تشوف الفيديو ده.' }] },
                { type: 'cody', text: 'الجزء التاني: إزاي نعمل متغير؟ ✨' },
                { type: 'code', code: 'let age = 15;\nlet city = "القاهرة";' },
                { type: 'cody', text: 'الجزء التالت: الفرق بين let و const 🎨' },
                { type: 'code', code: 'const PI = 3.14;' },
                { type: 'choice', question: 'الفرق بين let و const؟', options: [{ text: 'let بتتغير، const ثابتة ✅', reply: 'إجابة صحيحة! 🌟' }, { text: 'مفيش فرق 🤷', reply: 'let بتسمح بتغيير القيمة، لكن const بتبقى ثابتة.' }] },
                { type: 'cody', text: 'الجزء الرابع: أنواع البيانات 📊' },
                { type: 'code', code: 'let num = 10;\nlet str = "Hello";\nlet isTrue = true;' },
                { type: 'cody', text: 'الجزء الخامس: تطبيق عملي 🎯' },
                { type: 'code', code: 'let myAge = 12;\nlet myName = "مريم";' },
                { type: 'cody', text: 'يلا نجرب امتحان صغير! 🎯' }
            ],
            questions: [
                { q: 'إزاي نعرّف متغير اسمه age وقيمته 10؟', options: ['let age = 10;', 'age = 10', 'int age = 10;', 'define age = 10;'], answer: 'let age = 10;', explanation: 'بنستخدم let.' },
                { q: 'الفرق بين let و const؟', options: ['مفيش فرق', 'let بتتغير، const ثابتة', 'const بتتغير', 'الاتنين ثابتين'], answer: 'let بتتغير، const ثابتة', explanation: 'const ثابتة.' },
                { q: 'إزاي نطبع؟', options: ['console.log(name);', 'print(name);', 'echo name;', 'write(name);'], answer: 'console.log(name);', explanation: 'console.log.' }
            ]
        }
    }
};

function initState() {
    STATE.user = Auth.getCurrentUser(); STATE.uid = Auth.getUserId(); STATE.lang = localStorage.getItem('cq_language') || 'js'; STATE.level = localStorage.getItem('cq_current_level') || 'level1';
    STATE.story = (STORIES[STATE.lang] || STORIES.js)[STATE.level] || STORIES.js.level1; STATE.totalSteps = STATE.story.steps.length;
    STATE.score = 0; STATE.correctAnswers = 0; STATE.stepIndex = 0; STATE.questionIndex = 0; STATE.inQuiz = false;
}

function $(id) { return document.getElementById(id); }
function scrollChat() { const c = $('chatArea'); if (c) c.scrollTop = c.scrollHeight; }

function codyBubble(html) { const b = document.createElement('div'); b.className = 'chat-row cody-row'; b.innerHTML = '<div class="chat-avatar cody-avatar-img"><img src="' + CONFIG.codyUrl + '" alt="Cody"></div><div class="chat-bubble cody-bubble">' + html + '</div>'; $('chatArea').appendChild(b); scrollChat(); }
function studentBubble(html) { const b = document.createElement('div'); b.className = 'chat-row student-row'; b.innerHTML = '<div class="chat-bubble student-bubble">' + html + '</div><div class="chat-avatar student-avatar">' + Auth.getAvatarHtml(STATE.user) + '</div>'; $('chatArea').appendChild(b); scrollChat(); }
function codeBubble(code) { const b = document.createElement('div'); b.className = 'chat-row cody-row'; b.innerHTML = '<div class="chat-avatar cody-avatar-img"><img src="' + CONFIG.codyUrl + '" alt="Cody"></div><div class="chat-bubble code-bubble"><pre dir="ltr">' + code + '</pre></div>'; $('chatArea').appendChild(b); scrollChat(); }

function showChoices(step) {
    const area = $('choicesArea'); const nextBtn = $('nextBtn'); area.innerHTML = ''; area.classList.remove('hidden'); nextBtn.classList.add('hidden');
    step.options.forEach(opt => {
        const btn = document.createElement('button'); btn.className = 'choice-btn'; btn.innerText = opt.text;
        btn.onclick = () => {
            try { playSound('click'); } catch(e) {}
            area.classList.add('hidden'); studentBubble(opt.text); try { playSound('pop'); } catch(e) {}
            setTimeout(() => {
                codyBubble(opt.reply);
                setTimeout(() => { STATE.stepIndex++; advanceStep(); }, 700);
            }, 400);
        };
        area.appendChild(btn);
    });
}

function advanceStep() {
    if (STATE.stepIndex >= STATE.totalSteps) { startQuiz(); return; }
    const step = STATE.story.steps[STATE.stepIndex];
    const nextBtn = $('nextBtn'); const choicesArea = $('choicesArea');
    if (step.type === 'cody') {
        codyBubble(step.text); choicesArea.classList.add('hidden'); nextBtn.classList.remove('hidden');
        $('progressFill').style.width = (10 + (STATE.stepIndex / STATE.totalSteps) * 40) + '%';
    } else if (step.type === 'code') {
        codeBubble(step.code); choicesArea.classList.add('hidden'); nextBtn.classList.remove('hidden');
    } else if (step.type === 'choice') {
        if (step.question) codyBubble(step.question);
        showChoices(step);
    }
}

function startQuiz() {
    STATE.inQuiz = true; $('nextBtn').classList.add('hidden'); $('choicesArea').classList.add('hidden');
    document.querySelectorAll('.stage-dot').forEach(d => d.classList.remove('active', 'done'));
    const chatDot = document.querySelector('[data-stage="chat"]'); const quizDot = document.querySelector('[data-stage="quiz"]');
    if (chatDot) chatDot.classList.add('done'); if (quizDot) quizDot.classList.add('active');
    $('progressFill').style.width = '60%';
    setTimeout(() => { codyBubble('🎯 يلا بينا على الامتحان!'); setTimeout(() => loadQuestion(), 800); }, 400);
}

function loadQuestion() {
    if (STATE.questionIndex >= STATE.story.questions.length) { finishGame(); return; }
    const q = STATE.story.questions[STATE.questionIndex];
    codyBubble('❓ ' + q.q);
    const area = $('choicesArea'); area.innerHTML = ''; area.classList.remove('hidden');
    q.options.forEach(opt => {
        const btn = document.createElement('button'); btn.className = 'choice-btn quiz-choice'; btn.innerText = opt;
        btn.onclick = () => checkAnswer(btn, opt, q.answer, q.explanation);
        area.appendChild(btn);
    });
    $('progressFill').style.width = (60 + ((STATE.questionIndex / STATE.story.questions.length) * 40)) + '%';
}

function checkAnswer(btn, selected, correct, explanation) {
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
    studentBubble(selected); try { playSound('pop'); } catch(e) {}
    if (selected === correct) {
        btn.classList.add('correct'); STATE.score += CONFIG.pointsPerQuestion; STATE.correctAnswers++; $('score').innerText = STATE.score;
        try { playSound('success'); } catch(e) {}
        setTimeout(() => {
            codyBubble('🎉 صح! ' + explanation);
            try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#00e5ff', '#27ae60', '#ffffff'] }); } catch(e) {}
            setTimeout(() => { STATE.questionIndex++; $('choicesArea').classList.add('hidden'); loadQuestion(); }, 1800);
        }, 500);
    } else {
        btn.classList.add('wrong'); try { playSound('error'); } catch(e) {}
        setTimeout(() => {
            codyBubble('❌ الصح: ' + correct + ' — ' + explanation);
            setTimeout(() => { STATE.questionIndex++; $('choicesArea').classList.add('hidden'); loadQuestion(); }, 2200);
        }, 500);
    }
}

async function finishGame() {
    $('progressFill').style.width = '100%';
    document.querySelectorAll('.stage-dot').forEach(d => d.classList.remove('active'));
    const quizDot = document.querySelector('[data-stage="quiz"]'); if (quizDot) quizDot.classList.add('done');
    $('choicesArea').classList.add('hidden');

    const totalQuestions = STATE.story.questions.length;
    const percentage = (STATE.correctAnswers / totalQuestions) * 100;
    const stars = percentage === 100 ? 3 : (percentage >= 50 ? 2 : 1);

    // حفظ التقدم في Firebase
    if (STATE.uid) {
        try {
            const userRef = firebase.firestore().collection('users').doc(STATE.uid);
            const doc = await userRef.get();
            const userData = doc.data();
            const progressKey = STATE.lang + '_' + STATE.level;
            const levelProgress = (userData.progress && userData.progress[progressKey]) ? userData.progress[progressKey] : { completed: false, stars: 0, bestScore: 0 };
            
            if (STATE.score > levelProgress.bestScore) levelProgress.bestScore = STATE.score;
            if (stars > levelProgress.stars) levelProgress.stars = stars;
            levelProgress.completed = true;

            const updates = {
                bonusPoints: firebase.firestore.FieldValue.increment(STATE.score),
                xp: firebase.firestore.FieldValue.increment(STATE.score),
                progress: { ...userData.progress, [progressKey]: levelProgress }
            };
            await userRef.update(updates);
        } catch (e) { console.error("Error saving progress:", e); }
    }

    setTimeout(() => {
        codyBubble('🎉 مبروك يا ' + STATE.user + '! خلّصت ' + STATE.story.levelTitle + '!');
        setTimeout(() => {
            codyBubble('كسبت ' + STATE.score + ' نقطة! ⭐');
            try { confetti({ particleCount: 250, spread: 120, origin: { y: 0.6 }, colors: ['#00e5ff', '#0072ff', '#27ae60', '#ffd700'] }); } catch(e) {}
            try { playSound('win'); } catch(e) {}
            showCelebration(stars);

            setTimeout(() => {
                const backBtn = document.createElement('button'); backBtn.className = 'choice-btn'; backBtn.style.background = 'linear-gradient(135deg, #27ae60, #1e8449)'; backBtn.innerText = '🗺️ الرجوع للخريطة';
                backBtn.onclick = () => { window.location.href = 'levels.html'; };
                $('choicesArea').appendChild(backBtn); $('choicesArea').classList.remove('hidden');
            }, 1200);
        }, 1000);
    }, 400);
}

function showCelebration(stars) {
    const overlay = document.createElement('div'); overlay.className = 'celebration-overlay';
    let starsHTML = ''; for (let i = 0; i < 3; i++) { starsHTML += '<span class="celebration-star" style="color:' + (i < stars ? '#ffd700' : '#444') + '; animation-delay:' + (0.3 + i * 0.2) + 's">★</span>'; }
    overlay.innerHTML = '<div class="celebration-card"><div class="celebration-trophy">🏆</div><div class="celebration-title">مبروك يا ' + STATE.user + '!</div><div class="celebration-subtitle">خلصت ' + STATE.story.levelTitle + '</div><div class="celebration-stars">' + starsHTML + '</div><div class="celebration-score"><div class="celebration-score-label">النقاط اللي كسبتها</div><div class="celebration-score-value">+' + STATE.score + '</div></div><button class="celebration-btn" id="celebrationContinue">🎯 كمّل</button></div>';
    document.body.appendChild(overlay); setTimeout(() => overlay.classList.add('show'), 50);
    document.getElementById('celebrationContinue').onclick = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 500); };
}

document.addEventListener('DOMContentLoaded', () => {
    
    initState();
    const levelInfoEl = $('levelInfo'); if (levelInfoEl) levelInfoEl.innerText = STATE.story.levelTitle;
    const scoreEl = $('score'); if (scoreEl) scoreEl.innerText = 0;
    advanceStep();
});
