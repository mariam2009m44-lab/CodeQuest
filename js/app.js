
export const App = {
    user: 'بطل',
    xp: 0,
    coins: 500,

    init() {
        this.loadState();
        this.updateUI();
        this.setupToasts();
        this.highlightNav();
        console.log('✅ Cody Academy Engine Initialized');
    },

    loadState() {
        this.user = localStorage.getItem('cq_user') || 'بطل';
        let xp = parseInt(localStorage.getItem('cq_xp')) || 0;
        let coins = parseInt(localStorage.getItem('cq_coins')) || 500;
        this.xp = isNaN(xp) ? 0 : xp;
        this.coins = isNaN(coins) ? 500 : coins;
    },

    updateUI() {
        document.querySelectorAll('.js-user-name').forEach(el => el.innerText = this.user);
        document.querySelectorAll('.js-user-xp').forEach(el => el.innerText = this.xp);
        document.querySelectorAll('.js-user-coins').forEach(el => el.innerText = this.coins);
    },

    addXP(amount) {
        this.xp += amount;
        localStorage.setItem('cq_xp', this.xp);
        this.updateUI();
        this.showToast(`+${amount} XP! أحسنت!`, 'success');
    },

    addCoins(amount) {
        this.coins += amount;
        localStorage.setItem('cq_coins', this.coins);
        this.updateUI();
    },

    setupToasts() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    },

    showToast(message, type = 'info') {
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    highlightNav() {
        const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
        document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
