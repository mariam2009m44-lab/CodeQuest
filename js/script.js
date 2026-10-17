document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { document.getElementById('loader').classList.add('hidden'); setTimeout(() => { document.getElementById('robot').style.opacity = '1'; }, 300); }, 1500);
    const eb = document.getElementById('enter-btn'), ui = document.getElementById('username'), pi = document.getElementById('password'), tb = document.getElementById('toggle-btn'), ft = document.getElementById('form-title');
    let isLogin = true;
    tb.addEventListener('click', () => { isLogin = !isLogin; ft.innerText = isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'; eb.innerText = isLogin ? 'دخول' : 'تسجيل'; tb.innerText = isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخول'; });
    const handleAuth = async () => {
        const u = ui.value.trim(), p = pi.value.trim();
        if (!u || !p) { showAlert('من فضلك املأ الحقول!', true); return; }
        eb.disabled = true; eb.innerText = '...';
        try {
            const res = isLogin ? await Auth.loginUser(u, p) : await Auth.registerUser(u, p);
            if (res.success) { 
                setTimeout(() => { 
                    // لو معندوش أفاتار يروح يختار
                    const hasAvatar = Auth.getUserData() && Auth.getUserData().avatar;
                    window.location.href = hasAvatar ? 'languages.html' : 'avatar.html'; 
                }, 1000); 
            }
            else { showAlert(res.message, true); eb.disabled = false; eb.innerText = isLogin ? 'دخول' : 'تسجيل'; }
        } catch (err) { console.error('REAL ERROR:', err); showAlert(err.message, true); eb.disabled = false; eb.innerText = isLogin ? 'دخول' : 'تسجيل'; }
    };
    eb.addEventListener('click', handleAuth); pi.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAuth(); });
    function showAlert(msg, isError = false) {
        let box = document.getElementById('customAlert');
        if (!box) { box = document.createElement('div'); box.id = 'customAlert'; box.style.cssText = 'position:fixed;top:-100px;left:50%;transform:translateX(-50%);background:rgba(0,229,255,0.9);color:#050914;padding:12px 25px;border-radius:30px;font-weight:bold;z-index:10000;transition:0.5s;'; document.body.appendChild(box); }
        box.innerText = msg; box.style.background = isError ? 'rgba(231,76,60,0.9)' : 'rgba(0,229,255,0.9)'; box.style.color = isError ? '#fff' : '#050914'; box.style.top = '20px';
        setTimeout(() => { box.style.top = '-100px'; }, 3000);
    }
});
