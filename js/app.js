
import { auth, db } from "./firebase-config.js";
import {
  logoutUser,
  requireUser,
  ensureUserProfile
} from "./auth.js";

import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

  toast.setAttribute("role", type === "error" ? "alert" : "status");
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
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function getLoginRedirectUrl() {
  const currentPage =
    window.location.pathname.split("/").pop() || "dashboard.html";

  const safePage = /^[a-zA-Z0-9_-]+\.html$/.test(currentPage)
    ? currentPage
    : "dashboard.html";

  const next = safePage + window.location.search;
  return `login.html?next=${encodeURIComponent(next)}`;
}

function setProgress(selector, value) {
  const percentage = Math.max(0, Math.min(100, safeNumber(value)));

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

export const App = {
  user: "متعلم",
  xp: 0,
  coins: 0,
  currentUid: null,
  unsubscribeProfile: null,
  initPromise: null,

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

    let user;

    try {
      user = await requireUser();
    } catch (error) {
      console.error("Authentication verification failed:", error);

      if (!location.pathname.endsWith("/login.html")) {
        location.replace(getLoginRedirectUrl());
      }

      return;
    }

    if (!user?.uid) {
      location.replace(getLoginRedirectUrl());
      return;
    }

    try {
      await ensureUserProfile(user);

      this.unsubscribeProfile?.();
      this.currentUid = user.uid;

      this.unsubscribeProfile = onSnapshot(
        doc(db, "users", user.uid),
        snapshot => {
          if (!snapshot.exists()) {
            showToast("ملف الحساب غير موجود.", "error");
            return;
          }

          const data = snapshot.data();

          this.user =
            data.displayName || user.displayName || "متعلم";
          this.xp = safeNumber(data.xp);
          this.coins = safeNumber(data.coins);

          this.updateUI(data);
        },
        error => {
          console.error("Profile subscription error:", error);
          showToast("تعذر تحديث بيانات الحساب.", "error");
        }
      );
    } catch (error) {
      console.error("Profile initialization error:", error);
      showToast("تعذر تحميل ملفك الشخصي.", "error");
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

    setText(
      ".js-completed-lessons",
      safeNumber(data.completedLessons)
    );
    setText(
      ".js-completed-projects",
      safeNumber(data.completedProjects)
    );
    setText(
      ".js-learning-streak",
      safeNumber(data.streak)
    );

    const progress = data.languageProgress || {};

    if (progress.python !== undefined) {
      setProgress(".course-python .course-progress", progress.python);
    }

    if (progress.javascript !== undefined) {
      setProgress(
        ".course-javascript .course-progress",
        progress.javascript
      );
    }

    if (progress.cpp !== undefined) {
      setProgress(".course-cpp .course-progress", progress.cpp);
    }
  },

  bindLogout() {
    document.querySelectorAll(".logout, #logoutButton").forEach(element => {
      if (element.dataset.logoutBound === "true") return;

      element.dataset.logoutBound = "true";

      element.addEventListener("click", async event => {
        event.preventDefault();

        if (element.dataset.logoutPending === "true") return;

        element.dataset.logoutPending = "true";
        element.setAttribute("aria-busy", "true");

        try {
          await logoutUser();
          location.replace("login.html");
        } catch (error) {
          console.error("Logout error:", error);
          delete element.dataset.logoutPending;
          element.removeAttribute("aria-busy");
          showToast("تعذر تسجيل الخروج. حاولي مرة أخرى.", "error");
        }
      });
    });
  },

  highlightNav() {
    const current =
      location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(
      ".nav-link, .mobile-nav a, .nav-item, .mobile-nav-item"
    ).forEach(link => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      try {
        const destination = new URL(href, location.href)
          .pathname.split("/").pop();

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

  addXP() {
    throw new Error("لا يمكن منح نقاط الخبرة من المتصفح.");
  },

  addCoins() {
    throw new Error("لا يمكن تعديل العملات من المتصفح.");
  },

  destroy() {
    this.unsubscribeProfile?.();
    this.unsubscribeProfile = null;
    this.currentUid = null;
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
