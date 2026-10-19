export const showToast = (message, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colors = { info: '#6554D9', success: '#15803D', error: '#B91C1C', warning: '#F4B740' };
    
    toast.style.cssText = `background:${colors[type]};color:#fff;padding:12px 24px;border-radius:8px;font-family:'Cairo',sans-serif;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.15);opacity:0;transform:translateY(-20px);transition:all 0.3s ease;pointer-events:auto;`;
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

export const showLoader = (btnElement, text = 'جاري التحميل...') => {
    if (!btnElement) return;
    const originalText = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = `<span class="spinner" style="display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin-left:8px;"></span> ${text}`;
    
    return () => {
        btnElement.disabled = false;
        btnElement.innerHTML = originalText;
    };
};