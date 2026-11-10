(() => {
  "use strict";

  if (window.CodeQuestAudio) return;

  const STORAGE_KEY = "codequest_game_audio_v1";
  const NOTES = [261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66];
  const CHORDS = [
    [261.63, 329.63, 392],
    [220, 261.63, 329.63],
    [174.61, 220, 261.63],
    [196, 246.94, 293.66]
  ];

  let context = null;
  let musicTimer = null;
  let noteIndex = 0;
  let enabled = false;
  let soundEnabled = true;
  let volume = 0.16;
  let button = null;
  let volumeInput = null;

  function loadSettings() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      soundEnabled = value.soundEnabled !== false;
      volume = Number.isFinite(value.volume)
        ? Math.min(0.35, Math.max(0.03, value.volume))
        : 0.16;
    } catch {
      soundEnabled = true;
      volume = 0.16;
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ soundEnabled, volume }));
    } catch {}
  }

  function getContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Audio is not supported");
    if (!context) context = new AudioContextClass();
    return context;
  }

  function tone(frequency, duration, type, gainValue, delay = 0) {
    if (!context || context.state !== "running" || !soundEnabled) return;
    const now = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type || "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  function playMusicStep() {
    if (!enabled || !context || context.state !== "running") return;
    const chord = CHORDS[Math.floor(noteIndex / 4) % CHORDS.length];
    const melodyNote = NOTES[noteIndex % NOTES.length];
    const base = volume * 0.10;
    tone(melodyNote, 0.75, "sine", base);
    if (noteIndex % 4 === 0) {
      chord.forEach((frequency, index) => {
        tone(frequency / 2, 1.45, "triangle", base * 0.32, index * 0.035);
      });
    }
    noteIndex += 1;
  }

  function updateButton() {
    if (!button) return;
    button.setAttribute("aria-pressed", String(enabled));
    button.innerHTML = enabled
      ? '<span aria-hidden="true">♫</span><span>إيقاف موسيقى اللعبة</span>'
      : '<span aria-hidden="true">♪</span><span>موسيقى اللعبة</span>';
    button.classList.toggle("is-playing", enabled);
  }

  function stopMusic() {
    enabled = false;
    if (musicTimer) window.clearInterval(musicTimer);
    musicTimer = null;
    updateButton();
  }

  async function toggleMusic() {
    if (enabled) {
      stopMusic();
      return;
    }
    const audio = getContext();
    await audio.resume();
    enabled = true;
    playMusicStep();
    musicTimer = window.setInterval(playMusicStep, 620);
    updateButton();
  }

  function play(name = "tap") {
    if (!soundEnabled) return;
    try {
      if (!context || context.state !== "running") return;
      const patterns = {
        tap: [[660, 0.07, 0.018]],
        correct: [[523.25, 0.12, 0.035], [659.25, 0.16, 0.03], [783.99, 0.2, 0.025]],
        wrong: [[220, 0.14, 0.025], [185, 0.18, 0.02]],
        reward: [[523.25, 0.13, 0.035], [659.25, 0.13, 0.035], [783.99, 0.13, 0.035], [1046.5, 0.28, 0.03]]
      };
      (patterns[name] || patterns.tap).forEach((item, index) => {
        tone(item[0], item[1], "sine", item[2], index * 0.105);
      });
    } catch {}
  }

  function mount() {
    if (!document.body || document.getElementById("cq-game-audio")) return;
    const style = document.createElement("style");
    style.textContent = `
      #cq-game-audio{position:fixed;z-index:9999;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:9px;padding:9px 11px;border:1px solid rgba(107,232,255,.32);border-radius:16px;background:rgba(8,15,30,.94);color:#f8fafc;box-shadow:0 8px 28px rgba(0,0,0,.28);font:700 12px Cairo,sans-serif;backdrop-filter:blur(12px)}
      #cq-game-audio button{min-height:40px;border:0;border-radius:11px;padding:8px 12px;background:linear-gradient(135deg,#7955e8,#238db9);color:white;font:inherit;cursor:pointer}
      #cq-game-audio button:focus-visible,#cq-game-audio input:focus-visible{outline:3px solid #ffd66b;outline-offset:3px}
      #cq-game-audio button.is-playing{background:linear-gradient(135deg,#168c76,#36bfe5)}
      #cq-game-audio label{display:flex;align-items:center;gap:6px;color:#cbd5e1}
      #cq-game-audio input{width:68px;accent-color:#36bfe5}
      @media(max-width:480px){#cq-game-audio{right:8px;bottom:calc(8px + env(safe-area-inset-bottom));gap:6px;padding:7px}#cq-game-audio button{padding:7px 9px;font-size:11px}#cq-game-audio label{font-size:10px}#cq-game-audio input{width:52px}}
      @media(prefers-reduced-motion:reduce){#cq-game-audio *{transition:none!important}}
    `;
    document.head.appendChild(style);

    const panel = document.createElement("div");
    panel.id = "cq-game-audio";
    panel.innerHTML = `
      <button type="button" id="cq-game-music" aria-pressed="false">♪ موسيقى اللعبة</button>
      <label title="مستوى الصوت"><span aria-hidden="true">🔉</span><input id="cq-game-volume" type="range" min="0.03" max="0.35" step="0.01" value="${volume}" aria-label="مستوى صوت الموسيقى"></label>
    `;
    document.body.appendChild(panel);
    button = panel.querySelector("#cq-game-music");
    volumeInput = panel.querySelector("#cq-game-volume");
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await toggleMusic();
      } catch (error) {
        console.warn("تعذر تشغيل موسيقى اللعبة:", error);
        button.textContent = "الصوت غير متاح";
      } finally {
        button.disabled = false;
      }
    });
    volumeInput.addEventListener("input", () => {
      volume = Number(volumeInput.value);
      saveSettings();
    });
    updateButton();

    document.addEventListener("click", event => {
      if (event.target.closest("button, .choice-btn, .piece, .code-block, .match-item, .bug-line, .drag-piece")) {
        try {
          const audio = getContext();
          audio.resume().then(() => play("tap")).catch(() => {});
        } catch {}
      }
    }, true);

    const feedbackObserver = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "attributes" && record.attributeName === "class") {
          const element = record.target;
          if (element.classList.contains("correct") || element.classList.contains("matched") || element.classList.contains("correct-build")) {
            play("correct");
          } else if (element.classList.contains("wrong") || element.classList.contains("incorrect")) {
            play("wrong");
          }
        }
      }
    });
    feedbackObserver.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["class"]
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (!context || !enabled) return;
    if (document.hidden) {
      if (musicTimer) window.clearInterval(musicTimer);
      musicTimer = null;
      context.suspend().catch(() => {});
    } else {
      context.resume().then(() => {
        if (enabled && !musicTimer) musicTimer = window.setInterval(playMusicStep, 620);
      }).catch(() => stopMusic());
    }
  });

  loadSettings();
  window.CodeQuestAudio = Object.freeze({ play, stop: stopMusic });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();