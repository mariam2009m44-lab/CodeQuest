const Auth = {
    currentUser: null, userData: null,
    init: function(callback) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                const cached = localStorage.getItem('cq_username_' + user.uid);
                if(cached) this.userData = { username: cached };
                try {
                    const doc = await firebase.firestore().collection('users').doc(user.uid).get();
                    if (doc.exists) {
                        this.userData = doc.data();
                        localStorage.setItem('cq_username_' + user.uid, this.userData.username);
                    }
                } catch(e) {}
                if (callback) callback(true);
            } else {
                this.currentUser = null; this.userData = null;
                if (callback) callback(false);
            }
        });
    },
    getUserId: function() { return this.currentUser ? this.currentUser.uid : null; },
    getCurrentUser: function() { return this.userData ? this.userData.username : null; },
    getUserData: function() { return this.userData; },
    isLoggedIn: function() { return this.currentUser !== null; },
    logout: function() { firebase.auth().signOut().then(() => { localStorage.clear(); window.location.href = 'index.html'; }); },
    getAvatarHtml: function(name) {
        name = name || this.getCurrentUser();
        if (!name) return '<div class="letter-avatar">؟</div>';
        const saved = this.userData ? this.userData.avatar : localStorage.getItem('cq_avatar_' + name);
        if (saved) return '<img src="' + saved + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
        const colors = ['#00e5ff,#0072ff', '#27ae60,#1e8449', '#ff9500,#e67e22'];
        return '<div class="letter-avatar" style="background:linear-gradient(135deg,' + colors[name.length % colors.length] + ')">' + name.charAt(0).toUpperCase() + '</div>';
    },
    registerUser: async function(username, password) {
        const email = username.toLowerCase().replace(/\s+/g, '') + '@codequest.app';
        try {
            const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
            await firebase.firestore().collection('users').doc(cred.user.uid).set({
                username: username, email: email, bonusPoints: 0, progress: {}
            });
            return { success: true };
        } catch (error) { return { success: false, message: 'الاسم محجوز أو حدث خطأ.' }; }
    },
    loginUser: async function(username, password) {
        const email = username.toLowerCase().replace(/\s+/g, '') + '@codequest.app';
        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            return { success: true };
        } catch (error) { return { success: false, message: 'البيانات غير صحيحة.' }; }
    }
};