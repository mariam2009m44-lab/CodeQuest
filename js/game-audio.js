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
  let masterBus = null, musicBus = null, soundBus = null, delayNode = null;
  let delayFeedback = null, delayWet = null, compressor = null, noiseBuffer = null;
  function getContext() {
    if (!AudioContextClass) return null;
    if (!context) {
      context = new AudioContextClass();
      masterBus = context.createGain();
      masterBus.gain.value = 0.82;
      musicBus = context.createGain();
      musicBus.gain.value = musicEnabled ? musicVolume * 0.72 : 0;
      soundBus = context.createGain();
      soundBus.gain.value = soundVolume;
      compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 16;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.012;
      compressor.release.value = 0.22;
      delayNode = context.createDelay(0.6);
      delayNode.delayTime.value = 0.29;
      delayFeedback = context.createGain();
      delayFeedback.gain.value = 0.16;
      delayWet = context.createGain();
      delayWet.gain.value = 0.13;
      musicBus.connect(masterBus);
      musicBus.connect(delayNode);
      delayNode.connect(delayFeedback);
      delayFeedback.connect(delayNode);
      delayNode.connect(delayWet);
      delayWet.connect(masterBus);
      soundBus.connect(masterBus);
      masterBus.connect(compressor);
      compressor.connect(context.destination);
    }
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
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(filter); filter.connect(gain);
    gain.connect(channel === "sound" ? soundBus : musicBus);
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
  // Original CodeQuest soundtrack: a gentle, uplifting 92 BPM game-world theme.
  // Four-bar harmonic loop, warm pads, a soft bass pulse, glassy plucks and restrained percussion.
  const MUSIC_BPM = 92;
  const STEP_SECONDS = 60 / MUSIC_BPM / 4;
  const STEPS_PER_BAR = 16;
  const BAR_SECONDS = STEP_SECONDS * STEPS_PER_BAR;
  const PROGRESSION = [
    { root: 130.81, chord: [130.81, 164.81, 196.00, 246.94], melody: [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 783.99, 1046.50] },
    { root: 110.00, chord: [110.00, 130.81, 164.81, 196.00], melody: [523.25, 659.25, 880.00, 783.99, 659.25, 587.33, 659.25, 523.25] },
    { root: 87.31, chord: [87.31, 110.00, 130.81, 164.81], melody: [523.25, 698.46, 880.00, 783.99, 698.46, 659.25, 587.33, 523.25] },
    { root: 98.00, chord: [98.00, 123.47, 146.83, 196.00], melody: [587.33, 783.99, 987.77, 880.00, 783.99, 698.46, 659.25, 587.33] }
  ];
  let musicStep = 0;
  let nextMusicStepTime = 0;

  function makeNoiseBuffer() {
    const ctx = getContext();
    if (!ctx) return null;
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.7;
    }
    return noiseBuffer;
  }

  function scheduleVoice(frequency, duration, volume, when, options = {}) {
    const ctx = getContext();
    if (!ctx || ctx.state !== "running") return;
    const oscillator = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const envelope = ctx.createGain();
    const startFrequency = Math.max(20, frequency);
    oscillator.type = options.type || "triangle";
    oscillator.frequency.setValueAtTime(startFrequency, when);
    if (options.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, options.endFrequency), when + duration);
    }
    oscillator.detune.setValueAtTime(options.detune || 0, when);
    filter.type = options.filterType || "lowpass";
    filter.frequency.setValueAtTime(options.cutoff || 2600, when);
    filter.Q.value = options.q || 0.55;
    const attack = Math.min(options.attack || 0.035, duration * 0.35);
    const releaseStart = Math.max(when + attack + 0.01, when + duration * (options.sustain || 0.72));
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), when + attack);
    envelope.gain.setValueAtTime(Math.max(0.0002, volume * (options.hold || 0.72)), releaseStart);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(options.channel === "sound" ? soundBus : musicBus);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.025);
  }

  function scheduleNoise(when, duration, volume, cutoff = 6500) {
    const ctx = getContext();
    const buffer = makeNoiseBuffer();
    if (!ctx || !buffer || ctx.state !== "running") return;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const envelope = ctx.createGain();
    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.setValueAtTime(cutoff, when);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), when + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(musicBus);
    source.start(when);
    source.stop(when + duration + 0.02);
  }

  function scheduleMusicStep(step, when) {
    const stepInLoop = step % 64;
    const bar = Math.floor(stepInLoop / STEPS_PER_BAR);
    const beatStep = stepInLoop % STEPS_PER_BAR;
    const harmony = PROGRESSION[bar];
    const beat = beatStep % 4 === 0;

    if (beatStep === 0) {
      harmony.chord.forEach((frequency, index) => {
        scheduleVoice(frequency, BAR_SECONDS * 0.94, 0.012, when + index * 0.018, {
          type: "triangle", cutoff: 1500 + index * 220, attack: 0.32, sustain: 0.84, hold: 0.58
        });
        if (index === 0 || index === 2) {
          scheduleVoice(frequency * 2, BAR_SECONDS * 0.78, 0.0038, when + 0.05, {
            type: "sine", cutoff: 2100, attack: 0.4, sustain: 0.8, hold: 0.5
          });
        }
      });
    }

    if (beatStep === 0 || beatStep === 8) {
      scheduleVoice(harmony.root * 0.5, 0.42, 0.032, when, {
        type: "sine", endFrequency: harmony.root * 0.46, cutoff: 420, attack: 0.018, sustain: 0.3, hold: 0.3
      });
      // Soft low-frequency kick, with no sharp transient.
      scheduleVoice(92, 0.2, 0.042, when, {
        type: "sine", endFrequency: 48, cutoff: 180, attack: 0.006, sustain: 0.14, hold: 0.2
      });
    }

    if (beatStep === 4 || beatStep === 12) {
      scheduleNoise(when, 0.105, 0.009, 1800);
      scheduleVoice(185, 0.12, 0.009, when, {
        type: "triangle", endFrequency: 130, cutoff: 600, attack: 0.004, sustain: 0.18, hold: 0.2
      });
    }

    if (beatStep % 4 === 2) scheduleNoise(when, 0.035, 0.0035, 7200);
    if (beatStep % 4 === 0 && beatStep !== 0) scheduleNoise(when, 0.028, 0.0025, 8200);

    if (beatStep % 2 === 0) {
      const melodyIndex = beatStep / 2;
      scheduleVoice(harmony.melody[melodyIndex], 0.34, 0.014, when + 0.018, {
        type: "sine", cutoff: 4200, attack: 0.012, sustain: 0.34, hold: 0.34
      });
      if (melodyIndex === 3 || melodyIndex === 7) {
        scheduleVoice(harmony.melody[melodyIndex] * 2, 0.22, 0.0035, when + 0.035, {
          type: "sine", cutoff: 5200, attack: 0.01, sustain: 0.25, hold: 0.25
        });
      }
    }
  }

  function scheduleMusic() {
    const ctx = getContext();
    if (!ctx || !musicEnabled || document.hidden || ctx.state !== "running") return;
    const horizon = ctx.currentTime + 0.22;
    while (nextMusicStepTime < horizon) {
      scheduleMusicStep(musicStep, nextMusicStepTime);
      nextMusicStepTime += STEP_SECONDS;
      musicStep = (musicStep + 1) % 64;
    }
  }

  async function startMusic() {
    const ctx = getContext();
    if (!ctx) return;
    try { await ctx.resume(); } catch { return; }
    musicEnabled = true;
    save(MUSIC_KEY, true);
    const now = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(musicBus.gain.value, now);
    musicBus.gain.linearRampToValueAtTime(musicVolume * 0.72, now + 1.1);
    if (musicTimer) clearInterval(musicTimer);
    musicStep = 0;
    nextMusicStepTime = now + 0.08;
    scheduleMusic();
    musicTimer = setInterval(scheduleMusic, 45);
  }

  function stopMusic() {
    musicEnabled = false;
    save(MUSIC_KEY, false);
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    if (musicBus && context?.state === "running") {
      const now = context.currentTime;
      musicBus.gain.cancelScheduledValues(now);
      musicBus.gain.setValueAtTime(musicBus.gain.value, now);
      musicBus.gain.linearRampToValueAtTime(0, now + 0.45);
    }
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
    if (context?.state === "running") {
      const now = context.currentTime;
      if (soundBus) {
        soundBus.gain.cancelScheduledValues(now);
        soundBus.gain.setTargetAtTime(soundVolume, now, 0.045);
      }
      if (musicBus) {
        musicBus.gain.cancelScheduledValues(now);
        musicBus.gain.setTargetAtTime(musicEnabled ? musicVolume * 0.72 : 0, now, 0.08);
      }
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
    if(ctx?.state==="suspended")ctx.resume().then(()=>{if(soundEnabled)play("tap");if(musicEnabled&&!musicTimer)startMusic()}).catch(()=>{});else if(soundEnabled)play("tap");
  }
  document.addEventListener("pointerdown",onInteraction,{passive:true});
  document.addEventListener("keydown",onInteraction);
  document.addEventListener("DOMContentLoaded",mountControls,{once:true});
  if(document.readyState!=="loading")mountControls();
  window.addEventListener("storage",event=>{if(event.key===SOUND_KEY){soundEnabled=read(SOUND_KEY);setVolumes({sound:soundVolume})}if(event.key===MUSIC_KEY){if(read(MUSIC_KEY)){musicEnabled=true;if(context?.state==="running")startMusic()}else stopMusic()}});
  document.addEventListener("cq:audio-settings-change",()=>{soundEnabled=read(SOUND_KEY);if(read(MUSIC_KEY))startMusic();else stopMusic();});
  document.addEventListener("visibilitychange",()=>{if(document.hidden){if(musicTimer)clearInterval(musicTimer);musicTimer=null;if(context?.state==="running")context.suspend().catch(()=>{})}else if(musicEnabled&&context?.state==="suspended")startMusic()});
  soundEnabled=read(SOUND_KEY);
  musicEnabled=read(MUSIC_KEY);
  window.CodeQuestAudio=Object.freeze({play,refreshGemBalance,setGemBalance,setVolumes});
})();
