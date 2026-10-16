const SFX = {
    ctx: null,
    init: function() {
        if (!this.ctx) {
            try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
        }
    },
    play: function(freq, duration, type, volume) {
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(volume || 0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch(e) {}
    },
    click: function() { this.play(600, 0.08, 'sine', 0.08); },
    success: function() {
        this.play(523, 0.1, 'sine', 0.12);
        setTimeout(() => this.play(659, 0.1, 'sine', 0.12), 100);
        setTimeout(() => this.play(784, 0.2, 'sine', 0.12), 200);
    },
    error: function() {
        this.play(200, 0.15, 'sawtooth', 0.08);
        setTimeout(() => this.play(150, 0.2, 'sawtooth', 0.08), 120);
    },
    win: function() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((n, i) => setTimeout(() => this.play(n, 0.2, 'sine', 0.15), i * 120));
    },
    lose: function() {
        this.play(400, 0.2, 'triangle', 0.1);
        setTimeout(() => this.play(300, 0.2, 'triangle', 0.1), 150);
        setTimeout(() => this.play(200, 0.4, 'triangle', 0.1), 300);
    },
    flip: function() { this.play(800, 0.05, 'sine', 0.06); },
    pop: function() { this.play(1200, 0.08, 'sine', 0.1); },
    whoosh: function() { this.play(300, 0.15, 'sine', 0.05); }
};

function getHighScore(gameKey) {
    return parseInt(localStorage.getItem('cq_high_' + gameKey) || '0');
}
function setHighScore(gameKey, score) {
    const current = getHighScore(gameKey);
    if (score > current) {
        localStorage.setItem('cq_high_' + gameKey, score);
        return true;
    }
    return false;
}
function playSound(name) {
    if (SFX[name]) SFX[name]();
}
