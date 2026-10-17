
document.addEventListener('DOMContentLoaded', () => {
    // إنشاء الخلفية
    const canvas = document.createElement('canvas');
    canvas.id = 'world-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0'; canvas.style.left = '0';
    canvas.style.width = '100%'; canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    // تدرج لوني هادي جداً (أزرق غامق جداً لأسود)
    canvas.style.background = 'radial-gradient(circle at center, #0a192f 0%, #02050a 100%)';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // نقط مضيئة هادية جداً
    const particles = [];
    const particleCount = 30; // عدد قليل جداً عشان ميبقاش مزعج

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.2; // حركة بطيئة جداً
            this.vy = (Math.random() - 0.5) * 0.2;
            this.radius = Math.random() * 1.5 + 0.5;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 229, 255, 0.4)'; // شفافية عالية
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            // خطوط خفيفة جداً
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0, 229, 255, ${0.1 - dist/1500})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }
    animate();
});
