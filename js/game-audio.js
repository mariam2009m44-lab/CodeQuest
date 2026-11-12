(() => {
  "use strict";
  if (window.CodeQuestAudio) return;
  const SCRIPT_URL = document.currentScript?.src || new URL("js/game-audio.js", location.href).href;
  const SOUND_KEY = "cq_sound";
  const MUSIC_KEY = "cq_music";
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let context = null, soundEnabled = false, musicEnabled = false, musicTimer = null, dock = null, balanceNode = null;
  const read = key => { try { return localStorage.getItem(key) === "on"; } catch { return false; } };
  const save = (key, value) => { try { localStorage.setItem(key, value ? "on" : "off"); } catch {} };
  function getContext() {
    if (!AudioContextClass) return null;
    if (!context) context = new AudioContextClass();
    return context;
  }
  function note(frequency, duration, volume, offset = 0, type = "sine") {
    const ctx = getContext();
    if (!ctx || ctx.state !== "running") return;
    const start = ctx.currentTime + offset, oscillator = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3200, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    oscillator.start(start); oscillator.stop(start + duration + 0.03);
  }
  function play(name = "tap") {
    if (!soundEnabled) return;
    const ctx = getContext();
    if (!ctx || ctx.state !== "running") return;
    const patterns = {
      tap: [[620, .045, .012]],
      correct: [[523.25, .11, .018], [659.25, .13, .02], [783.99, .19, .018]],
      wrong: [[246.94, .12, .014], [196, .17, .012]],
      reward: [[523.25, .12, .022], [659.25, .12, .024], [783.99, .15, .024], [1046.5, .28, .025], [1318.5, .34, .018]]
    };
    (patterns[name] || patterns.tap).forEach((item, index) => note(item[0], item[1], item[2], index * .085));
  }
  const chords = [[261.63,329.63,392],[220,261.63,329.63],[174.61,220,261.63],[196,246.94,293.66]];
  let musicStep = 0;
  function musicBar() {
    if (!musicEnabled || document.hidden) return;
    const chord = chords[musicStep % chords.length];
    chord.forEach((frequency,index) => {
      note(frequency,1.9,.006,index*.11,"triangle");
      note(frequency*2,.62,.0028,.42+index*.13);
    });
    note([523.25,587.33,659.25,783.99,659.25,587.33][musicStep%6],.42,.0038,.2);
    musicStep++;
  }
  async function startMusic() {
    const ctx = getContext();
    if (!ctx) return;
    try { await ctx.resume(); } catch { return; }
    musicEnabled = true; save(MUSIC_KEY,true); musicBar();
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = setInterval(musicBar,2100); updateButtons();
  }
  function stopMusic() {
    musicEnabled = false; save(MUSIC_KEY,false);
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null; updateButtons();
  }
  function updateButtons() {
    if (!dock) return;
    const sound = dock.querySelector("[data-cq-sound]"), music = dock.querySelector("[data-cq-music]");
    if (sound) {
      sound.setAttribute("aria-pressed",String(soundEnabled));
      sound.setAttribute("aria-label",soundEnabled?"إيقاف المؤثرات الصوتية":"تشغيل المؤثرات الصوتية");
      sound.innerHTML = soundEnabled?'<i class="ri-volume-up-line" aria-hidden="true"></i>':'<i class="ri-volume-mute-line" aria-hidden="true"></i>';
    }
    if (music) {
      music.setAttribute("aria-pressed",String(musicEnabled));
      music.setAttribute("aria-label",musicEnabled?"إيقاف الموسيقى":"تشغيل موسيقى كودي");
      music.innerHTML = musicEnabled?'<i class="ri-music-2-fill" aria-hidden="true"></i>':'<i class="ri-music-line" aria-hidden="true"></i>';
    }
  }
  function setGemBalance(value) {
    if (balanceNode && Number.isFinite(Number(value))) balanceNode.textContent = String(Math.max(0,Math.floor(Number(value))));
  }
  async function refreshGemBalance() {
    try {
      const module = await import("./auth.js");
      const profile = await module.getUserProfile();
      if (Number.isFinite(Number(profile?.stars))) setGemBalance(profile.stars);
    } catch {}
  }
  function closeReward(overlay) {
    overlay.classList.remove("is-visible"); overlay.setAttribute("aria-hidden","true");
  }
  function showReward(options = {}) {
    if (!document.body) return;
    const amount = Math.max(0,Number(options.gems)||0);
    const overlay = document.getElementById("cqRewardOverlay");
    if (!overlay) return;
    overlay.querySelector(".cq-reward-title").textContent = options.title || (amount ? "جوهرة جديدة!" : "إنجاز جديد!");
    overlay.querySelector(".cq-reward-copy").textContent = options.message || (amount ? "كودي فخور بيك! الجوهرة دي اتضافت لرصيدك." : "كودي فخور بيك! استمر في التعلّم.");
    overlay.querySelector(".cq-reward-gem").hidden = amount === 0;
    if (amount > 0) play("reward");
    overlay.classList.add("is-visible"); overlay.setAttribute("aria-hidden","false");
    if (Number.isFinite(Number(options.balance))) setGemBalance(options.balance);
    else refreshGemBalance();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const colors=["#ffe27a","#36bfe5","#c69cff","#ff91b5","#fff"];
      for(let i=0;i<34;i++){
        const particle=document.createElement("i");
        particle.className="cq-reward-particle";
        particle.style.setProperty("--x",(45+Math.random()*10)+"vw");
        particle.style.setProperty("--y",(38+Math.random()*15)+"vh");
        particle.style.setProperty("--dx",((Math.random()-.5)*420)+"px");
        particle.style.setProperty("--dy",((Math.random()-.5)*420)+"px");
        particle.style.setProperty("--c",colors[i%colors.length]);
        document.body.append(particle); setTimeout(()=>particle.remove(),1100);
      }
    }
  }
  function mountControls() {
    if (!document.body || dock) return;
    const style=document.createElement("style");
    style.id="cqExperienceStyles";
    style.textContent=`
      .cq-audio-dock{position:fixed;z-index:10050;inset-block-end:18px;inset-inline-start:50%;transform:translateX(-50%);display:flex;gap:7px;padding:6px;border:1px solid rgba(148,163,184,.24);border-radius:17px;background:rgba(8,14,29,.84);backdrop-filter:blur(14px);box-shadow:0 8px 28px rgba(0,0,0,.22)}
      .cq-audio-dock button{width:40px;height:40px;min-width:40px;min-height:40px;display:grid;place-items:center;border:1px solid rgba(148,163,184,.3);border-radius:12px;background:rgba(255,255,255,.06);color:#d9e8f5;font-size:1.15rem;cursor:pointer}
      .cq-audio-dock button[aria-pressed="true"]{color:#6be8ff;border-color:#36bfe5;background:rgba(54,191,229,.14);box-shadow:0 0 16px rgba(54,191,229,.16)}
      .cq-gem-wallet{position:fixed;z-index:10040;inset-block-end:18px;inset-inline-start:12px;display:flex;align-items:center;gap:8px;padding:7px 12px;border:1px solid rgba(255,214,107,.35);border-radius:16px;background:rgba(18,20,38,.88);color:#fff;backdrop-filter:blur(14px);box-shadow:0 8px 26px rgba(0,0,0,.2);font:800 13px/1.2 Cairo,sans-serif}
      .cq-gem-wallet__icon{width:27px;height:27px;display:grid;place-items:center;color:#ffd66b;font-size:1.2rem;filter:drop-shadow(0 0 7px rgba(255,214,107,.6))}.cq-gem-cody{width:38px;height:38px;object-fit:contain;align-self:end;margin-bottom:-7px;transform:rotate(-5deg);filter:drop-shadow(0 0 7px rgba(54,191,229,.4))}
      .cq-gem-wallet__value{font-variant-numeric:tabular-nums;color:#ffe6a0;font-size:14px}.cq-gem-wallet__label{color:#b8c5d6;font-size:10px}
      .cq-reward-overlay{position:fixed;inset:0;z-index:10100;display:grid;place-items:center;padding:20px;background:rgba(3,7,18,.78);backdrop-filter:blur(9px);opacity:0;pointer-events:none;transition:opacity .25s ease}
      .cq-reward-overlay.is-visible{opacity:1;pointer-events:auto}
      .cq-reward-card{position:relative;width:min(420px,100%);padding:28px 22px 24px;border:1px solid rgba(255,214,107,.45);border-radius:28px;background:radial-gradient(circle at 50% 0%,rgba(255,214,107,.2),transparent 58%),linear-gradient(145deg,#171d38,#090f22);color:#fff;text-align:center;box-shadow:0 24px 90px rgba(0,0,0,.5),0 0 48px rgba(255,190,65,.16);transform:translateY(16px) scale(.92);transition:transform .35s cubic-bezier(.2,.85,.25,1.25);overflow:hidden}
      .cq-reward-overlay.is-visible .cq-reward-card{transform:translateY(0) scale(1)}
      .cq-reward-title{margin:12px 0 5px;font:900 25px/1.4 Cairo,sans-serif;color:#ffe49a}.cq-reward-copy{margin:0 0 16px;color:#d4deef;font:700 14px/1.8 Cairo,sans-serif}
      .cq-reward-gem{position:relative;margin:5px auto 0;width:104px;height:112px;display:grid;place-items:center;color:#fff2bd;font-size:54px;filter:drop-shadow(0 0 12px rgba(255,213,82,.85));animation:cqGemFloat 1.2s ease-in-out infinite}
      .cq-reward-gem:before{content:"";position:absolute;width:78px;height:78px;transform:rotate(45deg);border:2px solid rgba(255,247,204,.95);border-radius:15px 4px 15px 4px;background:linear-gradient(135deg,#fff7c4 0%,#ffc83d 35%,#a65dff 72%,#36bfe5 100%);box-shadow:inset 0 0 16px rgba(255,255,255,.8),0 0 35px rgba(255,193,55,.7)}
      .cq-reward-gem i{position:relative;z-index:1;text-shadow:0 2px 9px rgba(77,35,120,.55)}.cq-reward-cody{width:72px;height:72px;object-fit:contain;filter:drop-shadow(0 0 12px rgba(54,191,229,.45));animation:cqCodyBounce .7s ease-in-out infinite alternate}
      .cq-reward-close{min-height:46px;padding:10px 24px;border:0;border-radius:14px;background:linear-gradient(100deg,#ffd66b,#ffae47);color:#25162d;font:900 15px Cairo,sans-serif;cursor:pointer}
      .cq-reward-particle{position:fixed;z-index:10101;left:var(--x);top:var(--y);width:8px;height:8px;border-radius:2px;background:var(--c);pointer-events:none;animation:cqParticle 950ms ease-out forwards}
      @keyframes cqGemFloat{50%{transform:translateY(-9px) rotate(4deg);filter:drop-shadow(0 0 22px rgba(255,235,128,1))}}@keyframes cqCodyBounce{to{transform:translateY(-7px) rotate(-4deg)}}@keyframes cqParticle{to{transform:translate(var(--dx),var(--dy)) rotate(240deg) scale(.1);opacity:0}}
      @media(max-width:720px){.cq-audio-dock{inset-block-end:calc(82px + env(safe-area-inset-bottom));inset-inline-start:50%;gap:5px}.cq-audio-dock button{width:36px;height:36px;min-width:36px;min-height:36px}.cq-gem-wallet{inset-block-end:calc(82px + env(safe-area-inset-bottom));inset-inline-start:8px;padding:6px 9px}.cq-reward-card{padding:22px 16px}}
      @media(prefers-reduced-motion:reduce){.cq-reward-gem,.cq-reward-cody,.cq-reward-overlay,.cq-reward-card{animation:none!important;transition:none!important}.cq-reward-particle{display:none}}
    `;
    document.head.append(style);
    dock=document.createElement("div");dock.className="cq-audio-dock";
    dock.innerHTML='<button type="button" data-cq-sound aria-pressed="false"></button><button type="button" data-cq-music aria-pressed="false"></button>';
    dock.querySelector("[data-cq-sound]").addEventListener("click",async()=>{soundEnabled=!soundEnabled;save(SOUND_KEY,soundEnabled);if(soundEnabled){try{await getContext()?.resume()}catch{}play("tap")}updateButtons()});
    dock.querySelector("[data-cq-music]").addEventListener("click",()=>musicEnabled?stopMusic():startMusic());
    document.body.append(dock);
    const wallet=document.createElement("div");wallet.className="cq-gem-wallet";
    wallet.innerHTML='<img class="cq-gem-cody" src="' + new URL("../cody-avatar.svg", SCRIPT_URL).href + '" alt="كودي"><span class="cq-gem-wallet__icon" aria-hidden="true">◆</span><span><span class="cq-gem-wallet__value">—</span><br><span class="cq-gem-wallet__label">جواهرك</span></span>';
    document.body.append(wallet);balanceNode=wallet.querySelector(".cq-gem-wallet__value");
    const overlay=document.createElement("div");overlay.id="cqRewardOverlay";overlay.className="cq-reward-overlay";overlay.setAttribute("aria-hidden","true");
    overlay.innerHTML='<section class="cq-reward-card" role="dialog" aria-modal="true" aria-labelledby="cqRewardTitle"><div class="cq-reward-gem"><i class="ri-vip-diamond-fill" aria-hidden="true"></i></div><h2 class="cq-reward-title" id="cqRewardTitle">جوهرة جديدة!</h2><p class="cq-reward-copy">كودي فخور بيك! كل خطوة بتقربك من هدفك.</p><img class="cq-reward-cody" src="' + new URL("../cody-avatar.svg", document.currentScript?.src || location.href).href + '" alt="كودي"><div><button type="button" class="cq-reward-close">رائع!</button></div></section>';
    document.body.append(overlay);
    overlay.querySelector(".cq-reward-close").addEventListener("click",()=>closeReward(overlay));
    overlay.addEventListener("click",event=>{if(event.target===overlay)closeReward(overlay)});
    window.addEventListener("keydown",event=>{if(event.key==="Escape")closeReward(overlay)});
    window.CodeQuestExperience=Object.freeze({reward:showReward,refreshGemBalance,setGemBalance});
    updateButtons();refreshGemBalance();
  }
  function onInteraction(event) {
    if(!event.isTrusted||(!soundEnabled&&!musicEnabled))return;
    const target=event.target;
    if(!(target instanceof Element)||!target.closest("button,.choice-btn,.piece,.code-block,.match-item,.bug-line,.drag-piece,input,select"))return;
    const ctx=getContext();
    if(ctx?.state==="suspended")ctx.resume().then(()=>{if(soundEnabled)play("tap");if(musicEnabled&&!musicTimer){musicBar();musicTimer=setInterval(musicBar,2100)}}).catch(()=>{});else if(soundEnabled)play("tap");
  }
  document.addEventListener("pointerdown",onInteraction,{passive:true});
  document.addEventListener("keydown",onInteraction);
  document.addEventListener("DOMContentLoaded",mountControls,{once:true});
  if(document.readyState!=="loading")mountControls();
  window.addEventListener("storage",event=>{if(event.key===SOUND_KEY)soundEnabled=read(SOUND_KEY);if(event.key===MUSIC_KEY&&!read(MUSIC_KEY))stopMusic();updateButtons()});
  document.addEventListener("cq:audio-settings-change",()=>{soundEnabled=read(SOUND_KEY);const shouldPlay=read(MUSIC_KEY);if(shouldPlay&&!musicEnabled)startMusic();else if(!shouldPlay&&musicEnabled)stopMusic();updateButtons()});
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&context?.state==="running")context.suspend().catch(()=>{});else if(!document.hidden&&musicEnabled&&context?.state==="suspended")context.resume().then(()=>{if(!musicTimer){musicBar();musicTimer=setInterval(musicBar,2100)}}).catch(()=>{})});
  soundEnabled=read(SOUND_KEY);
  musicEnabled=read(MUSIC_KEY);
  updateButtons();
  window.CodeQuestAudio=Object.freeze({play,refreshGemBalance,setGemBalance});
})();
