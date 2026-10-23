
import { db } from "./firebase-config.js";
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
    container.style.cssText = [
      "position:fixed",
      "bottom:20px",
      "left:20px",
      "z-index:9999",
      "display:flex",
      "flex-direction:column",
      "gap:10px",
      "max-width:calc(100vw - 40px)"
    ].join(";");

    document.body.appendChild(container);
  }

  const toast = document.createElement("div");

  const backgrounds = {
    error: "#e74c3c",
    warning: "#f39c12",
    success: "#2ecc71",
    info: "#344054"
  };

  toast.setAttribute("role", type === "error" ? "alert" : "status");

  toast.style.cssText = [
    "padding:12px 20px",
    "border-radius:12px",
    "color:#fff",
    "font-size:14px",
    "font-weight:600",
    "box-shadow:0 8px 20px rgba(0,0,0,0.15)",
    "overflow-wrap:anywhere",
    `background:${backgrounds[type] || backgrounds.info}`
  ].join(";");

  toast.textContent = String(message);
  container.appendChild(toast);

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";

    window.setTimeout(() => {
      toast.remove();

      if (container.childElementCount === 0) {
        container.remove();
      }
    }, 300);
  }, 3500);
}

function setText(selector, value) {
  const element = document.querySelector(selector);

  if (element) {
    element.textContent = String(value);
  }
}

function toSafeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return number;
}

function setProgress(selector, value) {
  const progress = Math.max(
    0,
    Math.min(100, toSafeNumber(value))
  );

  const bar = document.querySelector(selector);

  if (!bar) return;

  const fill = bar.querySelector(".course-progress-fill");

  if (fill) {
    fill.style.width = `${progress}%`;
  }

  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", "100");
  bar.setAttribute("aria-valuenow", String(progress));

  const card = bar.closest(".course-card");
  const label = card?.querySelector(".course-progress-info strong");

  if (label) {
    label.textContent = `${progress}%`;
  }
}

function getLoginRedirectUrl() {
  const currentPage =
    window.location.pathname.split("/").pop() || "dashboard.html";

  const isValidPage = /^[a-zA-Z0-9_-]+\.html$/.test(currentPage);

  const nextPage = isValidPage
    ? currentPage + window.location.search
    : "dashboard.html";

  return `login.html?next=${encodeURIComponent(nextPage)}`;
}

export const App = {
  user: "متعلم",
  xp: 0,
  coins: 0,
  unsubscribeProfile: null,
  initPromise: null,
  currentUid: null,

  init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initialize();

    this.initPromise.catch(error => {
      console.error("App initialization error:", error);
      this.initPromise = null;
    });

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

      if (!window.location.pathname.endsWith("/login.html")) {
        window.location.replace(getLoginRedirectUrl());
      }

      return;
    }

    if (!user?.uid) {
      window.location.replace(getLoginRedirectUrl());
      return;
    }

    try {
      await ensureUserProfile(user);

      this.unsubscribeProfile?.();
      this.unsubscribeProfile = null;
      this.currentUid = user.uid;

      const profileReference = doc(db, "users", user.uid);

      this.unsubscribeProfile = onSnapshot(
        profileReference,
        snapshot => {
          if (!snapshot.exists()) {
            showToast(
              "لم يتم العثور على بيانات حسابك. أعيدي تحميل الصفحة.",
              "warning"
            );
            return;
          }

          const data = snapshot.data();

          this.user =
            data.displayName ||
            user.displayName ||
            "متعلم";

          this.xp = toSafeNumber(data.xp);
          this.coins = toSafeNumber(data.coins);

          this.updateUI(data);
        },
        error => {
          console.error("Profile subscription error:", error);

          showToast(
            "تعذر تحديث بيانات حسابك. تحققي من الاتصال والصلاحيات.",
            "error"
          );
        }
      );
    } catch (error) {
      console.error("Profile initialization error:", error);

      showToast(
        "تعذر تحميل ملفك الشخصي. حاولي تحديث الصفحة.",
        "error"
      );
    }
  },

  toSafeNumber(value) {
    return toSafeNumber(value);
  },

  bindLogout() {
    document
      .querySelectorAll(".logout, #logoutButton")
      .forEach(element => {
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
      });
  },

  updateUI(data = {}) {
    const level = Math.floor(this.xp / 100) + 1;

    setText(".js-user-name", this.user);
    setText(".js-user-xp", this.xp);
    setText(".js-user-coins", this.coins);
    setText(".js-user-level", level);

    setText(
      ".js-completed-lessons",
      toSafeNumber(data.completedLessons)
    );

    setText(
      ".js-completed-projects",
      toSafeNumber(data.completedProjects)
    );

    setText(
      ".js-learning-streak",
      toSafeNumber(data.streak)
    );

    const progress =
      data.languageProgress &&
      typeof data.languageProgress === "object"
        ? data.languageProgress
        : {};

    if (Object.prototype.hasOwnProperty.call(progress, "python")) {
      setProgress(
        ".course-python .course-progress",
        progress.python
      );
    }

    if (
      Object.prototype.hasOwnProperty.call(
        progress,
        "javascript"
      )
    ) {
      setProgress(
        ".course-javascript .course-progress",
        progress.javascript
      );
    }

    if (Object.prototype.hasOwnProperty.call(progress, "cpp")) {
      setProgress(
        ".course-cpp .course-progress",
        progress.cpp
      );
    }
  },

  highlightNav() {
    const current =
      window.location.pathname.split("/").pop() || "index.html";

    document
      .querySelectorAll(".nav-link, .mobile-nav a, .nav-item")
      .forEach(link => {
        const href = link.getAttribute("href");

        if (!href || href === "#") {
          return;
        }

        try {
          const destination = new URL(
            href,
            window.location.href
          ).pathname.split("/").pop();

          const isActive = destination === current;

          link.classList.toggle("active", isActive);

          if (isActive) {
            link.setAttribute("aria-current", "page");
          } else {
            link.removeAttribute("aria-current");
          }
        } catch (error) {
          console.warn("Invalid navigation link:", href, error);
        }
      });
  },

  addXP() {
    throw new Error("النقاط تُمنح من الخادم فقط.");
  },

  addCoins() {
    throw new Error("العملات لا تُعدل من المتصفح.");
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
    () => {
      App.init().catch(error => {
        console.error("App initialization error:", error);
      });
    },
    { once: true }
  );
} else {
  App.init().catch(error => {
    console.error("App initialization error:", error);
  });
}
