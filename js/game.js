function initGame() {
    const chatArea = document.getElementById('chatArea');
    document.getElementById('levelInfo').innerText = 'المستوى الأول: المتغيرات';
    
    function addMsg(text, isCode) {
        const div = document.createElement('div');
        div.className = isCode ? 'chat-row code-bubble' : 'chat-row cody-bubble';
        div.innerText = text;
        chatArea.appendChild(div);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    addMsg('أهلاً بك يا ' + Auth.getCurrentUser() + '! اليوم سنتعلم المتغيرات.', false);
    addMsg('let name = "أحمد";', true);

    window.nextStep = async function() {
        const btn = document.getElementById('nextBtn');
        btn.innerText = 'جاري الحفظ...'; btn.disabled = true;
        
        if (Auth.getUserId()) {
            try {
                await firebase.firestore().collection('users').doc(Auth.getUserId()).update({
                    bonusPoints: firebase.firestore.FieldValue.increment(10)
                });
                addMsg('أحسنت! لقد أتممت الدرس وربحت 10 نقاط.', false);
                btn.innerText = 'العودة للخريطة';
                btn.onclick = () => window.location.href = 'levels.html';
            } catch(e) { btn.innerText = 'حدث خطأ'; }
        }
    };
}