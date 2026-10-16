document.addEventListener('DOMContentLoaded',()=>{
setTimeout(()=>{document.getElementById('loader').classList.add('hidden');setTimeout(()=>{document.getElementById('robot').style.opacity='1'},300)},1500);
const pc=document.getElementById('particles');
const syms=['</>','{ }','=>','()',';','if()','++','[]','&&','||'];
setInterval(()=>{const p=document.createElement('div');p.classList.add('particle');p.innerText=syms[Math.floor(Math.random()*syms.length)];p.style.left=Math.random()*100+'vw';p.style.top=Math.random()*100+'vh';p.style.fontSize=(Math.random()*20+15)+'px';pc.appendChild(p);setTimeout(()=>{p.style.transition='transform 5s ease-out, opacity 5s ease-out';p.style.transform='translateY(-300px) translateX('+((Math.random()-0.5)*100)+'px)';p.style.opacity='0';setTimeout(()=>p.remove(),5000)},50)},300);

function showAlert(msg, isError = false) {
    const alertBox = document.getElementById('customAlert');
    alertBox.innerText = msg;
    alertBox.className = 'custom-alert show' + (isError ? ' error' : '');
    setTimeout(() => { alertBox.classList.remove('show'); }, 3000);
}

const eb=document.getElementById('enter-btn'),gate=document.getElementById('gate'),ui=document.getElementById('username'),pi=document.getElementById('password'),lb=document.getElementById('loginBox'),tb=document.getElementById('toggle-btn'),ft=document.getElementById('form-title'),robot=document.getElementById('robot'),mascot=document.getElementById('mascot');
let isLogin=true;

ui.addEventListener('input', () => { gsap.to(mascot, { scale: 1.15, duration: 0.1, yoyo: true, repeat: 1 }); });

window.robotJoke = function() {
    const jokes = ["مرحباً! أنا كودي، جاهز نتعلم برمجة؟ 😄","ليه المبرمج بيحب القهوة؟ عشان الكود بيحتاج Java! ☕","إيه أطول حاجة في الدنيا؟ كود مفيش فيه تعليق! 😂","مرحباً! جاهز تكتب أول سطر كود؟ 👨‍💻"];
    const bubble = document.getElementById('speechBubble');
    bubble.innerText = jokes[Math.floor(Math.random() * jokes.length)];
    bubble.classList.add('show');
    gsap.fromTo(mascot, { y: 0 }, { y: -20, duration: 0.2, yoyo: true, repeat: 3 });
    setTimeout(() => bubble.classList.remove('show'), 3000);
};

tb.addEventListener('click',()=>{isLogin=!isLogin;ft.innerText=isLogin?'تسجيل الدخول':'إنشاء حساب جديد';eb.innerText=isLogin?'دخول':'تسجيل';tb.innerText=isLogin?'ليس لديك حساب؟ سجل الآن':'لديك حساب بالفعل؟ سجل دخول'});

eb.addEventListener('click', async ()=>{
    const u=ui.value.trim(),p=pi.value.trim();
    if(!u||!p){ gsap.fromTo(mascot, { x: -10 }, { x: 10, duration: 0.1, repeat: 5, yoyo: true }); showAlert('من فضلك املأ جميع الحقول!', true); return; }
    if(u.length < 3){ showAlert('الاسم لازم يكون 3 حروف على الأقل!', true); return; }
    if(p.length < 4){ showAlert('كلمة المرور لازم تكون 4 أحرف على الأقل!', true); return; }

    const lockStatus = Auth.checkLockout(u);
    if (lockStatus.locked) {
        showAlert('الحساب مقفول! استني ' + lockStatus.remaining + ' ثانية وحاول تاني.', true);
        return;
    }

    eb.disabled = true;
    eb.innerText = '...';

    try {
        const hashedPassword = await Auth.hashPassword(p);
        let users = Auth.getUsers();

        if(isLogin){
            if(users[u] && users[u].password === hashedPassword){
                Auth.clearFailedAttempts(u);
                Auth.createSession(u);
                startGame(u);
            } else {
                Auth.recordFailedAttempt(u);
                gsap.fromTo(mascot, { x: -10 }, { x: 10, duration: 0.1, repeat: 5, yoyo: true });
                showAlert('اسم المستخدم أو كلمة المرور غير صحيحة!', true);
                eb.disabled = false;
                eb.innerText = 'دخول';
            }
        } else {
            if(users[u]){
                showAlert('اسم المستخدم موجود بالفعل! جرب تسجيل الدخول.', true);
                eb.disabled = false;
                eb.innerText = 'تسجيل';
            } else {
                users[u] = { password: hashedPassword, created: Date.now() };
                Auth.saveUsers(users);
                Auth.createSession(u);
                showAlert('تم إنشاء الحساب بنجاح! 🎉');
                startGame(u);
            }
        }
    } catch(e) {
        showAlert('حصل خطأ، جرب تاني!', true);
        eb.disabled = false;
        eb.innerText = isLogin ? 'دخول' : 'تسجيل';
    }
});

function startGame(u){
    try {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00e5ff', '#0072ff', '#ffffff'] });
    } catch(e) {}
    lb.style.opacity='0';
    lb.style.transform='scale(0.5)';
    robot.style.opacity='0';
    gate.classList.add('open');
    setTimeout(()=>{
        window.location.href = localStorage.getItem('cq_avatar_' + u) ? 'languages.html' : 'avatar.html';
    }, 1500);
}
});
