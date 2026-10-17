const CONFIG = { pointsPerQuestion: 10 };
const STATE = { user: null, uid: null, lang: 'js', level: 'level1', stepIndex: 0, questionIndex: 0, score: 0, correctAnswers: 0, story: null, totalSteps: 0 };

// المنهج (موسع شوية عشان نجرب)
const STORIES = {
    js: {
        level1: { levelTitle: 'المستوى الأول: المتغيرات', steps: [
            { type: 'cody', text: 'أهلاً بك يا بطل! أنا كودي، جاهز نتعلم لغة JavaScript؟ 🤖' },
            { type: 'cody', text: 'النهاردة هنتعلم إزاي نعمل "متغير"، أو بمعنى أصح "صندوق" بنحط فيه المعلومة.' },
            { type: 'code', code: 'let name = "أحمد";' },
            { type: 'cody', text: 'كلمة let بتعمل الصندوق، و name اسم الصندوق، و "أحمد" هي الحاجة اللي جوه.' },
            { type: 'choice', question: 'فهمت الفكرة دي؟', options: [
                { text: 'أيوه فهمت! ✅', reply: 'برافو عليك! متحمس نكمل؟' },
                { text: 'مش أوي 🤔', reply: 'ولا يهمك، الصندوق ده زي اللي بتخزن فيه ألعابك.' }
            ] },
            { type: 'cody', text: 'عظيم! دلوقتي جاهز للامتحان الصغير بتاعنا؟' }
        ], questions: [
            { q: 'إزاي نعرّف متغير اسمه age وقيمته 10؟', options: ['let age = 10;', 'age = 10', 'int age = 10;'], answer: 'let age = 10;', explanation: 'بنستخدم let عشان نعرف متغير في JavaScript.' }
        ] }
    }
};

function $(id) { return document.getElementById(id); }
function scrollChat() { const c = $('chatArea'); if (c) c.scrollTop = c.scrollHeight; }

// دالة كتابة الكلام حرف حرف
function typeWriter(element, text, i = 0) {
    if (i === 0) element.innerHTML = '';
    if (i < text.length) {
        element.innerHTML += text.charAt(i);
        scrollChat();
        setTimeout(() => typeWriter(element, text, i + 1), 20); // سرعة الكتابة
    }
}

function codyBubble(html) {
    const b = document.createElement('div');
    b.className = 'chat-row cody-bubble';
    // بنحط النص في span عشان نكتبه حرف حرف
    const span = document.createElement('span');
    b.appendChild(span);
    $('chatArea').appendChild(b);
    scrollChat();
    typeWriter(span, html);
    try { playSound('pop'); } catch(e) {}
}

function codeBubble(code) {
    const b = document.createElement('div');
    b.className = 'chat-row code-bubble';
    // تلوين الكود بشكل بسيط
    let formatted = code.replace(/let|const/g, '<span class="keyword">$&</span>')
                        .replace(/"[^"]*"/g, '<span class="string">$&</span>');
    b.innerHTML = '<pre dir="ltr">' + formatted + '</pre>';
    $('chatArea').appendChild(b);
    scrollChat();
    try { playSound('pop'); } catch(e) {}
}

function initGame() {
    STATE.user = Auth.getCurrentUser(); STATE.uid = Auth.getUserId();
    STATE.story = STORIES.js.level1; // للتبسيط دلوقتي
    if($('levelInfo')) $('levelInfo').innerText = STATE.story.levelTitle;
    advanceStep();
}

function showChoices(step) {
    const area = $('choicesArea'); area.innerHTML = ''; area.classList.remove('hidden'); $('nextBtn').classList.add('hidden');
    step.options.forEach(opt => {
        const btn = document.createElement('button'); btn.className = 'choice-btn'; btn.innerText = opt.text;
        btn.onclick = () => { 
            area.classList.add('hidden'); 
            codyBubble(opt.reply); 
            setTimeout(() => { STATE.stepIndex++; advanceStep(); }, 1500); 
        };
        area.appendChild(btn);
    });
}

function advanceStep() {
    if (STATE.stepIndex >= STATE.story.steps.length) { startQuiz(); return; }
    const step = STATE.story.steps[STATE.stepIndex];
    if (step.type === 'cody') { 
        codyBubble(step.text); 
        $('choicesArea').classList.add('hidden'); 
        $('nextBtn').classList.remove('hidden'); 
    }
    else if (step.type === 'code') { 
        codeBubble(step.code); 
        $('choicesArea').classList.add('hidden'); 
        $('nextBtn').classList.remove('hidden'); 
    }
    else if (step.type === 'choice') { 
        if (step.question) codyBubble(step.question); 
        setTimeout(() => showChoices(step), 1000); 
    }
    $('progressFill').style.width = ((STATE.stepIndex / STATE.story.steps.length) * 50) + '%';
}

window.nextStep = function() {
    $('nextBtn').classList.add('hidden');
    STATE.stepIndex++;
    setTimeout(advanceStep, 500);
};

function startQuiz() {
    $('nextBtn').classList.add('hidden'); $('choicesArea').classList.add('hidden');
    codyBubble('🎯 يلا بينا على الامتحان السريع!');
    setTimeout(() => loadQuestion(), 1500);
}

function loadQuestion() {
    if (STATE.questionIndex >= STATE.story.questions.length) { finishGame(); return; }
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
    $('progressFill').style.width = '75%';
}

function checkAnswer(btn, selected, correct, explanation) {
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
    if (selected === correct) {
        btn.classList.add('correct'); STATE.score += CONFIG.pointsPerQuestion; $('score').innerText = STATE.score;
        try { playSound('success'); } catch(e) {}
        try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ['#00e5ff', '#27ae60'] }); } catch(e) {}
        setTimeout(() => { 
            codyBubble('🎉 صح! ' + explanation); 
            setTimeout(() => { STATE.questionIndex++; $('choicesArea').classList.add('hidden'); loadQuestion(); }, 2000); 
        }, 500);
    } else {
        btn.classList.add('wrong'); try { playSound('error'); } catch(e) {}
        setTimeout(() => { 
            codyBubble('❌ الصح: ' + correct + ' — ' + explanation); 
            setTimeout(() => { STATE.questionIndex++; $('choicesArea').classList.add('hidden'); loadQuestion(); }, 2500); 
        }, 500);
    }
}

async function finishGame() {
    $('progressFill').style.width = '100%';
    $('codyStatusText').innerText = 'كودي خلّص الشرح! 🎉';
    if (STATE.uid) {
        try {
            await firebase.firestore().collection('users').doc(STATE.uid).update({ bonusPoints: firebase.firestore.FieldValue.increment(STATE.score) });
        } catch(e) {}
    }
    codyBubble('🎉 مبروك يا ' + STATE.user + '! كسبت ' + STATE.score + ' نقطة!');
    try { confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } }); } catch(e) {}
    const backBtn = document.createElement('button'); backBtn.className = 'choice-btn'; backBtn.style.background = 'linear-gradient(135deg, #27ae60, #1e8449)'; backBtn.innerText = 'الرجوع للخريطة'; backBtn.onclick = () => window.location.href = 'levels.html';
    $('choicesArea').appendChild(backBtn); $('choicesArea').classList.remove('hidden');
}
