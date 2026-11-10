import fs from "node:fs";

const html = fs.readFileSync("dashboard.html", "utf8");
const mediaScript = fs.readFileSync("js/dashboard-media.js", "utf8");
const videos = JSON.parse(fs.readFileSync("json/learning-videos.json", "utf8"));

for (const marker of [
  'id="learningVideos"',
  'id="learningVideosGrid"',
  'id="codyChatLauncher"',
  'css/dashboard-media.css',
  'js/dashboard-media.js'
]) {
  if (!html.includes(marker)) throw new Error("Missing dashboard media integration: " + marker);
}

if (!Array.isArray(videos)) throw new Error("learning-videos.json must be an array.");
for (const [index, video] of videos.entries()) {
  if (!video || typeof video.title !== "string" || !video.title.trim()) {
    throw new Error("Video " + index + " needs a title.");
  }
  if (typeof video.youtubeId !== "string" || !/^[A-Za-z0-9_-]{11}$/.test(video.youtubeId)) {
    throw new Error("Video " + index + " needs a valid 11-character YouTube ID.");
  }
  for (const key of ["description", "category", "level", "duration"]) {
    if (video[key] !== undefined && typeof video[key] !== "string") {
      throw new Error("Video " + index + " has invalid " + key + ".");
    }
  }
}

const openTag = "<script>";
const start = html.indexOf(openTag);
const end = html.indexOf("</script>", start);
if (start < 0 || end < 0) throw new Error("Dashboard inline script not found.");
fs.writeFileSync("/tmp/codequest-dashboard-inline.mjs", html.slice(start + openTag.length, end));

for (const asset of [
  "css/dashboard-media.css",
  "js/dashboard-media.js",
  "js/app.js",
  "js/theme.js",
  "json/learning-videos.json"
]) {
  if (!fs.existsSync(asset)) throw new Error("Missing dashboard asset: " + asset);
}

if (!mediaScript.includes("youtube-nocookie.com/embed/")) {
  throw new Error("Privacy-enhanced YouTube embed host missing.");
}
if (mediaScript.includes("codyMusicToggle") || mediaScript.includes("audioContext")) {
  throw new Error("Homepage media script must not mount a floating music control.");
}
const settings = fs.readFileSync("settings.html", "utf8");
if (settings.includes('id="musicToggle"') || settings.includes("cq_music")) {
  throw new Error("Background music must be removed from the platform.");
}
if (!settings.includes('id="soundToggle"')) {
  throw new Error("Sound effects must remain configurable in Settings.");
}
const gameAudio = fs.readFileSync("js/game-audio.js", "utf8");
if (!gameAudio.includes("cq-game-sound-toggle") || gameAudio.includes("cq_music")) {
  throw new Error("Games need a top-positioned sound-only toggle, without music.");
}
if (!mediaScript.includes("learningVideoFilters")) {
  throw new Error("Editorial video magazine filters are missing.");
}
const parent = fs.readFileSync("parent.html", "utf8");
if (!parent.includes('id="parentGuideTitle"') || parent.indexOf('id="parentGuideTitle"') > parent.indexOf('class="mode-grid"')) {
  throw new Error("Parent introduction must appear before account linking.");
}
console.log("Dashboard media integration validated.");
