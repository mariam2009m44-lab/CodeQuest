import { db } from "./firebase-config.js";

import {
  logoutUser,
  requireUser,
  ensureUserProfile
} from "./auth.js";

import {
  doc,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
  getAllAvatars,
  renderAvatar,
  installAvatarStyles
} from "./avatars.js";

/*
 * Cody Academy — Application Controller
 * Authentication, Firestore synchronization,
 * user progress, XP, coins, stars and avatars.
 */

const PUBLIC_PAGES = new Set([
  "index.html",
  "login.html",
  "signup.html",
  "register.html",
  "forgot-password.html",
  "reset-password.html"
]);

const LANGUAGES = {
  python: {
    file: "./json/python_curriculum.json",
    selector: ".course-python .course-progress"
  },

  javascript: {
    file: "./json/js_curriculum.json",
    selector: ".course-javascript .course-progress"
  },

  cpp: {
    file: "./json/cpp_curriculum.json",
    selector: ".course-cpp .course-progress"
  }
};

const DEFAULT_AVATAR = "cody";

/* =========================================
   General helpers
========================================= */

function currentPage() {
  return location.pathname.split("/").pop() || "index.html";
}

function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";

    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");

    container.style.cssText =
      "position:fixed;bottom:20px;left:20px;z-index:9999;" +
      "display:flex;flex-direction:column;gap:10px;" +
      "max-width:calc(100vw - 40px)";

    document.body.appendChild(container);
  }

  const toast = document.createElement("div");

  const colors = {
    error: "#e74c3c",
    warning: "#f39c12",
    success: "#2ecc71",
    info: "#344054"
  };

  toast.setAttribute(
    "role",
    type === "error" ? "alert" : "status"
  );

  toast.style.cssText =
    "padding:12px 20px;border-radius:12px;color:white;" +
    "font-size:14px;font-weight:600;overflow-wrap:anywhere;" +
    `background:${colors[type] || colors.info}`;

  toast.textContent = String(message);

  container.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();

    if (!container.childElementCount) {
      container.remove();
    }
  }, 3500);
}

function setText(selector, value) {
  document.querySelectorAll(selector).forEach(element => {
    element.textContent = String(value ?? 0);
  });
}

function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : 0;
}

function getLoginRedirectUrl() {
  const page = currentPage();

  const safePage = /^[a-zA-Z0-9_-]+\.html$/.test(page)
    ? page
    : "dashboard.html";

  const next = safePage + location.search;

  return `login.html?next=${encodeURIComponent(next)}`;
}

/* =========================================
   Avatar system
========================================= */

function getUserAvatarId(userData = {}) {
  const avatars = getAllAvatars();

  const activeAvatar =
    typeof userData.activeAvatar === "string"
      ? userData.activeAvatar
      : DEFAULT_AVATAR;

  const inventory = Array.isArray(userData.inventory)
    ? userData.inventory
    : [];

  const selectedAvatar = avatars.find(avatar => {
    if (avatar.id !== activeAvatar) {
      return false;
    }

    if (!avatar.storeItem) {
      return true;
    }

    return inventory.includes(avatar.id);
  });

  return selectedAvatar?.id || DEFAULT_AVATAR;
}

function renderUserAvatar(userData = {}) {
  const dashboardContainer = document.getElementById(
    "dashboardAvatarArt"
  );

  const profileContainer = document.getElementById(
    "userAvatar"
  );

  if (!dashboardContainer && !profileContainer) {
    return;
  }

  installAvatarStyles();

  const avatarId = getUserAvatarId(userData);
  const avatarHTML = renderAvatar(avatarId);

  if (dashboardContainer) {
    dashboardContainer.innerHTML = avatarHTML;
  }

  if (profileContainer) {
    profileContainer.innerHTML = avatarHTML;
  }
}

/* =========================================
   Progress system
========================================= */

function setProgress(selector, value) {
  const percentage = Math.max(
    0,
    Math.min(100, safeNumber(value))
  );

  document.querySelectorAll(selector).forEach(bar => {
    const fill = bar.querySelector(".course-progress-fill");

    if (fill) {
      fill.style.width = `${percentage}%`;
    }

    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    bar.setAttribute("aria-valuenow", String(percentage));

    const label = bar
      .closest(".course-card")
      ?.querySelector(".course-progress-info strong");

    if (label) {
      label.textContent = `${percentage}%`;
    }
  });
}

async function loadCurriculumTotals() {
  const totals = {};

  await Promise.all(
    Object.entries(LANGUAGES).map(async ([language, config]) => {
      try {
        const response = await fetch(config.file, {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${config.file}`
          );
        }

        const curriculum = await response.json();

        if (!Array.isArray(curriculum.chapters)) {
          throw new Error("تنسيق المنهج غير صحيح.");
        }

        totals[language] = curriculum.chapters.map(chapter =>
          Array.isArray(chapter?.lessons)
            ? chapter.lessons.length
            : 0
        );

      } catch (error) {
        console.error(
          `تعذر تحميل منهج ${language}:`,
          error
        );

        totals[language] = null;
      }
    })
  );

  return totals;
}

function isValidCompletedLesson(item, totals) {
  if (!item || item.completed !== true) {
    return false;
  }

  const language = item.language;

  if (!Object.prototype.hasOwnProperty.call(
    LANGUAGES,
    language
  )) {
    return false;
  }

  if (
    !Number.isSafeInteger(item.chapter) ||
    !Number.isSafeInteger(item.lesson) ||
    item.chapter < 0 ||
    item.lesson < 0
  ) {
    return false;
  }

  const chapters = totals[language];

  if (!Array.isArray(chapters)) {
    return false;
  }

  if (item.chapter >= chapters.length) {
    return false;
  }

  return item.lesson < chapters[item.chapter];
}

/*
 * Python legacy curriculum:
 * 12 chapters × 4 lessons = 48 lessons.
 * lesson === 104 means the chapter exam was passed.
 *
 * JavaScript and C++:
 * Use their JSON curriculum lesson counts.
 */

function calculateLessonStats(documents, totals) {
  const completedByLanguage = {
    python: new Set(),
    javascript: new Set(),
    cpp: new Set()
  };

  for (const item of documents) {
    if (!item || item.completed !== true) {
      continue;
    }

    /* -------------------------------------
       Python legacy curriculum
    ------------------------------------- */

    if (item.language === "python") {
      const chapter = item.chapter;
      const lesson = item.lesson;

      if (
        !Number.isSafeInteger(chapter) ||
        chapter < 0 ||
        chapter >= 12
      ) {
        continue;
      }

      // Chapter exam passed: count all 4 lessons.
      if (lesson === 104) {
        for (let i = 0; i < 4; i++) {
          completedByLanguage.python.add(
            `${chapter}:${i}`
          );
        }

        continue;
      }

      // Normal Python lessons: 0, 1, 2, 3.
      if (
        Number.isSafeInteger(lesson) &&
        lesson >= 0 &&
        lesson < 4
      ) {
        completedByLanguage.python.add(
          `${chapter}:${lesson}`
        );
      }

      continue;
    }

    /* -------------------------------------
       JavaScript and C++
    ------------------------------------- */

    if (!isValidCompletedLesson(item, totals)) {
      continue;
    }

    completedByLanguage[item.language].add(
      `${item.chapter}:${item.lesson}`
    );
  }

  /* -------------------------------------
     Calculate percentages
  ------------------------------------- */

  const percentages = {};

  let completedTotal = 0;

  for (const language of Object.keys(LANGUAGES)) {
    const completed =
      completedByLanguage[language].size;

    completedTotal += completed;

    let totalLessons;

    if (language === "python") {
      totalLessons = 12 * 4;
    } else {
      const chapters = totals[language];

      if (!Array.isArray(chapters)) {
        percentages[language] = null;
        continue;
      }

      totalLessons = chapters.reduce(
        (sum, count) => sum + count,
        0
      );
    }

    percentages[language] = totalLessons > 0
      ? Math.round((completed / totalLessons) * 100)
      : 0;
  }

  return {
    completedTotal,
    percentages
  };
}
/* =========================================
   Main application controller
========================================= */

export const App = {
  user: "متعلم",

  xp: 0,
  stars: 0,
  coins: 0,
  lastKnownRewards: null,

  currentUid: null,

  unsubscribeProfile: null,
  unsubscribeLessonProgress: null,
  unsubscribeProjects: null,

  initPromise: null,

  curriculumTotals: null,
  lessonStats: null,

  init() {
    if (!this.initPromise) {
      this.initPromise = this.initialize().catch(error => {
        console.error("App initialization error:", error);

        this.initPromise = null;
      });
    }

    return this.initPromise;
  },

  async initialize() {
    this.highlightNav();

    this.bindLogout();
    this.bindProtectedLinks();

    if (PUBLIC_PAGES.has(currentPage())) {
      return;
    }

    let user;

    try {
      user = await requireUser();

    } catch (error) {
      console.error(
        "Authentication verification failed:",
        error
      );

      location.replace(getLoginRedirectUrl());
      return;
    }

    if (!user?.uid) {
      location.replace(getLoginRedirectUrl());
      return;
    }

    try {
      await ensureUserProfile(user);

      this.currentUid = user.uid;

      this.curriculumTotals = await loadCurriculumTotals();

      // Prevent duplicate listeners if initialization is repeated.
      this.unsubscribeProfile?.();
      this.unsubscribeLessonProgress?.();
      this.unsubscribeProjects?.();

      /* -------------------------------------
         User profile listener
      ------------------------------------- */

      this.unsubscribeProfile = onSnapshot(
        doc(db, "users", user.uid),

        snapshot => {
          if (!snapshot.exists()) {
            showToast("ملف الحساب غير موجود.", "error");
            return;
          }

          const data = snapshot.data();

          this.user =
            data.displayName ||
            user.displayName ||
            "متعلم";

          const nextXP = safeNumber(data.xp);
          const nextStars = safeNumber(data.stars);
          const previousRewards = this.lastKnownRewards;

          this.xp = nextXP;
          this.stars = nextStars;
          this.coins = safeNumber(data.coins);

          // Celebrate only when Firestore confirms a real reward increase.
          if (
            previousRewards &&
            (nextXP > previousRewards.xp || nextStars > previousRewards.stars)
          ) {
            window.dispatchEvent(new CustomEvent("codequest:cody-emotion", {
              detail: { emotion: "celebrate", reason: "reward-earned" }
            }));
          }

          this.lastKnownRewards = { xp: nextXP, stars: nextStars };
          this.updateUI(data);
        },

        error => {
          console.error(
            "Profile subscription error:",
            error
          );

          showToast(
            "تعذر تحديث بيانات الحساب.",
            "error"
          );
        }
      );

      /* -------------------------------------
         Saved projects listener
      ------------------------------------- */

      // Count the signed-in user's saved projects directly
      // from Firestore. This listener updates automatically
      // after project creation, editing, or deletion.

      this.unsubscribeProjects = onSnapshot(
        query(
          collection(db, "projects"),
          where("userId", "==", user.uid)
        ),

        snapshot => {
          setText(
            ".js-completed-projects",
            snapshot.size
          );
        },

        error => {
          console.error(
            "Saved projects subscription error:",
            error
          );

          showToast(
            "تعذر تحديث عدد المشروعات المحفوظة.",
            "error"
          );
        }
      );

      /* -------------------------------------
         Lesson progress listener
      ------------------------------------- */

      this.unsubscribeLessonProgress = onSnapshot(
        collection(
          db,
          "users",
          user.uid,
          "lessonProgress"
        ),

        snapshot => {
          const documents = snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
          }));

          this.lessonStats = calculateLessonStats(
            documents,
            this.curriculumTotals || {}
          );

          this.updateLessonProgressUI();
        },

        error => {
          console.error(
            "Lesson progress error:",
            error
          );

          showToast(
            "تعذر تحميل تقدم الدروس من حسابك.",
            "error"
          );
        }
      );

    } catch (error) {
      console.error(
        "Profile initialization error:",
        error
      );

      showToast(
        "تعذر تحميل بيانات حسابك.",
        "error"
      );
    }
  },

  /* =====================================
     Update user interface
  ===================================== */

  updateUI(data = {}) {
    const totalXP = safeNumber(this.xp);
    const level = Math.floor(totalXP / 100) + 1;
    const xpInLevel = totalXP % 100;

    setText(".js-user-name", this.user);
    setText(".js-user-xp", totalXP);

    // Separate balances: stars are not coins.
    setText(".js-user-stars", this.stars);
    setText(".js-user-coins", this.coins);

    setText(".js-user-level", level);

    setText("#userLevel", level);
    setText("#currentXP", xpInLevel);
    setText("#currentXPLabel", totalXP);
    setText("#xpProgressText", `${xpInLevel}%`);

    renderUserAvatar(data);

    const progressBar = document.getElementById(
      "xpProgressBar"
    );

    if (progressBar) {
      progressBar.style.width = `${xpInLevel}%`;
    }

    const progressTrack = document.querySelector(
      ".profile-progress-track[role='progressbar']"
    );

    if (progressTrack) {
      progressTrack.setAttribute("aria-valuemin", "0");
      progressTrack.setAttribute("aria-valuemax", "100");
      progressTrack.setAttribute(
        "aria-valuenow",
        String(xpInLevel)
      );
    }

    if (!this.lessonStats) {
      setText(
        ".js-completed-lessons",
        safeNumber(data.completedLessons)
      );
    }

    // Saved projects are counted by the dedicated
    // Firestore listener, not by the user profile document.

    setText(
      ".js-learning-streak",
      safeNumber(data.streak)
    );

    if (!this.lessonStats) {
      const progress = data.languageProgress || {};

      for (const [language, config] of Object.entries(LANGUAGES)) {
        if (progress[language] !== undefined) {
          setProgress(
            config.selector,
            progress[language]
          );
        }
      }
    }
  },

  /* =====================================
     Update lesson progress interface
  ===================================== */

  updateLessonProgressUI() {
    if (!this.lessonStats) {
      return;
    }

    setText(
      ".js-completed-lessons",
      this.lessonStats.completedTotal
    );

    for (const [language, percentage] of Object.entries(
      this.lessonStats.percentages
    )) {
      if (percentage === null) {
        console.warn(
          `لم يتم حساب نسبة ${language} لتعذر تحميل المنهج.`
        );

        continue;
      }

      setProgress(
        LANGUAGES[language].selector,
        percentage
      );
    }
  },
  /* =====================================
     Protected navigation
  ===================================== */

  bindProtectedLinks() {
    document.querySelectorAll("[data-protected]").forEach(link => {
      if (!PUBLIC_PAGES.has(currentPage())) {
        return;
      }

      if (link.dataset.protectionBound === "true") {
        return;
      }

      link.dataset.protectionBound = "true";

      link.addEventListener("click", async event => {
        event.preventDefault();

        const destination = link.getAttribute("href");

        try {
          await requireUser();

          if (destination) {
            location.href = destination;
          }

        } catch {
          const next = destination || "dashboard.html";

          location.href =
            `login.html?next=${encodeURIComponent(next)}`;
        }
      });
    });
  },

  /* =====================================
     Logout
  ===================================== */

  bindLogout() {
    document.querySelectorAll(
      ".logout, #logoutButton"
    ).forEach(element => {

      if (element.dataset.logoutBound === "true") {
        return;
      }

      element.dataset.logoutBound = "true";

      element.addEventListener("click", async event => {
        event.preventDefault();

        if (element.dataset.logoutPending === "true") {
          return;
        }

        element.dataset.logoutPending = "true";

        element.setAttribute("aria-busy", "true");

        try {
          await logoutUser();

          location.replace("login.html");

        } catch (error) {
          console.error("Logout error:", error);

          delete element.dataset.logoutPending;

          element.removeAttribute("aria-busy");

          showToast(
            "تعذر تسجيل الخروج. حاول مرة أخرى.",
            "error"
          );
        }
      });
    });
  },

  /* =====================================
     Active navigation
  ===================================== */

  highlightNav() {
    const current = currentPage();

    document.querySelectorAll(
      ".nav-link, .mobile-nav a, .nav-item, .mobile-nav-item"
    ).forEach(link => {
      const href = link.getAttribute("href");

      if (!href || href === "#") {
        return;
      }

      try {
        const destination = new URL(
          href,
          location.href
        ).pathname.split("/").pop();

        const active = destination === current;

        link.classList.toggle("active", active);

        if (active) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }

      } catch {
        // Ignore invalid navigation URLs.
      }
    });
  },

  /* =====================================
     Protected economy operations
  ===================================== */

  addXP() {
    throw new Error(
      "لا يمكن منح نقاط الخبرة من المتصفح."
    );
  },

  addCoins() {
    throw new Error(
      "لا يمكن تعديل العملات من المتصفح."
    );
  },

  /* =====================================
     Cleanup
  ===================================== */

  destroy() {
    this.unsubscribeProfile?.();
    this.unsubscribeProfile = null;

    this.unsubscribeLessonProgress?.();
    this.unsubscribeLessonProgress = null;

    this.unsubscribeProjects?.();
    this.unsubscribeProjects = null;

    this.currentUid = null;

    this.xp = 0;
    this.stars = 0;
    this.coins = 0;
    this.lastKnownRewards = null;

    this.lessonStats = null;
    this.curriculumTotals = null;

    this.initPromise = null;
  }
};

/* =========================================
   Application startup
========================================= */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => App.init(),
    { once: true }
  );

} else {
  App.init();
}