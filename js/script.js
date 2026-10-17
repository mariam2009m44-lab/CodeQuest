document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{document.getElementById('loader').classList.add('hidden');setTimeout(()=>{document.getElementById('robot').style.opacity='1'},300)},1500);
    
    const pc=document.getElementById('particles');
    const syms=['</>','{ }','=>','()',';','if()','++','[]','&&','||'];
    setInterval(()=>{const p=document.createElement('div');p.classList.add('particle');p.innerText=syms[Math.floor(Math.random()*syms.length)];p.style.left=Math.random()*100+'vw';p.style.top=Math.random()*100+'vh';p.style.fontSize=(Math.random()*20+15)+'px';pc.appendChild(p);setTimeout(()=>{p.style.transition='transform 5s ease-out, opacity 5s ease-out';p.style.transform='translateY(-300px) translateX('+((Math.random()-0.5)*100)+'px)';p.style.opacity='0';setTimeout(()=>p.remove(),5000)},50)},300);

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
        
        if(!u || !p){ 
            gsap.fromTo(mascot, { x: -10 }, { x: 10, duration: 0.1, repeat: 5, yoyo: true }); 
            showAlert('من فضلك املأ جميع الحقول!', true); 
            return; 
        }
        if(u.length < 3){ showAlert('الاسم لازم يكون 3 حروف على الأقل!', true); return; }
        if(p.length < 6){ showAlert('كلمة المرور لازم تكون 6 أحرف على الأقل!', true); return; }

        eb.disabled = true;
        eb.innerText = '...';

        try {
            if(isLogin) {
                const res = await Auth.loginUser(u, p);
                if(res.success) {
                    Auth.setSession(u);
                    startGame(u);
                } else {
                    gsap.fromTo(mascot, { x: -10 }, { x: 10, duration: 0.1, repeat: 5, yoyo: true });
                    showAlert(res.message, true);
                    eb.disabled = false;
                    eb.innerText = 'دخول';
                }
            } else {
                const res = await Auth.registerUser(u, p);
                if(res.success) {
                    Auth.setSession(u);
                    showAlert('تم إنشاء الحساب بنجاح! 🎉');
                    startGame(u);
                } else {
                    showAlert(res.message, true);
                    eb.disabled = false;
                    eb.innerText = 'تسجيل';
                }
            }
        } catch(err) {
            showAlert('حدث خطأ في الاتصال، تأكد من الإنترنت!', true);
            eb.disabled = false;
            eb.innerText = isLogin ? 'دخول' : 'تسجيل';
        }
    });

    function startGame(u){
        try { confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#00e5ff', '#0072ff', '#ffffff'] }); } catch(e) {}
        lb.style.opacity='0'; lb.style.transform='scale(0.5)'; robot.style.opacity='0'; gate.classList.add('open');
        setTimeout(()=>{ window.location.href = 'languages.html'; }, 1500);
    }

    function showAlert(msg, isError = false) {
        let alertBox = document.getElementById('customAlert');
        if(!alertBox) {
            alertBox = document.createElement('div');
            alertBox.id = 'customAlert';
            alertBox.style.cssText = 'position:fixed;top:-100px;left:50%;transform:translateX(-50%);background:rgba(0,229,255,0.9);color:#050914;padding:12px 25px;border-radius:30px;font-weight:bold;font-size:14px;z-index:10000;transition:top 0.5s ease;box-shadow:0 10px 30px rgba(0,229,255,0.5);text-align:center;min-width:200px;font-family:Cairo,sans-serif;';
            document.body.appendChild(alertBox);
        }
        alertBox.innerText = msg;
        alertBox.style.background = isError ? 'rgba(231,76,60,0.9)' : 'rgba(0,229,255,0.9)';
        alertBox.style.color = isError ? '#fff' : '#050914';
        alertBox.style.top = '20px';
        setTimeout(() => { alertBox.style.top = '-100px'; }, 3000);
    }
});
