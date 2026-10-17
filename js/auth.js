const Auth = {
    setSession: function(username) {
        const session = { user: username, expires: Date.now() + (1000 * 60 * 60 * 24) };
        localStorage.setItem('cq_session', JSON.stringify(session));
    },
    getSession: function() {
        try {
            const session = JSON.parse(localStorage.getItem('cq_session'));
            if (!session || Date.now() > session.expires) { localStorage.removeItem('cq_session'); return null; }
            return session;
        } catch(e) { return null; }
    },
    isLoggedIn: function() { return this.getSession() !== null; },
    getCurrentUser: function() { const session = this.getSession(); return session ? session.user : null; },
    logout: function() {
        if (typeof firebase !== 'undefined') {
            firebase.auth().signOut().then(() => { localStorage.clear(); window.location.href = 'index.html'; });
        } else { localStorage.clear(); window.location.href = 'index.html'; }
    },

    getAvatarHtml: function(name) {
        name = name || this.getCurrentUser();
        if (!name) return '<div class="letter-avatar">؟</div>';
        const saved = localStorage.getItem('cq_avatar_' + name);
        if (saved && (saved.indexOf('data:') === 0 || saved.indexOf('http') === 0) && saved.indexOf('dicebear') === -1) {
            return '<img src="' + saved + '" alt="' + name + '">';
        }
        const parts = name.trim().split(/\s+/);
        let initials = parts[0].charAt(0).toUpperCase();
        if (parts[1]) initials += '.' + parts[1].charAt(0).toUpperCase();
        const colors = ['#00e5ff,#0072ff', '#27ae60,#1e8449', '#ff9500,#e67e22', '#9b59b6,#8e44ad', '#e74c3c,#c0392b'];
        return '<div class="letter-avatar" style="background:linear-gradient(135deg,' + colors[name.length % colors.length] + ')">' + initials + '</div>';
    },

    registerUser: async function(username, password) {
        const email = username.toLowerCase().replace(/\s+/g, '') + '@codequest.app';
        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            try {
                await firebase.firestore().collection('users').doc(user.uid).set({
                    username: username, email: email, created: Date.now(), bonusPoints: 0
                });
            } catch (fsError) {
                console.error("Firestore error:", fsError);
            }
            return { success: true };
        } catch (error) {
            console.error("Register Error:", error);
            // هنا بنعرض كود الخطأ الحقيقي عشان نعرف المشكلة
            return { success: false, message: 'كود الخطأ: ' + error.code };
        }
    },

    loginUser: async function(username, password) {
        const email = username.toLowerCase().replace(/\s+/g, '') + '@codequest.app';
        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            return { success: true };
        } catch (error) {
            console.error("Login Error:", error);
            // هنا بنعرض كود الخطأ الحقيقي عشان نعرف المشكلة
            return { success: false, message: 'كود الخطأ: ' + error.code };
        }
    },

    syncData: async function() {
        if (typeof firebase === 'undefined') return;
        const user = firebase.auth().currentUser;
        if (!user) return;
        try {
            const doc = await firebase.firestore().collection('users').doc(user.uid).get();
            if (doc.exists) {
                const data = doc.data();
                const name = data.username || this.getCurrentUser();
                localStorage.setItem('cq_balance_' + name, data.bonusPoints || 0);
                if (data.avatar) localStorage.setItem('cq_avatar_' + name, data.avatar);
                if (data.unlocked) localStorage.setItem('cq_unlocked_' + name + '_js', JSON.stringify(data.unlocked));
            }
        } catch(e) { console.error("Sync Error:", e); }
    }
};
