import fs from "node:fs";

const html = fs.readFileSync("dashboard.html", "utf8");
const magazineScript = fs.readFileSync("js/learning-magazine.js", "utf8");
const magazineCss = fs.readFileSync("css/learning-magazine.css", "utf8");
const magazine = JSON.parse(fs.readFileSync("json/learning-videos.json", "utf8"));

for (const marker of [
  'id="learningMagazine"',
  'id="magazineHeroImage"',
  'id="magazineHeroDots"',
  'id="magazineSeriesGrid"',
  'css/learning-magazine.css',
  'js/learning-magazine.js'
]) {
  if (!html.includes(marker)) throw new Error("Missing learning magazine integration: " + marker);
}

if (!magazine || !Array.isArray(magazine.slides) || magazine.slides.length < 3 ||
    !Array.isArray(magazine.series) || magazine.series.length < 6) {
  throw new Error("The magazine needs multiple hero slides and a broad language series library.");
}
const validYouTubeId = value => typeof value === "string" && /^[A-Za-z0-9_-]{11}$/.test(value);
for (const [index, slide] of magazine.slides.entries()) {
  if (!slide || !slide.title || !slide.description || !slide.category ||
      !validYouTubeId(slide.youtubeId) || typeof slide.playlistUrl !== "string" ||
      !slide.playlistUrl.startsWith("https://www.youtube.com/playlist?list=")) {
    throw new Error("Hero slide " + index + " has incomplete or invalid media metadata.");
  }
}
const seriesIds = new Set();
for (const [index, series] of magazine.series.entries()) {
  if (!series || !series.id || !series.name || !series.description ||
      !validYouTubeId(series.youtubeId) || !/^[A-Za-z0-9_-]{10,}$/.test(series.playlistId || "") ||
      !series.provider || !series.source) {
    throw new Error("Learning series " + index + " has incomplete or invalid metadata.");
  }
  if (seriesIds.has(series.id)) throw new Error("Duplicate learning series id: " + series.id);
  seriesIds.add(series.id);
}
for (const required of ["python", "javascript", "cpp", "java", "html", "css"]) {
  if (!seriesIds.has(required)) throw new Error("Missing language series: " + required);
}
if (!magazineScript.includes("setInterval") ||
    !magazineScript.includes("prefers-reduced-motion") ||
    !magazineScript.includes("noopener noreferrer")) {
  throw new Error("Magazine carousel needs controlled autoplay, reduced-motion support and safe external links.");
}
if (!magazineCss.includes(".magazine-hero") ||
    !magazineCss.includes("@media(max-width:620px)") ||
    !magazineCss.includes("prefers-reduced-motion")) {
  throw new Error("Magazine needs editorial hero, mobile layout and reduced-motion styling.");
}

const openTag = "<script>";
const start = html.indexOf(openTag);
const end = html.indexOf("</script>", start);
if (start < 0 || end < 0) throw new Error("Dashboard inline script not found.");
fs.writeFileSync("/tmp/codequest-dashboard-inline.mjs", html.slice(start + openTag.length, end));

for (const asset of [
  "css/dashboard-media.css",
  "css/learning-magazine.css",
  "js/learning-magazine.js",
  "js/app.js",
  "js/theme.js",
  "json/learning-videos.json"
]) {
  if (!fs.existsSync(asset)) throw new Error("Missing dashboard asset: " + asset);
}

const settings = fs.readFileSync("settings.html", "utf8");
if (!settings.includes('id="soundToggle"') || !settings.includes('id="musicToggle"')) {
  throw new Error("Sound effects and optional background music must remain configurable in Settings.");
}
const gameAudio = fs.readFileSync("js/game-audio.js", "utf8");
const themeScript = fs.readFileSync("js/theme.js", "utf8");
if (!gameAudio.includes("cq-audio-dock") || !gameAudio.includes("cq-gem-wallet") ||
    !gameAudio.includes("cq_music") || !gameAudio.includes("CodeQuestExperience") ||
    !themeScript.includes("game-audio.js")) {
  throw new Error("The shared experience layer needs sound, optional music, gems and platform-wide loading.");
}
if (!magazineScript.includes("youtube-nocookie.com/embed/") ||
    !magazineScript.includes("magazine-series-play")) {
  throw new Error("Learning series need an in-page video player.");
}
const javaSeries = magazine.series.find(item => item.id === "java");
if (!javaSeries || javaSeries.youtubeId !== "mNvJipMTKSM" || javaSeries.provider !== "Adel Nasim") {
  throw new Error("The Java series must use a Java-specific Arabic video source.");
}
const parent = fs.readFileSync("parent.html", "utf8");
if (!parent.includes('id="parentGuideTitle"') || parent.indexOf('id="parentGuideTitle"') > parent.indexOf('class="mode-grid"')) {
  throw new Error("Parent introduction must appear before account linking.");
}
if (!settings.includes('id="createParentCodeButton"')) {
  throw new Error("Learners must create parent-link codes from their own settings.");
}
if (parent.includes('id="createLinkButton"') || parent.includes('id="generatedCodeBox"')) {
  throw new Error("Parent dashboard must not expose learner-side code generation.");
}
const learnerLinkScript = fs.readFileSync("js/learner-parent-link.js", "utf8");
if (!learnerLinkScript.includes('"createParentLinkCode"') ||
    !learnerLinkScript.includes('"getMyParentLinks"') ||
    !learnerLinkScript.includes('"removeParentLinkAsChild"')) {
  throw new Error("Learner parent-link management callables are incomplete.");
}
const progressPage = fs.readFileSync("progress.html", "utf8");
if (!progressPage.includes(String.raw`const match = /^(\d+)_(\d+)$/.exec(String(key));`)) {
  throw new Error("Python local progress keys must parse numeric chapter_lesson IDs.");
}
if (progressPage.includes(String.raw`const match = /^(\\d+)_(\\d+)$/.exec(String(key));`)) {
  throw new Error("Python progress parser contains an over-escaped digit expression.");
}
const worker = fs.readFileSync("cloudflare-worker/worker.js", "utf8");
const codeRunner = fs.readFileSync("js/code-runner.js", "utf8");
if (!worker.includes('statusId: Number.isInteger(judgeStatusId)') ||
    !worker.includes('"JUDGE0_INTERNAL_ERROR"')) {
  throw new Error("Worker must expose structured Judge0 status diagnostics.");
}
if (!codeRunner.includes('Number(result.statusId) === 13') ||
    !codeRunner.includes('"JUDGE0_INTERNAL_ERROR"')) {
  throw new Error("Code runner must recognize Judge0 status 13.");
}
const functionsSource = fs.readFileSync("functions/index.js", "utf8");
if (!functionsSource.includes("exports.getMyParentLinks") ||
    !functionsSource.includes("exports.removeParentLinkAsChild")) {
  throw new Error("Learner-side parent unlink callables are missing.");
}
console.log("Learning magazine, media and parent-link integration validated.");
