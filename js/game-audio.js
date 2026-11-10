(() => {
  "use strict";
  if (window.CodeQuestAudio) return;

  const KEYS = { music: "cq_music", sound: "cq_sound", volume: "cq_music_volume" };
  let audio = null;
  let musicTimer = null;
  let step = 0;
  let musicEnabled = false;
  let soundEnabled = false;
  let volume = 0.12;

  function readPreferences() {
    try {
      musicEnabled = localStorage.getItem(KEYS.music) === "on";
      soundEnabled = localStorage.getItem(KEYS.sound) === "on";
      const stored = Number(localStorage.getItem(KEYS.volume));
      volume = Number.isFinite(stored) && stored > 0 ? Math.min(.25, Math.max(.03, stored)) : .12;
    } catch {
      musicEnabled = false;
      soundEnabled = false;
      volume = .12;
    }
  }
  function context() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error("Audio unavailable");
    if (!audio) audio = new Audio();
    return audio;
  }
  function note(freq, duration, wave, level, when = 0, filterFreq = 2400) {
    if (!audio || audio.state !== "running") return;
    const start = audio.currentTime + when;
    const osc = audio.createOscillator();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, start);
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, level), start + Math.min(.18, duration * .25));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(filter); filter.connect(gain); gain.connect(audio.destination);
    osc.start(start); osc.stop(start + duration + .03);
  }
  const scale = [261.63,293.66,349.23,392,440,523.25,440,392,349.23,329.63,293.66,392];
  const chords = [[130.81,164.81,196],[110,130.81,164.81],[146.83,174.61,220],[98,123.47,146.83]];
  function musicStep() {
    if (!musicEnabled || !audio || audio.state !== "running") return;
    const n = step % scale.length;
    const chord = chords[Math.floor(step / 3) % chords.length];
    const master = volume;
    note(scale[n], .9, "sine", master * .10, 0, 1800);
    note(scale[n] * 2, .32, "triangle", master * .025, .08, 3200);
    if (step % 3 === 0) chord.forEach((hz,i) => note(hz, 2.1, "sine", master * .026, i * .035, 700));
    if (step % 6 === 0) note(chord[0] / 2, 2.4, "triangle", master * .045, .02, 420);
    step++;
  }
  async function startMusic() {
    if (!musicEnabled || musicTimer) return;
    const ctx = context();
    await ctx.resume();
    musicStep();
    musicTimer = window.setInterval(musicStep, 720);
  }
  function stopMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    if (audio?.state === "running") audio.suspend().catch(() => {});
  }
  function play(name = "tap") {
    if (!soundEnabled) return;
    try {
      const ctx = context();
      if (ctx.state !== "running") return;
      const patterns = {
        tap: [[740,.055,.012]],
        correct: [[523.25,.13,.022],[659.25,.16,.024],[783.99,.24,.022]],
        wrong: [[246.94,.12,.018],[196,.2,.016]],
        reward: [[523.25,.12,.025],[659.25,.12,.025],[783.99,.12,.025],[1046.5,.3,.02]]
      };
      (patterns[name] || patterns.tap).forEach((v,i) => note(v[0],v[1],"sine",v[2],i*.095,2600));
    } catch {}
  }
  function onInteraction(event) {
    if (!event.isTrusted) return;
    if (!event.target.closest("button, .choice-btn, .piece, .code-block, .match-item, .bug-line, .drag-piece, input, select")) return;
    try {
      const ctx = context();
      ctx.resume().then(() => {
        if (musicEnabled && !musicTimer) startMusic().catch(() => {});
        play("tap");
      }).catch(() => {});
    } catch {}
  }
  document.addEventListener("pointerdown", onInteraction, { passive: true });
  document.addEventListener("keydown", onInteraction);
  document.addEventListener("visibilitychange", () => {
    if (!audio || !musicEnabled) return;
    if (document.hidden) {
      if (musicTimer) clearInterval(musicTimer);
      musicTimer = null;
      audio.suspend().catch(() => {});
    } else if (musicEnabled) {
      audio.resume().then(() => { if (!musicTimer) { musicStep(); musicTimer = setInterval(musicStep,720); } }).catch(() => {});
    }
  });
  window.addEventListener("storage", event => {
    if (!Object.values(KEYS).includes(event.key)) return;
    readPreferences();
    if (!musicEnabled) stopMusic();
  });
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type !== "attributes" || record.attributeName !== "class") continue;
      const el = record.target;
      if (el.classList.contains("correct") || el.classList.contains("matched") || el.classList.contains("correct-build")) play("correct");
      else if (el.classList.contains("wrong") || el.classList.contains("incorrect")) play("wrong");
    }
  });
  if (document.body) observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:["class"]});
  readPreferences();
  window.CodeQuestAudio = Object.freeze({ play, stop: stopMusic });
})();