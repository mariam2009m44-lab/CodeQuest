(() => {
  "use strict";
  if (window.CodeQuestAudio) return;

  const STORAGE_KEY = "cq_sound";
  let context = null;
  let enabled = false;
  let button = null;

  function readEnabled() {
    try { enabled = localStorage.getItem(STORAGE_KEY) === "on"; }
    catch { enabled = false; }
    updateButton();
  }

  function getContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!context) context = new AudioContextClass();
    return context;
  }

  function tone(frequency, duration, gainValue, startOffset = 0) {
    const ctx = getContext();
    if (!ctx || ctx.state !== "running") return;
    const start = ctx.currentTime + startOffset;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2600, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function play(name = "tap") {
    if (!enabled) return;
    const ctx = getContext();
    if (!ctx) return;
    const patterns = {
      tap: [[620, .045, .012]],
      correct: [[523.25, .11, .018], [659.25, .13, .02], [783.99, .19, .018]],
      wrong: [[246.94, .12, .014], [196, .17, .012]],
      reward: [[523.25, .1, .018], [659.25, .1, .02], [783.99, .1, .02], [1046.5, .23, .018]]
    };
    (patterns[name] || patterns.tap).forEach((item, index) => tone(item[0], item[1], item[2], index * .085));
  }

  function updateButton() {
    if (!button) return;
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", enabled ? "إيقاف المؤثرات الصوتية" : "تشغيل المؤثرات الصوتية");
    button.title = enabled ? "إيقاف الصوت" : "تشغيل الصوت";
    button.innerHTML = enabled
      ? '<i class="ri-volume-up-line" aria-hidden="true"></i>'
      : '<i class="ri-volume-mute-line" aria-hidden="true"></i>';
  }

  function mountControl() {
    if (!document.body || button) return;
    if (!document.getElementById("cqGameSoundStyles")) {
      const style = document.createElement("style");
      style.id = "cqGameSoundStyles";
      style.textContent = ".cq-game-sound-toggle{position:fixed;z-index:10050;inset-block-start:max(12px,env(safe-area-inset-top));inset-inline-end:14px;width:44px;height:44px;display:grid;place-items:center;border:1px solid rgba(148,163,184,.35);border-radius:14px;background:rgba(12,19,35,.88);color:#eaf6ff;box-shadow:0 8px 24px rgba(0,0,0,.22);backdrop-filter:blur(12px);font-size:1.25rem;cursor:pointer;-webkit-tap-highlight-color:transparent}.cq-game-sound-toggle[aria-pressed=\"true\"]{color:#36bfe5;border-color:#36bfe5}.cq-game-sound-toggle:focus-visible{outline:3px solid #36bfe5;outline-offset:3px}";
      document.head.append(style);
    }
    button = document.createElement("button");
    button.type = "button";
    button.className = "cq-game-sound-toggle";
    button.addEventListener("click", async () => {
      enabled = !enabled;
      try { localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off"); } catch {}
      if (enabled) {
        const ctx = getContext();
        try { await ctx?.resume(); } catch {}
        play("tap");
      }
      updateButton();
    });
    document.body.append(button);
    updateButton();
  }

  function onInteraction(event) {
    if (!event.isTrusted || !enabled) return;
    if (!event.target.closest("button, .choice-btn, .piece, .code-block, .match-item, .bug-line, .drag-piece, input, select")) return;
    const ctx = getContext();
    if (ctx?.state === "suspended") ctx.resume().then(() => play("tap")).catch(() => {});
    else play("tap");
  }

  document.addEventListener("pointerdown", onInteraction, { passive: true });
  document.addEventListener("keydown", onInteraction);
  document.addEventListener("DOMContentLoaded", mountControl, { once: true });
  if (document.readyState !== "loading") mountControl();

  window.addEventListener("storage", event => {
    if (event.key === STORAGE_KEY) readEnabled();
  });

  const observer = new MutationObserver(records => {
    for (const record of records) {
      const el = record.target;
      if (record.type !== "attributes" || record.attributeName !== "class") continue;
      if (el.classList.contains("correct") || el.classList.contains("matched") || el.classList.contains("correct-build")) play("correct");
      else if (el.classList.contains("wrong") || el.classList.contains("incorrect")) play("wrong");
    }
  });
  if (document.body) observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
  readEnabled();
  window.CodeQuestAudio = Object.freeze({ play });
})();