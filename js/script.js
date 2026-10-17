document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { document.getElementById('loader').classList.add('hidden'); setTimeout(() => { document.getElementById('robot').style.opacity = '1'; }, 300); }, 1500);

    const eb = document.getElementById('enter-btn'), ui = document.getElementById('username'), pi = document.getElementById('password'), tb = document.getElementById('toggle-btn'), ft = document.getElementById('form-title');
    let isLogin = true;

    tb.addEventListener('click', () => { isLogin = !isLogin; ft.innerText = isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'; eb.innerText = isLogin ? 'دخول' : 'تسجيل'; tb.innerText = isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخول'; });

    const handleAuth = async () => {
        const u = ui.value.trim(), p = pi.value.trim();
        if (!u || !p) { showAlert('من فضلك املأ جميع الحقول!', true); return; }
        if (u.length < 3) { showAlert('الاسم لازم يكون 3 حروف على الأقل!', true); return; }
        if (p.length < 6) { showAlert('كلمة المرور لازم تكون 6 أحرف على الأقل!', true); return; }
        const englishRegex = /^[a-zA-Z0-9]+$/;
        if (!englishRegex.test(u)) { showAlert('من فضلك استخدم حروف إنجليزية وأرقام بس في الاسم!', true); return; }

        eb.disabled = true; eb.innerText = '...';
        try {
            const res = isLogin ? await Auth.loginUser(u, p) : await Auth.registerUser(u, p);
            if (res.success) {
                if (!isLogin) showAlert('تم إنشاء الحساب بنجاح! 🎉');
                setTimeout(() => { window.location.href = 'languages.html'; }, 1000);
            } else {
                showAlert(res.message, true);
                eb.disabled = false; eb.innerText = isLogin ? 'دخول' : 'تسجيل';
            }
        } catch (err) {
            showAlert('حدث خطأ في الاتصال، تأكد من الإنترنت!', true);
            eb.disabled = false; eb.innerText = isLogin ? 'دخول' : 'تسجيل';
        }
    };

    eb.addEventListener('click', handleAuth);
    pi.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAuth(); });

    function showAlert(msg, isError = false) {
        let alertBox = document.getElementById('customAlert');
        if (!alertBox) {
            alertBox = document.createElement('div'); alertBox.id = 'customAlert';
            alertBox.style.cssText = 'position:fixed;top:-100px;left:50%;transform:translateX(-50%);background:rgba(0,229,255,0.9);color:#050914;padding:12px 25px;border-radius:30px;font-weight:bold;font-size:14px;z-index:10000;transition:top 0.5s ease;box-shadow:0 10px 30px rgba(0,229,255,0.5);text-align:center;min-width:200px;font-family:Cairo,sans-serif;';
            document.body.appendChild(alertBox);
        }
        alertBox.innerText = msg; alertBox.style.background = isError ? 'rgba(231,76,60,0.9)' : 'rgba(0,229,255,0.9)'; alertBox.style.color = isError ? '#fff' : '#050914'; alertBox.style.top = '20px';
        setTimeout(() => { alertBox.style.top = '-100px'; }, 3000);
    }
});
