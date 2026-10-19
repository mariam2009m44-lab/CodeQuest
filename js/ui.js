const successSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
const errorSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

export const showToast = (message, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
        document.body.appendChild(container);
    }

    if (type === 'success' && localStorage.getItem('cq_sound') !== 'off') successSound.play().catch(e => {});
    if (type === 'error' && localStorage.getItem('cq_sound') !== 'off') errorSound.play().catch(e => {});

    const toast = document.createElement('div');
    const colors = { info: '#6554D9', success: '#35D6A3', error: '#FF6B6B', warning: '#FFCB57' };
    
    toast.style.cssText = `background:${colors[type]};color:#050B1F;padding:12px 24px;border-radius:8px;font-family:'Cairo',sans-serif;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,0.15);opacity:0;transform:translateY(-20px);transition:all 0.3s ease;pointer-events:auto;text-align:center;`;
    toast.textContent = message;
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
