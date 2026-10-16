document.addEventListener('DOMContentLoaded', () => {
    const enterBtn = document.getElementById('enter-btn');
    const gate = document.getElementById('gate');
    const usernameInput = document.getElementById('username');

    enterBtn.addEventListener('click', () => {
        if (usernameInput.value.trim() === "") {
            alert("من فضلك اكتب اسمك أولاً!");
            return;
        }
        gate.classList.add('open');
        setTimeout(() => {
            alert("أهلاً بك يا " + usernameInput.value + "! جاهز تبدأ مغامرة البرمجة؟");
        }, 1500);
    });
});
