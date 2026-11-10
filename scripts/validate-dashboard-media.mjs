import fs from "node:fs";
import path from "node:path";

const html = fs.readFileSync("dashboard.html", "utf8");
const mediaScript = fs.readFileSync("js/dashboard-media.js", "utf8");
const videos = JSON.parse(fs.readFileSync("json/learning-videos.json", "utf8"));

for (const marker of [
  'id="learningVideos"',
  'id="learningVideosGrid"',
  'id="codyMusicToggle"',
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
  for (const key of ["description", "category", "level"]) {
    if (video[key] !== undefined && typeof video[key] !== "string") {
      throw new Error("Video " + index + " has invalid " + key + ".");
    }
  }
}

const inlineScripts = [...html.matchAll(/<script(?:\s+type="module")?>([\s\S]*?)<\/script>/g)];
if (!inlineScripts.length) throw new Error("Dashboard inline script not found.");
fs.writeFileSync("/tmp/codequest-dashboard-inline.mjs", inlineScripts.map(match => match[1]).join("\n"));

const localRefs = [...html.matchAll(/(?:href|src)\s*=\s*["']([^"'<>]+)["']/gi)];
for (const match of localRefs) {
  const raw = match[1].trim();
  if (!raw || /^(?:#|https?:|mailto:|tel:|javascript:|data:|blob:|\/\/)/i.test(raw)) continue;
  const target = raw.split(/[?#]/)[0].replace(/^\//, "");
  if (target && !fs.existsSync(path.resolve(target))) {
    throw new Error("Missing local dashboard asset: " + raw);
  }
}

if (!mediaScript.includes("youtube-nocookie.com/embed/")) {
  throw new Error("Privacy-enhanced YouTube embed host missing.");
}
if (!mediaScript.includes("audioContext")) {
  throw new Error("Optional ambient audio controller missing.");
}
console.log("Dashboard media integration validated.");
