let currentStep = 0;
let score = 0;
const steps = [
    { text: 'أهلاً بك يا بطل! أنا كودي. 🤖', type: 'cody' },
    { text: 'النهاردة هنتعلم المتغيرات في JavaScript.', type: 'cody' },
    { text: 'let name = "أحمد";', type: 'code' },
    { text: 'كلمة let بتعمل صندوق جديد، و name هو اسم الصندوق.', type: 'cody' },
    { text: 'جاهز للأسئلة؟', type: 'cody' }
];

function initGame() {
    document.getElementById('levelInfo').innerText = 'المستوى الأول: المتغيرات';
    loadStep();
}

function loadStep() {
    if (currentStep >= steps.length) {
        startQuiz(); return;
    }
    const step = steps[currentStep];
    const area = document.getElementById('chatArea');
    const div = document.createElement('div');
    div.className = 'chat-row ' + (step.type === 'cody' ? 'cody-bubble' : 'code-bubble');
    div.innerText = step.text;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
    
    document.getElementById('progressFill').style.width = ((currentStep/steps.length) * 50) + '%';
}

window.nextStep = function() {
    const btn = document.getElementById('nextBtn');
    btn.classList.add('hidden');
    currentStep++;
    setTimeout(() => { loadStep(); btn.classList.remove('hidden'); }, 500);
};

function startQuiz() {
    document.getElementById('nextBtn').classList.add('hidden');
    document.getElementById('chatArea').innerHTML = '';
    const area = document.getElementById('chatArea');
    const div = document.createElement('div');
    div.className = 'chat-row cody-bubble';
    div.innerText = '❓ إزاي نعرّف متغير اسمه age وقيمته 10؟';
    area.appendChild(div);
    
    const choicesArea = document.getElementById('choicesArea');
    choicesArea.classList.remove('hidden');
    choicesArea.innerHTML = '';
    
    const options = ['let age = 10;', 'age = 10', 'int age = 10;'];
    options.forEach(opt => {
        const b = document.createElement('button');
        b.className = 'choice-btn';
        b.innerText = opt;
        b.onclick = () => checkAnswer(b, opt);
        choicesArea.appendChild(b);
    });
}

async function checkAnswer(btn, selected) {
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
    if (selected === 'let age = 10;') {
        btn.style.background = '#27ae60';
        score += 10;
        document.getElementById('score').innerText = 'النقاط: ' + score;
        
        if (Auth.getUserId()) {
            try {
                await firebase.firestore().collection('users').doc(Auth.getUserId()).update({
                    bonusPoints: firebase.firestore.FieldValue.increment(10)
                });
            } catch(e) {}
        }
        
        setTimeout(() => {
            document.getElementById('choicesArea').innerHTML = '';
            const backBtn = document.createElement('button');
            backBtn.className = 'choice-btn';
            backBtn.style.background = 'linear-gradient(135deg, #27ae60, #1e8449)';
            backBtn.innerText = '🎉 مبروك! كسبت 10 نقاط. الرجوع للخريطة';
            backBtn.onclick = () => window.location.href = 'levels.html';
            document.getElementById('choicesArea').appendChild(backBtn);
        }, 1000);
    } else {
        btn.style.background = '#e74c3c';
        setTimeout(() => { document.querySelectorAll('.choice-btn').forEach(b => b.disabled = false); btn.style.background = ''; }, 1000);
    }
}