const grid = document.getElementById("learningVideosGrid");
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

function renderVideo(item, index) {
  const card = makeElement("article", "learning-video-card");
  card.style.setProperty("--magazine-order", String(index));
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
  const grid = document.getElementById("learningVideosGrid");
  if (!grid) return;
  try {
    const response = await fetch("json/learning-videos.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const videos = await response.json();
    if (!Array.isArray(videos)) throw new Error("قائمة الفيديوهات غير صالحة.");
    const valid = videos.filter(validVideo);
    if (!valid.length) {
      grid.replaceChildren();
      const empty = makeElement("div", "learning-videos-empty");
      empty.append(makeElement("span", "learning-videos-empty-icon", "✦"));
      empty.append(makeElement("strong", "", "مجلة كودي التعليمية"));
      empty.append(makeElement("p", "", "ستظهر هنا الفيديوهات التي تضيفينها، مرتبة في أقسام تعليمية سهلة التصفح."));
      grid.append(empty);
      return;
    }
    grid.replaceChildren(...valid.map(renderVideo));
  } catch (error) {
    console.error("تعذر تحميل فيديوهات الشرح:", error);
    grid.replaceChildren(makeElement("p", "learning-videos-empty", "تعذر تحميل المجلة التعليمية حاليًا. حاولي مرة أخرى لاحقًا."));
  }
}
loadLearningVideos();
