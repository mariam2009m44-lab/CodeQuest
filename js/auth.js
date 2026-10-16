const Auth = {
    hashPassword: async function(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + "CQ_Salt_2024");
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    },
    getUsers: function() {
        try { return JSON.parse(localStorage.getItem('cq_users')) || {}; } catch(e) { return {}; }
    },
    saveUsers: function(users) {
        localStorage.setItem('cq_users', JSON.stringify(users));
    },
    createSession: function(username) {
        const session = {
            user: username,
            token: crypto.randomUUID(),
            expires: Date.now() + (1000 * 60 * 60 * 2)
        };
        localStorage.setItem('cq_session', JSON.stringify(session));
    },
    getSession: function() {
        try {
            const session = JSON.parse(localStorage.getItem('cq_session'));
            if (!session || Date.now() > session.expires) {
                localStorage.removeItem('cq_session');
                return null;
            }
            return session;
        } catch(e) { return null; }
    },
    isLoggedIn: function() {
        return this.getSession() !== null;
    },
    getCurrentUser: function() {
        const session = this.getSession();
        return session ? session.user : null;
    },
    logout: function() {
        localStorage.removeItem('cq_session');
        window.location.href = 'index.html';
    },
    checkLockout: function(username) {
        try {
            const lockouts = JSON.parse(localStorage.getItem('cq_lockouts')) || {};
            const data = lockouts[username];
            if (!data) return { locked: false };
            if (data.lockedUntil && Date.now() < data.lockedUntil) {
                return { locked: true, remaining: Math.ceil((data.lockedUntil - Date.now()) / 1000) };
            }
            if (data.lockedUntil && Date.now() >= data.lockedUntil) {
                delete lockouts[username];
                localStorage.setItem('cq_lockouts', JSON.stringify(lockouts));
            }
            return { locked: false };
        } catch(e) { return { locked: false }; }
    },
    recordFailedAttempt: function(username) {
        const lockouts = JSON.parse(localStorage.getItem('cq_lockouts')) || {};
        if (!lockouts[username]) lockouts[username] = { attempts: 0 };
        lockouts[username].attempts++;
        if (lockouts[username].attempts >= 5) {
            lockouts[username].lockedUntil = Date.now() + (1000 * 60 * 5);
            lockouts[username].attempts = 0;
        }
        localStorage.setItem('cq_lockouts', JSON.stringify(lockouts));
    },
    clearFailedAttempts: function(username) {
        const lockouts = JSON.parse(localStorage.getItem('cq_lockouts')) || {};
        delete lockouts[username];
        localStorage.setItem('cq_lockouts', JSON.stringify(lockouts));
    }
};

Auth.getAvatar = function() {
    const user = this.getCurrentUser();
    if (!user) return 'https://api.dicebear.com/7.x/adventurer/svg?seed=guest&backgroundColor=b6e3f4&radius=50';
    return localStorage.getItem('cq_avatar_' + user) || ('https://api.dicebear.com/7.x/adventurer/svg?seed=' + user + '&backgroundColor=b6e3f4&radius=50');
};


Auth.getAvatarUrl = function(name) {
    name = name || this.getCurrentUser();
    if (!name) return "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23374151'/%3E%3Ccircle cx='50' cy='38' r='14' fill='%2394a3b8'/%3E%3Cpath d='M20 90 Q50 55 80 90 Z' fill='%2394a3b8'/%3E%3C/svg%3E";
    const saved = localStorage.getItem('cq_avatar_' + name);
    if (saved && saved !== 'none' && saved !== 'skip' && saved.indexOf('dicebear') === -1) return saved;
    return "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23374151'/%3E%3Ccircle cx='50' cy='38' r='14' fill='%2394a3b8'/%3E%3Cpath d='M20 90 Q50 55 80 90 Z' fill='%2394a3b8'/%3E%3C/svg%3E";
};


Auth.getAvatarUrl = function(name) {
    name = name || this.getCurrentUser();
    if (!name) return Auth.PLACEHOLDER;
    const saved = localStorage.getItem('cq_avatar_' + name);
    if (saved) return saved;
    return Auth.PLACEHOLDER;
};

Auth.PLACEHOLDER = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23374151'/%3E%3Ccircle cx='50' cy='38' r='14' fill='%2394a3b8'/%3E%3Cpath d='M20 90 Q50 55 80 90 Z' fill='%2394a3b8'/%3E%3C/svg%3E";

Auth.getAvatarHtml = function(name) {
    name = name || this.getCurrentUser();
    if (!name) return '<div class="letter-avatar">؟</div>';
    const saved = localStorage.getItem('cq_avatar_' + name);
    if (saved && saved.indexOf('data:') === 0 || (saved && saved.indexOf('http') === 0)) {
        return '<img src="' + saved + '" alt="' + name + '">';
    }
    const parts = name.trim().split(/\s+/);
    let initials = parts[0].charAt(0).toUpperCase();
    if (parts[1]) initials += '.' + parts[1].charAt(0).toUpperCase();
    const colors = ['#00e5ff,#0072ff', '#27ae60,#1e8449', '#ff9500,#e67e22', '#9b59b6,#8e44ad', '#e74c3c,#c0392b'];
    const color = colors[name.length % colors.length];
    return '<div class="letter-avatar" style="background:linear-gradient(135deg,' + color + ')">' + initials + '</div>';
};
