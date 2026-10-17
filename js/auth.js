const Auth = {
    currentUser: null,
    userData: null,

    init: function(callback) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                await this.loadUserData(user.uid);
                if (callback) callback(true);
            } else {
                this.currentUser = null;
                this.userData = null;
                if (callback) callback(false);
            }
        });
    },

    loadUserData: async function(uid) {
        try {
            const doc = await firebase.firestore().collection('users').doc(uid).get();
            if (doc.exists) {
                this.userData = doc.data();
                localStorage.setItem('cq_session', JSON.stringify({ uid: uid, username: doc.data().username }));
            } else {
                console.error("User document not found");
            }
        } catch (e) {
            console.error("Error loading user data:", e);
        }
    },

    getUserId: function() { return this.currentUser ? this.currentUser.uid : null; },
    getCurrentUser: function() { return this.userData ? this.userData.username : (this.currentUser ? this.currentUser.email : null); },
    getUserData: function() { return this.userData; },
    isLoggedIn: function() { return this.currentUser !== null; },

    logout: function() {
        firebase.auth().signOut().then(() => {
            localStorage.removeItem('cq_session');
            window.location.href = 'index.html';
        });
    },

    getAvatarHtml: function(name) {
        name = name || this.getCurrentUser();
        if (!name) return '<div class="letter-avatar">؟</div>';
        const saved = this.userData ? this.userData.avatar : localStorage.getItem('cq_avatar_' + name);
        if (saved) return '<img src="' + saved + '" alt="' + name + '" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">';
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
            await firebase.firestore().collection('users').doc(user.uid).set({
                username: username, email: email, created: Date.now(),
                bonusPoints: 0, xp: 0, coins: 0, owned: {}, equipped: {}, progress: {}
            });
            return { success: true };
        } catch (error) {
            console.error("Register Error:", error);
            return { success: false, message: 'حدث خطأ أثناء التسجيل. جرب اسم مستخدم آخر أو تحقق من اتصالك.' };
        }
    },

    loginUser: async function(username, password) {
        const email = username.toLowerCase().replace(/\s+/g, '') + '@codequest.app';
        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            return { success: true };
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
        }
    }
};
