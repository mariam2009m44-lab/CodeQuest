/* Shared level progress for the existing quiz, speed, bug and build games:
   stars per level (saved on this device), locked levels that open as you clear the previous one,
   level badges and a result badge. It only reads each game's own state and result screen. */
(function () {
  const game = document.body && document.body.dataset.cqGame;
  if (!game) return;
  const ORDER = ['easy', 'medium', 'hard'];
  const key = lvl => 'codequest-' + game + '-stars-' + lvl;
  const stars = lvl => Number(localStorage.getItem(key(lvl))) || 0;
  const starHtml = n => '★'.repeat(n) + '<span class="off">' + '★'.repeat(3 - n) + '</span>';
  const g = name => { try { return (0, eval)('typeof ' + name + ' !== "undefined" ? ' + name + ' : undefined'); } catch (e) { return undefined; } };

  function perfect(n, per) { let t = 0; for (let k = 1; k <= n; k++) t += per(k); return t; }
  function earnedStars() {
    if(game==='speed'){const rows=g('reviews')||[],total=(g('currentQs')||[]).length||6;const ratio=rows.filter(r=>r.correct).length/total;return ratio>=0.8?3:ratio>=0.6?2:0;}
    if (game === 'bug' || game === 'build') { const a = g('attempts') || 0; return a === 0 ? 3 : a <= 2 ? 2 : 1; }
    const n = (g('currentQs') || []).length || 10, score = g('score') || 0;
    const per = game === 'quiz' ? k => 10 + 2 * k : k => 10 + Math.min(2 * k, 10);
    const ratio = score / perfect(n, per), hi = game === 'quiz' ? 0.8 : 0.55, mid = game === 'quiz' ? 0.5 : 0.3, lo = game === 'quiz' ? 0.2 : 0.1;
    return ratio >= hi ? 3 : ratio >= mid ? 2 : ratio >= lo ? 1 : 0;
  }

  function renderLevels() {
    ORDER.forEach((lvl, i) => {
      const btn = document.querySelector(".lvl-btn[onclick*=\"'" + lvl + "'\"]");
      if (!btn) return;
      btn.dataset.cqLevel = lvl;
      const open = i === 0 || stars(ORDER[i - 1]) > 0;
      btn.disabled = !open;
      let badge = btn.querySelector('.cq-badge');
      if (!badge) { badge = document.createElement('img'); badge.className = 'cq-badge'; badge.alt = ''; badge.width = 40; badge.height = 40; badge.src = 'assets/games/badges/' + lvl + '.svg'; btn.prepend(badge); }
      let s = btn.querySelector('.cq-stars');
      if (!s) { s = document.createElement('span'); s.className = 'cq-stars'; btn.appendChild(s); }
      s.innerHTML = open ? starHtml(stars(lvl)) : '<span class="cq-lock">أنهِ المستوى السابق لفتحه</span>';
    });
  }

  function onResult() {
    const lvl = g('currentLevel');
    if (!ORDER.includes(lvl)) return;
    const earned = earnedStars();
    if (earned > stars(lvl)) { localStorage.setItem(key(lvl), String(earned)); window.dispatchEvent(new CustomEvent('cq-stars-changed', { detail: { game, level: lvl, stars: earned } })); }
    const card = document.getElementById('resultScreen');
    let el = card.querySelector('.cq-result-stars');
    if (!el) {
      el = document.createElement('div'); el.className = 'cq-stars cq-result-stars'; el.setAttribute('role', 'img');
      const anchor = document.getElementById('resultEmoji'); anchor.parentNode.insertBefore(el, anchor.nextSibling);
    }
    el.innerHTML = starHtml(earned); el.setAttribute('aria-label', earned + ' من 3 نجوم');
    const emoji = document.getElementById('resultEmoji');
    emoji.innerHTML = '<img class="cq-result-badge" alt="" width="84" height="84" src="assets/games/badges/' + (earned === 3 ? 'win' : earned === 2 ? 'star' : 'try') + '.svg">';
    renderLevels();
  }

  const res = document.getElementById('resultScreen');
  if (res) new MutationObserver(() => { if (res.classList.contains('active') && !res.dataset.cqDone) { res.dataset.cqDone = '1'; onResult(); } else if (!res.classList.contains('active')) delete res.dataset.cqDone; })
    .observe(res, { attributes: true, attributeFilter: ['class'] });
  const realStart = window.startGame;
  if (typeof realStart === 'function') window.startGame = function (lvl) {
    const i = ORDER.indexOf(lvl);
    if (i > 0 && stars(ORDER[i - 1]) === 0) return;
    return realStart.apply(this, arguments);
  };
  renderLevels();
})();
