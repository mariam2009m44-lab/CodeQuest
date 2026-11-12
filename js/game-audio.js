(() => {
  "use strict";
  if (window.CodeQuestAudio) return;
  const SOUND_KEY = "cq_sound";
  const MUSIC_KEY = "cq_music";
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const SCRIPT_URL = document.currentScript?.src || new URL("js/game-audio.js", location.href).href;
  let context = null, soundEnabled = false, musicEnabled = false, musicTimer = null;
  let soundVolume = 0.9;
  let musicVolume = 0.9;
  try {
    const rawSoundVolume = localStorage.getItem("cq_sound_volume");
    const rawMusicVolume = localStorage.getItem("cq_music_volume");
    if (rawSoundVolume !== null) {
      const savedSoundVolume = Number(rawSoundVolume);
      if (Number.isFinite(savedSoundVolume)) soundVolume = Math.min(1, Math.max(0, savedSoundVolume));
    }
    if (rawMusicVolume !== null) {
      const savedMusicVolume = Number(rawMusicVolume);
      if (Number.isFinite(savedMusicVolume)) musicVolume = Math.min(1, Math.max(0, savedMusicVolume));
    }
  } catch {}
  const read = key => { try { return localStorage.getItem(key) === "on"; } catch { return false; } };
  const save = (key, value) => { try { localStorage.setItem(key, value ? "on" : "off"); } catch {} };
  function getContext() {
    if (!AudioContextClass) return null;
    if (!context) context = new AudioContextClass();
    return context;
  }
  function note(frequency, duration, volume, offset = 0, type = "sine", channel = "music") {
    const ctx = getContext();
    if (!ctx || ctx.state !== "running") return;
    const start = ctx.currentTime + offset, oscillator = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3200, start);
    gain.gain.setValueAtTime(0.0001, start);
    const channelVolume = channel === "sound" ? soundVolume : musicVolume;
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * channelVolume), start + 0.04);
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
    (patterns[name] || patterns.tap).forEach((item, index) => note(item[0], item[1], item[2], index * .085, "sine", "sound"));
  }
  const chords = [[261.63,329.63,392],[220,261.63,329.63],[174.61,220,261.63],[196,246.94,293.66]];
  let musicStep = 0;
  function musicBar() {
    if (!musicEnabled || document.hidden) return;
    const chord = chords[musicStep % chords.length];
    chord.forEach((frequency,index) => {
      note(frequency,1.9,.035,index*.11,"triangle");
      note(frequency*2,.62,.014,.42+index*.13);
    });
    note([523.25,587.33,659.25,783.99,659.25,587.33][musicStep%6],.42,.02,.2);
    // A steady soft beat makes the original loop feel like a real game soundtrack.
    note(110,.16,.045,0,"sine");
    note(165,.09,.025,.55,"triangle");
    note(6200,.025,.012,.27,"square");
    note(6200,.025,.012,.82,"square");
    musicStep++;
  }
  async function startMusic() {
    const ctx = getContext();
    if (!ctx) return;
    try { await ctx.resume(); } catch { return; }
    musicEnabled = true; save(MUSIC_KEY,true); musicBar();
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = setInterval(musicBar,2100);
  }
  function stopMusic() {
    musicEnabled = false; save(MUSIC_KEY,false);
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  }
  function setGemBalance(value) {
    if (!Number.isFinite(Number(value))) return;
    const amount = String(Math.max(0, Math.floor(Number(value))));
    const settingsBalance = document.getElementById("cqSettingsGemBalance");
    if (settingsBalance) settingsBalance.textContent = amount;
  }
  function setVolumes(next = {}) {
    if (Number.isFinite(Number(next.sound))) {
      soundVolume = Math.min(1, Math.max(0, Number(next.sound)));
      try { localStorage.setItem("cq_sound_volume", String(soundVolume)); } catch {}
    }
    if (Number.isFinite(Number(next.music))) {
      musicVolume = Math.min(1, Math.max(0, Number(next.music)));
      try { localStorage.setItem("cq_music_volume", String(musicVolume)); } catch {}
    }
    return { sound: soundVolume, music: musicVolume };
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
    if (!document.body || document.getElementById("cqRewardOverlay")) return;
    const style=document.createElement("style");
    style.id="cqExperienceStyles";
    style.textContent=`      .cq-reward-overlay{position:fixed;inset:0;z-index:10100;display:grid;place-items:center;padding:20px;background:rgba(3,7,18,.78);backdrop-filter:blur(9px);opacity:0;pointer-events:none;transition:opacity .25s ease}
      .cq-reward-overlay.is-visible{opacity:1;pointer-events:auto}
      .cq-reward-card{position:relative;width:min(420px,100%);padding:28px 22px 24px;border:1px solid rgba(255,214,107,.45);border-radius:28px;background:radial-gradient(circle at 50% 0%,rgba(255,214,107,.2),transparent 58%),linear-gradient(145deg,#171d38,#090f22);color:#fff;text-align:center;box-shadow:0 24px 90px rgba(0,0,0,.5),0 0 48px rgba(255,190,65,.16);transform:translateY(16px) scale(.92);transition:transform .35s cubic-bezier(.2,.85,.25,1.25);overflow:hidden}
      .cq-reward-overlay.is-visible .cq-reward-card{transform:translateY(0) scale(1)}
      .cq-reward-title{margin:12px 0 5px;font:900 25px/1.4 Cairo,sans-serif;color:#ffe49a}.cq-reward-copy{margin:0 0 16px;color:#d4deef;font:700 14px/1.8 Cairo,sans-serif}
      .cq-reward-gem{position:relative;margin:5px auto 0;width:104px;height:112px;display:grid;place-items:center;color:#fff2bd;font-size:54px;filter:drop-shadow(0 0 12px rgba(255,213,82,.85));animation:cqGemFloat 1.2s ease-in-out infinite}
      .cq-reward-gem:before{content:"";position:absolute;width:78px;height:78px;transform:rotate(45deg);border:2px solid rgba(255,247,204,.95);border-radius:15px 4px 15px 4px;background:linear-gradient(135deg,#fff7c4 0%,#ffc83d 35%,#a65dff 72%,#36bfe5 100%);box-shadow:inset 0 0 16px rgba(255,255,255,.8),0 0 35px rgba(255,193,55,.7)}
      .cq-reward-gem i{position:relative;z-index:1;text-shadow:0 2px 9px rgba(77,35,120,.55)}.cq-reward-cody{width:72px;height:72px;object-fit:contain;filter:drop-shadow(0 0 12px rgba(54,191,229,.45));animation:cqCodyBounce .7s ease-in-out infinite alternate}
      .cq-reward-close{min-height:46px;padding:10px 24px;border:0;border-radius:14px;background:linear-gradient(100deg,#ffd66b,#ffae47);color:#25162d;font:900 15px Cairo,sans-serif;cursor:pointer}
      .cq-reward-particle{position:fixed;z-index:10101;left:var(--x);top:var(--y);width:8px;height:8px;border-radius:2px;background:var(--c);pointer-events:none;animation:cqParticle 950ms ease-out forwards}
      .cq-gem-pickup{position:fixed;z-index:10120;inset-block-start:34%;inset-inline-start:50%;display:flex;align-items:center;gap:10px;padding:12px 18px;border:1px solid rgba(255,225,120,.7);border-radius:18px;background:linear-gradient(120deg,rgba(34,27,65,.96),rgba(12,31,54,.96));color:#fff;font:900 15px Cairo,sans-serif;box-shadow:0 0 36px rgba(255,207,72,.45);pointer-events:none;animation:cqPickupPop 1.15s cubic-bezier(.2,.8,.2,1) forwards}
      .cq-gem-pickup i{font-size:1.7rem;color:#ffe27a;filter:drop-shadow(0 0 12px #ffd66b)}
      @keyframes cqPickupPop{0%{opacity:0;transform:translate(-50%,24px) scale(.45)}18%{opacity:1;transform:translate(-50%,0) scale(1.12)}35%{transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,-72px) scale(1.06)}}
      .cq-celebrate-flash{animation:cqCelebrateFlash .42s ease-out}@keyframes cqCelebrateFlash{0%{filter:brightness(1)}35%{filter:brightness(1.22)}100%{filter:brightness(1)}}
      @keyframes cqGemFloat{50%{transform:translateY(-9px) rotate(4deg);filter:drop-shadow(0 0 22px rgba(255,235,128,1))}}@keyframes cqCodyBounce{to{transform:translateY(-7px) rotate(-4deg)}}@keyframes cqParticle{to{transform:translate(var(--dx),var(--dy)) rotate(240deg) scale(.1);opacity:0}}
      @media(max-width:720px){.cq-reward-card{padding:22px 16px}}
      @media(prefers-reduced-motion:reduce){.cq-reward-gem,.cq-reward-cody,.cq-reward-overlay,.cq-reward-card{animation:none!important;transition:none!important}.cq-reward-particle{display:none}}`;

    document.head.append(style);
    const overlay=document.createElement("div");overlay.id="cqRewardOverlay";overlay.className="cq-reward-overlay";overlay.setAttribute("aria-hidden","true");
    overlay.innerHTML='<section class="cq-reward-card" role="dialog" aria-modal="true" aria-labelledby="cqRewardTitle"><div class="cq-reward-gem"><i class="ri-vip-diamond-fill" aria-hidden="true"></i></div><h2 class="cq-reward-title" id="cqRewardTitle">جوهرة جديدة!</h2><p class="cq-reward-copy">كودي فخور بيك! كل خطوة بتقربك من هدفك.</p><img class="cq-reward-cody" src="' + new URL("../cody-avatar.svg", SCRIPT_URL).href + '" alt="كودي"><div><button type="button" class="cq-reward-close">رائع!</button></div></section>';
    document.body.append(overlay);
    overlay.querySelector(".cq-reward-close").addEventListener("click",()=>closeReward(overlay));
    overlay.addEventListener("click",event=>{if(event.target===overlay)closeReward(overlay)});
    window.addEventListener("keydown",event=>{if(event.key==="Escape")closeReward(overlay)});
    function showCollectible(options = {}) {
      play("correct");
      document.querySelectorAll(".cq-gem-pickup").forEach(item => item.remove());
      const toast = document.createElement("div");
      toast.className = "cq-gem-pickup";
      const icon = document.createElement("i");
      icon.className = "ri-vip-diamond-fill";
      icon.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.textContent = String(options.label || "جوهرة تم جمعها!");
      toast.append(icon, label);
      document.body.append(toast);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.body.classList.remove("cq-celebrate-flash");
        void document.body.offsetWidth;
        document.body.classList.add("cq-celebrate-flash");
        setTimeout(() => document.body.classList.remove("cq-celebrate-flash"), 460);
        const colors = ["#ffe27a", "#36bfe5", "#c69cff", "#ff91b5", "#ffffff"];
        for (let i = 0; i < 18; i++) {
          const particle = document.createElement("i");
          particle.className = "cq-reward-particle";
          particle.style.setProperty("--x", (48 + Math.random() * 4) + "vw");
          particle.style.setProperty("--y", (31 + Math.random() * 8) + "vh");
          particle.style.setProperty("--dx", ((Math.random() - .5) * 300) + "px");
          particle.style.setProperty("--dy", ((Math.random() - .5) * 280) + "px");
          particle.style.setProperty("--c", colors[i % colors.length]);
          document.body.append(particle);
          setTimeout(() => particle.remove(), 1000);
        }
      }
      setTimeout(() => toast.remove(), 1250);
    }
    window.CodeQuestExperience=Object.freeze({reward:showReward,collectible:showCollectible,refreshGemBalance,setGemBalance,setVolumes});
    refreshGemBalance();
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
  window.addEventListener("storage",event=>{if(event.key===SOUND_KEY)soundEnabled=read(SOUND_KEY);if(event.key===MUSIC_KEY){if(read(MUSIC_KEY))musicEnabled=true;else stopMusic();}});
  document.addEventListener("cq:audio-settings-change",()=>{soundEnabled=read(SOUND_KEY);if(read(MUSIC_KEY))startMusic();else stopMusic();});
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&context?.state==="running")context.suspend().catch(()=>{});else if(!document.hidden&&musicEnabled&&context?.state==="suspended")context.resume().then(()=>{if(!musicTimer){musicBar();musicTimer=setInterval(musicBar,2100)}}).catch(()=>{})});
  soundEnabled=read(SOUND_KEY);
  musicEnabled=read(MUSIC_KEY);
  window.CodeQuestAudio=Object.freeze({play,refreshGemBalance,setGemBalance,setVolumes});
})();
