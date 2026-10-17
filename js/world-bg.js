
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed'; canvas.style.top = '0'; canvas.style.left = '0';
    canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.zIndex = '-1';
    canvas.style.background = 'linear-gradient(135deg, #050914 0%, #0a192f 100%)';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const particles = [];
    for (let i = 0; i < 25; i++) {
        particles.push({ x: Math.random()*width, y: Math.random()*height, vx: (Math.random()-0.5)*0.2, vy: (Math.random()-0.5)*0.2, r: Math.random()*1.5+0.5 });
    }
    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0, 229, 255, 0.2)'; ctx.fill();
            for (let j = i + 1; j < particles.length; j++) {
                let p2 = particles[j]; let dx = p.x - p2.x, dy = p.y - p2.y;
                if (Math.sqrt(dx*dx + dy*dy) < 150) {
                    ctx.beginPath(); ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)'; ctx.lineWidth = 1;
                    ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                }
            }
        }
    }
    animate();
});
