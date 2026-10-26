import { auth, db } from "./firebase-config.js";

import {
  logoutUser,
  requireUser,
  ensureUserProfile
} from "./auth.js";

import {
  doc,
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

/*
 * Cody Academy — Application Controller
 * - يحمي الصفحات الخاصة بالحساب.
 * - يسمح للصفحة الرئيسية بالعمل دون تسجيل دخول.
 * - يعرض تقدم الدروس من Firestore دون تعديل XP أو العملات.
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

/*
 * تحميل عدد الدروس الفعلي من ملفات المنهج.
 * لا نفترض أن كل لغة تحتوي على العدد نفسه من الدروس.
 */
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

  // لو تعذر تحميل المنهج، لا نخمن صحة أرقام الدروس.
  if (!Array.isArray(chapters)) {
    return false;
  }

  if (item.chapter >= chapters.length) {
    return false;
  }

  return item.lesson < chapters[item.chapter];
}

function calculateLessonStats(documents, totals) {
  const completedByLanguage = {
    python: new Set(),
    javascript: new Set(),
    cpp: new Set()
  };

  for (const item of documents) {
    if (!isValidCompletedLesson(item, totals)) {
      continue;
    }

    const key = `${item.chapter}:${item.lesson}`;

    completedByLanguage[item.language].add(key);
  }

  const percentages = {};

  let completedTotal = 0;

  for (const language of Object.keys(LANGUAGES)) {
    const completed = completedByLanguage[language].size;
    const chapters = totals[language];

    completedTotal += completed;

    if (!Array.isArray(chapters)) {
      percentages[language] = null;
      continue;
    }

    const total = chapters.reduce(
      (sum, count) => sum + count,
      0
    );

    percentages[language] = total > 0
      ? Math.round((completed / total) * 100)
      : 0;
  }

  return {
    completedTotal,
    percentages
  };
}

export const App = {
  user: "متعلم",
  xp: 0,
  coins: 0,
  currentUid: null,

  unsubscribeProfile: null,
  unsubscribeLessonProgress: null,

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

    /*
     * الصفحة الرئيسية وصفحات الدخول عامة.
     * لا تحوّل الزائر إلى صفحة تسجيل الدخول لمجرد
     * أنه فتح الصفحة الرئيسية.
     */
    if (PUBLIC_PAGES.has(currentPage())) {
      return;
    }

    let user;

    try {
      user = await requireUser();
    } catch (error) {
      console.error("Authentication verification failed:", error);

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

      this.unsubscribeProfile?.();
      this.unsubscribeLessonProgress?.();

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

          this.xp = safeNumber(data.xp);
          this.coins = safeNumber(data.coins);

          this.updateUI(data);
        },

        error => {
          console.error("Profile subscription error:", error);
          showToast("تعذر تحديث بيانات الحساب.", "error");
        }
      );

      /*
       * قراءة تقدم الدروس من المصدر الذي تحفظ فيه
       * lecture.html الدروس المكتملة فعلًا.
       */
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
          console.error("Lesson progress error:", error);

          showToast(
            "تعذر تحميل تقدم الدروس من حسابك.",
            "error"
          );
        }
      );
    } catch (error) {
      console.error("Profile initialization error:", error);

      showToast("تعذر تحميل بيانات حسابك.", "error");
    }
  },

  updateUI(data = {}) {
    const level = Math.floor(this.xp / 100) + 1;
    const xpInLevel = this.xp % 100;

    setText(".js-user-name", this.user);
    setText(".js-user-xp", this.xp);
    setText(".js-user-coins", this.coins);
    setText(".js-user-level", level);

    setText("#userLevel", level);
    setText("#currentXP", xpInLevel);

    const progressBar = document.getElementById("xpProgressBar");

    if (progressBar) {
      progressBar.style.width = `${xpInLevel}%`;
    }

    /*
     * عدد الدروس يُحدّث من مجموعة lessonProgress،
     * ولا نستخدم completedLessons القديم كمصدر للحقيقة.
     */
    if (!this.lessonStats) {
      setText(
        ".js-completed-lessons",
        safeNumber(data.completedLessons)
      );
    }

    setText(
      ".js-completed-projects",
      safeNumber(data.completedProjects)
    );

    setText(
      ".js-learning-streak",
      safeNumber(data.streak)
    );

    /*
     * لو لم يصل تحديث تقدم الدروس بعد، نعرض النسب
     * المحفوظة مؤقتًا في ملف المستخدم.
     */
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

  updateLessonProgressUI() {
    if (!this.lessonStats) return;

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

  bindProtectedLinks() {
    document.querySelectorAll("[data-protected]").forEach(link => {
      if (link.dataset.protectionBound === "true") {
        return;
      }

      link.dataset.protectionBound = "true";

      link.addEventListener("click", async event => {
        /*
         * إذا كانت الصفحة نفسها عامة، نتحقق من الدخول
         * عند الضغط على رابط محمي فقط.
         */
        if (!PUBLIC_PAGES.has(currentPage())) {
          return;
        }

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

  bindLogout() {
    document.querySelectorAll(".logout, #logoutButton").forEach(
      element => {
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
              "تعذر تسجيل الخروج. حاولي مرة أخرى.",
              "error"
            );
          }
        });
      }
    );
  },

  highlightNav() {
    const current = currentPage();

    document.querySelectorAll(
      ".nav-link, .mobile-nav a, .nav-item, .mobile-nav-item"
    ).forEach(link => {
      const href = link.getAttribute("href");

      if (!href || href === "#") return;

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
        // تجاهل روابط التنقل غير الصالحة.
      }
    });
  },

  // لا تمنح نقاطًا أو عملات مباشرة من المتصفح.
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

  destroy() {
    this.unsubscribeProfile?.();
    this.unsubscribeProfile = null;

    this.unsubscribeLessonProgress?.();
    this.unsubscribeLessonProgress = null;

    this.currentUid = null;
    this.lessonStats = null;
    this.curriculumTotals = null;
    this.initPromise = null;
  }
};

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => App.init(),
    { once: true }
  );
} else {
  App.init();
}