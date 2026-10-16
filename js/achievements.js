/* ============================================
   CodeQuest - Achievements System
   ============================================ */

const Achievements = {
    all: [
        { id: 'first_level', name: 'البداية الموفقة', desc: 'خلصت أول مستوى!', icon: '🌟', check: (s) => s.levelsCompleted >= 1 },
        { id: 'two_levels', name: 'مشوار الألف ميل', desc: 'خلصت مستويين!', icon: '🚀', check: (s) => s.levelsCompleted >= 2 },
        { id: 'three_levels', name: 'النصف الأول', desc: 'خلصت 3 مستويات!', icon: '🔥', check: (s) => s.levelsCompleted >= 3 },
        { id: 'all_levels', name: 'بطل المنصة', desc: 'خلصت كل المستويات!', icon: '👑', check: (s) => s.levelsCompleted >= 5 },
        { id: 'first_perfect', name: 'درجة كاملة', desc: 'جاوبت على كل الأسئلة صح!', icon: '💯', check: (s) => s.lastPerfect === true },
        { id: 'score_50', name: 'خمسين نقطة', desc: 'جمعت 50 نقطة!', icon: '🥉', check: (s) => s.totalScore >= 50 },
        { id: 'score_100', name: 'مية نقطة', desc: 'جمعت 100 نقطة!', icon: '🥈', check: (s) => s.totalScore >= 100 },
        { id: 'score_300', name: 'تلاتمية نقطة', desc: 'جمعت 300 نقطة!', icon: '🥇', check: (s) => s.totalScore >= 300 },
        { id: 'first_purchase', name: 'أول شروة', desc: 'اشتريت حاجة من المتجر!', icon: '🛒', check: (s) => s.ownedItems >= 1 },
        { id: 'multi_lang', name: 'متعدد اللغات', desc: 'جربت أكتر من لغة!', icon: '🌍', check: (s) => s.langsTried >= 2 },
        { id: 'daily_done', name: 'تحدي اليوم', desc: 'خلّصت التحدي اليومي!', icon: '🔥', check: (s) => s.dailyDone === true },
        { id: 'game_played', name: 'لاعب ماهر', desc: 'لعبت أول لعبة!', icon: '🎮', check: (s) => s.gamesPlayed >= 1 }
    ],

    notifyQueue: [],
    isShowing: false,

    getUnlockedKey: function() {
        const user = Auth.getCurrentUser();
        return 'cq_achievements_' + user;
    },

    getUnlocked: function() {
        try { return JSON.parse(localStorage.getItem(this.getUnlockedKey()) || '[]'); }
        catch(e) { return []; }
    },

    saveUnlocked: function(list) {
        localStorage.setItem(this.getUnlockedKey(), JSON.stringify(list));
    },

    getStats: function() {
        const user = Auth.getCurrentUser();
        if (!user) return {};
        const langs = ['js', 'py', 'cpp'];
        let levelsCompleted = 0;
        let langsTried = 0;
        langs.forEach(lang => {
            const prog = JSON.parse(localStorage.getItem('cq_unlocked_' + user + '_' + lang) || '{}');
            let done = 0;
            for (let i = 1; i <= 5; i++) {
                const doneKey = 'cq_done_' + user + '_' + lang + '_level' + i;
                if (localStorage.getItem(doneKey) === 'true') done++;
            }
            if (done > 0) langsTried++;
            levelsCompleted += done;
        });
        const totalScore = parseInt(localStorage.getItem('cq_balance_' + user) || '0');
        const owned = JSON.parse(localStorage.getItem('cq_owned_' + user) || '{}');
        const ownedItems = Object.keys(owned).length;
        const dailyKey = 'cq_daily_' + user;
        const dailyData = JSON.parse(localStorage.getItem(dailyKey) || '{}');
        const today = new Date().toDateString();
        const dailyDone = dailyData.date === today;
        const gamesPlayed = parseInt(localStorage.getItem('cq_games_count_' + user) || '0');
        return {
            levelsCompleted, totalScore, ownedItems, langsTried, dailyDone, gamesPlayed,
            lastPerfect: false
        };
    },

    check: function(extraStats) {
        const stats = Object.assign(this.getStats(), extraStats || {});
        const unlocked = this.getUnlocked();
        const newOnes = [];
        this.all.forEach(a => {
            if (unlocked.indexOf(a.id) === -1 && a.check(stats)) {
                unlocked.push(a.id);
                newOnes.push(a);
            }
        });
        if (newOnes.length > 0) {
            this.saveUnlocked(unlocked);
            newOnes.forEach(a => this.notifyQueue.push(a));
            this.showNext();
        }
        return newOnes;
    },

    showNext: function() {
        if (this.isShowing || this.notifyQueue.length === 0) return;
        this.isShowing = true;
        const a = this.notifyQueue.shift();
        const self = this;
        const overlay = document.createElement('div');
        overlay.className = 'achievement-overlay';
        overlay.innerHTML = 
            '<div class="achievement-card">' +
                '<div class="achievement-glow"></div>' +
                '<div class="achievement-icon">' + a.icon + '</div>' +
                '<div class="achievement-title">إنجاز جديد!</div>' +
                '<div class="achievement-name">' + a.name + '</div>' +
                '<div class="achievement-desc">' + a.desc + '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('show'), 50);
        try { if (typeof playSound === 'function') playSound('win'); } catch(e) {}
        try { if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 90, origin: { y: 0.5 }, colors: ['#ffd700', '#00e5ff', '#27ae60', '#ffffff'] }); } catch(e) {}
        setTimeout(() => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                self.isShowing = false;
                self.showNext();
            }, 400);
        }, 2800);
    }
};
