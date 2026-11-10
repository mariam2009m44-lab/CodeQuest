const grid = document.getElementById("learningVideosGrid");
const musicButton = document.getElementById("codyMusicToggle");

function makeElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function validVideo(item) {
  return item && typeof item.title === "string" && item.title.trim() &&
    typeof item.youtubeId === "string" && /^[A-Za-z0-9_-]{11}$/.test(item.youtubeId) &&
    (item.description === undefined || typeof item.description === "string") &&
    (item.category === undefined || typeof item.category === "string") &&
    (item.level === undefined || typeof item.level === "string");
}

function renderVideo(item) {
  const card = makeElement("article", "learning-video-card");
  const frame = makeElement("div", "learning-video-frame");
  const play = makeElement("button", "learning-video-play");
  play.type = "button";
  play.setAttribute("aria-label", `تشغيل فيديو: ${item.title}`);
  play.innerHTML = '<i class="ri-play-fill" aria-hidden="true"></i>';

  play.addEventListener("click", () => {
    if (frame.querySelector("iframe")) return;
    const player = document.createElement("iframe");
    player.src = `https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&rel=0`;
    player.title = item.title;
    player.loading = "lazy";
    player.referrerPolicy = "strict-origin-when-cross-origin";
    player.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    player.allowFullscreen = true;
    frame.replaceChildren(player);
  }, { once: true });

  frame.append(play);
  const info = makeElement("div", "learning-video-info");
  const meta = makeElement("div", "learning-video-meta");
  meta.append(makeElement("span", "learning-video-category", item.category || "شرح مبسط"));
  if (item.level) meta.append(makeElement("span", "learning-video-level", item.level));
  info.append(meta, makeElement("h3", "", item.title.trim()));
  if (item.description) info.append(makeElement("p", "", item.description.trim()));
  card.append(frame, info);
  return card;
}

async function loadLearningVideos() {
  if (!grid) return;
  try {
    const response = await fetch("json/learning-videos.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const videos = await response.json();
    if (!Array.isArray(videos)) throw new Error("ملف الفيديوهات يجب أن يحتوي على قائمة.");
    const valid = videos.filter(validVideo);
    if (!valid.length) return;
    grid.replaceChildren(...valid.map(renderVideo));
  } catch (error) {
    console.error("تعذر تحميل فيديوهات الشرح:", error);
    const note = makeElement("p", "learning-videos-empty", "تعذر تحميل قائمة الفيديوهات حاليًا. يمكنك المحاولة مرة أخرى لاحقًا.");
    grid.replaceChildren(note);
  }
}

const melody = [60, 64, 67, 72, 67, 64, 62, 65, 69, 74, 69, 65];
let audioContext = null;
let musicTimer = null;
let noteIndex = 0;
let musicEnabled = false;

function playSoftNote() {
  if (!audioContext || audioContext.state !== "running") return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(440 * Math.pow(2, (melody[noteIndex % melody.length] - 69) / 12), now);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(0.025, now + 0.035);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.58);
  noteIndex += 1;
}

function updateMusicButton(active) {
  if (!musicButton) return;
  musicButton.setAttribute("aria-pressed", String(active));
  musicButton.setAttribute("aria-label", active ? "إيقاف الموسيقى الهادئة" : "تشغيل الموسيقى الهادئة");
  musicButton.title = active ? "إيقاف الموسيقى الهادئة" : "تشغيل الموسيقى الهادئة";
  musicButton.innerHTML = active
    ? '<i class="ri-pause-circle-line" aria-hidden="true"></i><span>إيقاف الموسيقى</span>'
    : '<i class="ri-music-2-line" aria-hidden="true"></i><span>موسيقى كودي</span>';
}

function stopMusic() {
  musicEnabled = false;
  if (musicTimer) window.clearInterval(musicTimer);
  musicTimer = null;
  if (audioContext && audioContext.state === "running") audioContext.suspend().catch(() => {});
  updateMusicButton(false);
}

async function startMusic() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("المتصفح لا يدعم تشغيل الموسيقى.");
  if (!audioContext) audioContext = new AudioContextClass();
  await audioContext.resume();
  musicEnabled = true;
  playSoftNote();
  musicTimer = window.setInterval(playSoftNote, 680);
  updateMusicButton(true);
}

musicButton?.addEventListener("click", async () => {
  if (musicEnabled) {
    stopMusic();
    return;
  }
  musicButton.disabled = true;
  try {
    await startMusic();
  } catch (error) {
    console.warn("تعذر تشغيل الموسيقى:", error);
    musicButton.title = "الموسيقى غير متاحة في هذا المتصفح";
  } finally {
    musicButton.disabled = false;
  }
});

document.addEventListener("visibilitychange", () => {
  if (!audioContext || !musicEnabled) return;
  if (document.hidden) {
    if (musicTimer) window.clearInterval(musicTimer);
    musicTimer = null;
    audioContext.suspend().catch(() => {});
  } else {
    audioContext.resume().then(() => {
      if (musicEnabled && !musicTimer) {
        playSoftNote();
        musicTimer = window.setInterval(playSoftNote, 680);
      }
    }).catch(() => stopMusic());
  }
});

updateMusicButton(false);
loadLearningVideos();
