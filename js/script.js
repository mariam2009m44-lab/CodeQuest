document.addEventListener('DOMContentLoaded', () => {
    const eb = document.getElementById('enter-btn'), ui = document.getElementById('username'), pi = document.getElementById('password');
    eb.addEventListener('click', async () => {
        const u = ui.value.trim(), p = pi.value.trim();
        if(!u || !p) { alert('املأ الحقول!'); return; }
        eb.innerText = '...'; eb.disabled = true;
        const res = await Auth.loginUser(u, p);
        if(res.success) { window.location.href = 'languages.html'; }
        else { alert(res.message); eb.innerText = 'دخول'; eb.disabled = false; }
    });
});