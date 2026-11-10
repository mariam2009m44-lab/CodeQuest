const grid = document.getElementById("learningVideosGrid");
const filtersRoot = document.getElementById("learningVideoFilters");
const countNode = document.getElementById("learningVideoCount");
let allVideos = [];
let activeCategory = "الكل";

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
    (item.level === undefined || typeof item.level === "string") &&
    (item.duration === undefined || typeof item.duration === "string") &&
    (item.featured === undefined || typeof item.featured === "boolean");
}

function renderVideo(item, index) {
  const card = makeElement("article", "learning-video-card" + (item.featured ? " is-featured" : ""));
  const frame = makeElement("div", "learning-video-frame");
  const thumbnail = document.createElement("img");
  thumbnail.className = "learning-video-thumbnail";
  thumbnail.src = `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`;
  thumbnail.alt = "";
  thumbnail.loading = index < 3 ? "eager" : "lazy";
  thumbnail.decoding = "async";
  const play = makeElement("button", "learning-video-play");
  play.type = "button";
  play.setAttribute("aria-label", `تشغيل فيديو: ${item.title}`);
  play.innerHTML = '<i class="ri-play-fill" aria-hidden="true"></i>';
  play.addEventListener("click", () => {
    if (frame.querySelector("iframe")) return;
    const player = document.createElement("iframe");
    player.src = `https://www.youtube-nocookie.com/embed/${item.youtubeId}?autoplay=1&rel=0&modestbranding=1`;
    player.title = item.title;
    player.loading = "lazy";
    player.referrerPolicy = "strict-origin-when-cross-origin";
    player.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    player.allowFullscreen = true;
    frame.replaceChildren(player);
  });
  frame.append(thumbnail, play);
  const info = makeElement("div", "learning-video-info");
  const meta = makeElement("div", "learning-video-meta");
  meta.append(makeElement("span", "learning-video-category", item.category || "مختارات كودي"));
  if (item.level) meta.append(makeElement("span", "learning-video-level", item.level));
  if (item.duration) meta.append(makeElement("span", "learning-video-duration", item.duration));
  info.append(meta, makeElement("h3", "", item.title.trim()));
  if (item.description) info.append(makeElement("p", "", item.description.trim()));
  card.append(frame, info);
  return card;
}

function renderFilters(videos) {
  if (!filtersRoot) return;
  const categories = ["الكل", ...new Set(videos.map(video => video.category).filter(Boolean))];
  filtersRoot.replaceChildren();
  categories.forEach(category => {
    const button = makeElement("button", "magazine-filter" + (category === activeCategory ? " is-active" : ""), category);
    button.type = "button";
    button.setAttribute("aria-pressed", String(category === activeCategory));
    button.addEventListener("click", () => {
      activeCategory = category;
      renderFilters(allVideos);
      renderCards();
    });
    filtersRoot.append(button);
  });
}

function renderCards() {
  if (!grid) return;
  const filtered = activeCategory === "الكل"
    ? allVideos
    : allVideos.filter(video => video.category === activeCategory);
  if (countNode) countNode.textContent = filtered.length ? `${filtered.length} فيديو تعليمي` : "لا توجد فيديوهات في هذا القسم بعد";
  if (!filtered.length) {
    const empty = makeElement("div", "learning-videos-empty");
    empty.append(makeElement("span", "learning-videos-empty-icon", "✦"));
    empty.append(makeElement("strong", "", activeCategory === "الكل" ? "مجلة كودي التعليمية" : "قريبًا في هذا القسم"));
    empty.append(makeElement("p", "", activeCategory === "الكل"
      ? "المجلة جاهزة لاستقبال مقاطع قصيرة ومركزة. أضيفي فيديوهات تعليمية مختارة، وسيظهر لكل فيديو غلاف وتصنيف ومستوى."
      : "سنضيف محتوى هذا القسم قريبًا."));
    grid.replaceChildren(empty);
    return;
  }
  grid.replaceChildren(...filtered.map(renderVideo));
}

async function loadLearningVideos() {
  if (!grid) return;
  try {
    const response = await fetch("json/learning-videos.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const videos = await response.json();
    if (!Array.isArray(videos)) throw new Error("قائمة الفيديوهات غير صالحة.");
    allVideos = videos.filter(validVideo);
    allVideos.sort((a,b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    renderFilters(allVideos);
    renderCards();
  } catch (error) {
    console.error("تعذر تحميل فيديوهات الشرح:", error);
    grid.replaceChildren(makeElement("p", "learning-videos-empty", "تعذر تحميل المجلة التعليمية حاليًا. حاولي مرة أخرى لاحقًا."));
  }
}
loadLearningVideos();
