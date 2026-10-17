
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'world-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0'; canvas.style.left = '0';
    canvas.style.width = '100%'; canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.background = 'radial-gradient(circle at center, #0a192f 0%, #050914 100%)';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const chars = '01JS{}()[]=>let const function return'.split('');
    const fontSize = 16;
    const columns = width / fontSize;
    const drops = [];
    for (let x = 0; x < columns; x++) drops[x] = 1;

    function draw() {
        ctx.fillStyle = 'rgba(5, 9, 20, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.font = fontSize + 'px monospace';
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            
            // ألوان متوهجة (سماوي وذهبي)
            if (Math.random() > 0.98) {
                ctx.fillStyle = '#ffd700'; // ذهبي
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ffd700';
            } else {
                ctx.fillStyle = '#00e5ff'; // سماوي
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#00e5ff';
            }
            
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            ctx.shadowBlur = 0;

            if (drops[i] * fontSize > height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }
    setInterval(draw, 50);

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
});
