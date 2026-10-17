const Auth = {
    // حفظ الجلسة محلياً عشان الصفحات تقرأ الاسم بسرعة
    setSession: function(username) {
        const session = {
            user: username,
            expires: Date.now() + (1000 * 60 * 60 * 24) // 24 ساعة
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

    isLoggedIn: function() { return this.getSession() !== null; },
    
    getCurrentUser: function() {
        const session = this.getSession();
        return session ? session.user : null;
    },

    logout: function() {
        if (typeof firebase !== 'undefined') {
            firebase.auth().signOut().then(() => {
                localStorage.removeItem('cq_session');
                window.location.href = 'index.html';
            });
        } else {
            localStorage.removeItem('cq_session');
            window.location.href = 'index.html';
        }
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
        const color = colors[name.length % colors.length];
        return '<div class="letter-avatar" style="background:linear-gradient(135deg,' + color + ')">' + initials + '</div>';
    },

    // دوال Firebase الجديدة
    registerUser: async function(username, password) {
        const email = username.toLowerCase().replace(/\s+/g, '') + '@codequest.app';
        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // حفظ بيانات إضافية في Firestore
            await firebase.firestore().collection('users').doc(user.uid).set({
                username: username,
                email: email,
                created: Date.now(),
                bonusPoints: 0
            });
            return { success: true };
        } catch (error) {
            console.error("Register Error:", error);
            if (error.code === 'auth/email-already-in-use') {
                return { success: false, message: 'اسم المستخدم ده محجوز، جرب اسم تاني!' };
            }
            return { success: false, message: 'حدث خطأ أثناء التسجيل، جرب تاني.' };
        }
    },

    loginUser: async function(username, password) {
        const email = username.toLowerCase().replace(/\s+/g, '') + '@codequest.app';
        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            return { success: true };
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة!' };
        }
    },

    // جلب بيانات المستخدم من Firestore (النقاط والمكافآت)
    getUserData: async function() {
        if (typeof firebase === 'undefined') return null;
        const user = firebase.auth().currentUser;
        if (!user) return null;
        try {
            const doc = await firebase.firestore().collection('users').doc(user.uid).get();
            if (doc.exists) {
                return doc.data();
            }
            return null;
        } catch(e) { return null; }
    }
};
