const root = document.getElementById("learningMagazine");
if (root) {
  const $ = (id) => root.querySelector("#" + id);
  const heroImage = $("magazineHeroImage");
  const heroEyebrow = $("magazineHeroEyebrow");
  const heroTitle = $("magazineHeroTitle");
  const heroDescription = $("magazineHeroDescription");
  const heroLevel = $("magazineHeroLevel");
  const heroLink = $("magazineHeroLink");
  const dotsRoot = $("magazineHeroDots");
  const grid = $("magazineSeriesGrid");
  const filtersRoot = $("magazineFilters");
  const countNode = $("magazineSeriesCount");
  const pauseButton = $("magazinePause");
  const previousButton = $("magazinePrevious");
  const nextButton = $("magazineNext");

  let magazineData = { slides: [], series: [] };
  let activeCategory = "الكل";
  let activeSlide = 0;
  let timer = null;
  let paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const validId = (value) => typeof value === "string" && /^[A-Za-z0-9_-]{11}$/.test(value);
  const validPlaylist = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "www.youtube.com" &&
        url.pathname === "/playlist" && /^[A-Za-z0-9_-]{10,}$/.test(url.searchParams.get("list") || "");
    } catch { return false; }
  };

  function updatePauseButton() {
    pauseButton.textContent = paused ? "تشغيل العرض" : "إيقاف الحركة";
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.setAttribute("aria-label", paused ? "تشغيل انتقال الصور تلقائيًا" : "إيقاف انتقال الصور تلقائيًا");
  }

  function renderSlide(index) {
    if (!magazineData.slides.length) return;
    activeSlide = (index + magazineData.slides.length) % magazineData.slides.length;
    const slide = magazineData.slides[activeSlide];
    heroImage.classList.add("is-changing");
    const nextSrc = `https://img.youtube.com/vi/${slide.youtubeId}/maxresdefault.jpg`;
    const fallbackSrc = `https://img.youtube.com/vi/${slide.youtubeId}/hqdefault.jpg`;
    heroImage.onerror = () => {
      heroImage.onerror = null;
      heroImage.src = fallbackSrc;
    };
    heroImage.onload = () => heroImage.classList.remove("is-changing");
    heroImage.src = nextSrc;
    heroImage.alt = "غلاف سلسلة " + slide.category;
    heroEyebrow.textContent = slide.eyebrow;
    heroTitle.textContent = slide.title;
    heroDescription.textContent = slide.description;
    heroLevel.textContent = slide.level;
    heroLink.href = slide.playlistUrl;
    heroLink.setAttribute("aria-label", "افتح سلسلة " + slide.category + " على يوتيوب");
    [...dotsRoot.children].forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === activeSlide);
      dot.setAttribute("aria-pressed", String(dotIndex === activeSlide));
    });
  }

  function startTimer() {
    stopTimer();
    if (paused || magazineData.slides.length < 2) return;
    timer = window.setInterval(() => {
      if (!document.hidden) renderSlide(activeSlide + 1);
    }, 6500);
  }

  function stopTimer() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function buildDots() {
    dotsRoot.replaceChildren();
    magazineData.slides.forEach((slide, index) => {
      const dot = make("button", "magazine-dot", "");
      dot.type = "button";
      dot.setAttribute("aria-label", "عرض " + slide.category);
      dot.setAttribute("aria-pressed", "false");
      dot.addEventListener("click", () => {
        renderSlide(index);
        startTimer();
      });
      dotsRoot.append(dot);
    });
  }

  function renderFilters() {
    const categories = ["الكل", ...magazineData.series.map(item => item.name)];
    filtersRoot.replaceChildren();
    categories.forEach(category => {
      const button = make("button", "magazine-chip" + (category === activeCategory ? " is-active" : ""), category);
      button.type = "button";
      button.setAttribute("aria-pressed", String(category === activeCategory));
      button.addEventListener("click", () => {
        activeCategory = category;
        renderFilters();
        renderSeries();
      });
      filtersRoot.append(button);
    });
  }

  function renderSeries() {
    const series = activeCategory === "الكل"
      ? magazineData.series
      : magazineData.series.filter(item => item.name === activeCategory);
    countNode.textContent = series.length + " سلاسل تعليمية مختارة";
    grid.replaceChildren();
    series.forEach((item, index) => {
      const card = make("article", "magazine-series-card");
      const cover = make("div", "magazine-series-cover");
      const image = document.createElement("img");
      image.src = `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`;
      image.alt = "";
      image.loading = index < 3 ? "eager" : "lazy";
      image.decoding = "async";
      image.onerror = () => { image.hidden = true; cover.classList.add("has-no-image"); };
      const label = make("span", "magazine-series-mark", item.name);
      const play = make("button", "magazine-series-play", "شاهد الآن");
      play.type = "button";
      play.setAttribute("aria-label", "شاهد فيديو " + item.name + " داخل المنصة");
      play.innerHTML = '<i class="ri-play-fill" aria-hidden="true"></i><span>شاهد الآن</span>';
      play.addEventListener("click", () => {
        if (cover.querySelector("iframe")) return;
        const player = document.createElement("iframe");
        player.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(item.youtubeId) + "?autoplay=1&rel=0&modestbranding=1";
        player.title = "فيديو تعليمي: " + item.name;
        player.loading = "lazy";
        player.referrerPolicy = "strict-origin-when-cross-origin";
        player.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        player.allowFullscreen = true;
        cover.classList.add("is-playing");
        cover.replaceChildren(player);
      });
      cover.append(image, label, play);
      const content = make("div", "magazine-series-content");
      const meta = make("div", "magazine-series-meta");
      meta.append(make("span", "magazine-series-group", item.group));
      meta.append(make("span", "magazine-series-level", item.level));
      content.append(meta, make("h3", "", item.name), make("p", "", item.description));
      const footer = make("div", "magazine-series-footer");
      footer.append(make("span", "", item.provider));
      const link = make("a", "magazine-series-link", "ابدأ السلسلة");
      link.href = "https://www.youtube.com/playlist?list=" + encodeURIComponent(item.playlistId);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", "افتح سلسلة " + item.name + " على يوتيوب");
      footer.append(link);
      content.append(footer);
      card.append(cover, content);
      grid.append(card);
    });
  }

  pauseButton.addEventListener("click", () => {
    paused = !paused;
    updatePauseButton();
    startTimer();
  });
  previousButton.addEventListener("click", () => { renderSlide(activeSlide - 1); startTimer(); });
  nextButton.addEventListener("click", () => { renderSlide(activeSlide + 1); startTimer(); });
  root.addEventListener("mouseenter", stopTimer);
  root.addEventListener("mouseleave", startTimer);
  root.addEventListener("focusin", stopTimer);
  root.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget)) startTimer();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopTimer();
    else startTimer();
  });

  async function loadMagazine() {
    try {
      const response = await fetch("json/learning-videos.json", { cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      if (!data || !Array.isArray(data.slides) || !Array.isArray(data.series)) {
        throw new Error("تنسيق المجلة غير صحيح.");
      }
      magazineData.slides = data.slides.filter(item =>
        item && typeof item.title === "string" && typeof item.description === "string" &&
        typeof item.category === "string" && validId(item.youtubeId) && validPlaylist(item.playlistUrl)
      );
      magazineData.series = data.series.filter(item =>
        item && typeof item.id === "string" && typeof item.name === "string" &&
        typeof item.description === "string" && validId(item.youtubeId) &&
        /^[A-Za-z0-9_-]{10,}$/.test(item.playlistId || "") &&
        typeof item.provider === "string" && typeof item.group === "string"
      );
      if (!magazineData.slides.length || !magazineData.series.length) {
        throw new Error("لا توجد سلاسل صالحة للعرض.");
      }
      buildDots();
      renderSlide(0);
      renderFilters();
      renderSeries();
      updatePauseButton();
      startTimer();
    } catch (error) {
      console.error("تعذر تحميل المجلة التعليمية:", error);
      grid.replaceChildren(make("p", "magazine-load-error", "تعذر تحميل المجلة الآن. حاولي تحديث الصفحة بعد قليل."));
    }
  }
  loadMagazine();
}
