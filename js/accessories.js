const Accessories = {
    items: {
        crown_bronze: { icon: '🎖️', type: 'crown' },
        crown_silver: { icon: '🥈', type: 'crown' },
        crown_gold: { icon: '👑', type: 'crown' },
        crown_diamond: { icon: '💎', type: 'crown' },
        theme_ocean: { color: '#00e5ff', type: 'theme' },
        theme_sunset: { color: '#ff9500', type: 'theme' },
        theme_forest: { color: '#27ae60', type: 'theme' },
        theme_night: { color: '#9b59b6', type: 'theme' },
        pet_cat: { icon: '🐱', type: 'pet' },
        pet_dog: { icon: '🐶', type: 'pet' },
        pet_dragon: { icon: '🐉', type: 'pet' },
        pet_unicorn: { icon: '🦄', type: 'pet' },
        effect_stars: { icon: '⭐', type: 'effect' },
        effect_fire: { icon: '🔥', type: 'effect' },
        effect_lightning: { icon: '⚡', type: 'effect' },
        effect_rainbow: { icon: '🌈', type: 'effect' },
        title_rookie: { label: '🌱 مبتدئ', type: 'title' },
        title_smart: { label: '🧠 ذكي', type: 'title' },
        title_hero: { label: '🦸 بطل', type: 'title' },
        title_legend: { label: '🌟 أسطورة', type: 'title' }
    },

    getEquipped: function() {
        const user = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
        if (!user) return {};
        try { return JSON.parse(localStorage.getItem('cq_equipped_' + user) || '{}'); }
        catch(e) { return {}; }
    },

    getTitle: function() {
        const eq = this.getEquipped();
        if (eq.title && this.items[eq.title]) return this.items[eq.title].label;
        return null;
    },

    render: function() {
        this.renderAvatars();
        const eq = this.getEquipped();
        const selectors = ['.top-avatar', '.mini-avatar', '.avatar-wrap'];
        
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(wrapper => {
                wrapper.querySelectorAll('.acc-crown, .acc-pet, .acc-effect').forEach(e => e.remove());
                wrapper.classList.add('avatar-with-acc');

                if (eq.crown && this.items[eq.crown]) {
                    const c = document.createElement('div');
                    c.className = 'acc-crown';
                    c.innerText = this.items[eq.crown].icon;
                    wrapper.appendChild(c);
                }
                if (eq.pet && this.items[eq.pet]) {
                    const p = document.createElement('div');
                    p.className = 'acc-pet';
                    p.innerText = this.items[eq.pet].icon;
                    wrapper.appendChild(p);
                }
                if (eq.effect && this.items[eq.effect]) {
                    const e = document.createElement('div');
                    e.className = 'acc-effect';
                    e.innerText = this.items[eq.effect].icon;
                    wrapper.appendChild(e);
                }
            });
        });

        if (eq.theme && this.items[eq.theme] && this.items[eq.theme].color) {
            document.body.style.backgroundImage = 'radial-gradient(circle at 50% 0%, ' + this.items[eq.theme].color + '33 0%, transparent 60%)';
        }

        const title = this.getTitle();
        document.querySelectorAll('.user-title').forEach(el => {
            if (title) {
                el.innerText = title;
                el.style.display = 'inline-block';
            } else {
                el.style.display = 'none';
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() { Accessories.render(); }, 300);
});


Accessories.renderAvatars = function() {
    const selectors = ['.top-avatar', '.mini-avatar', '.avatar-wrap'];
    const user = Auth.getCurrentUser();
    if (!user) return;
    const avatarHtml = Auth.getAvatarHtml(user);
    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(wrapper => {
            const existingImg = wrapper.querySelector('img');
            const existingLetter = wrapper.querySelector('.letter-avatar');
            if (!existingImg && !existingLetter) {
                wrapper.insertAdjacentHTML('afterbegin', avatarHtml);
            } else if (existingImg && avatarHtml.indexOf('<div') === 0) {
                existingImg.remove();
                wrapper.insertAdjacentHTML('afterbegin', avatarHtml);
            }
        });
    });
};
