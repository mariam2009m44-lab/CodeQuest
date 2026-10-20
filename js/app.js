import { db } from "./firebase-config.js";
import { logoutUser, requireUser, ensureUserProfile } from "./auth.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText = "position: fixed; bottom: 20px; left: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.style.cssText = `
    padding: 12px 20px; border-radius: 12px; color: #fff; font-size: 14px; font-weight: 600;
    box-shadow: 0 8px 20px rgba(0,0,0,0.15); transition: opacity 0.3s ease;
    background: ${type === "error" ? "#e74c3c" : type === "warning" ? "#f39c12" : "#2ecc71"};
  `;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = String(value);
}

function setProgress(selector, value) {
  const progress = Math.min(100, Number(value) || 0);
  const bar = document.querySelector(selector);
  if (!bar) return;

  const fill = bar.querySelector(".course-progress-fill");
  if (fill) fill.style.width = `${progress}%`;

  bar.setAttribute("aria-valuenow", String(progress));

  const card = bar.closest(".course-card");
  const label = card?.querySelector(".course-progress-info strong");
  if (label) label.textContent = `${progress}%`;
}

export const App = {
  user: "متعلم",
  xp: 0,
  coins: 0,
  unsubscribeProfile: null,
  initPromise: null,

  init() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.initialize();
    this.initPromise.catch(() => { this.initPromise = null; });
    return this.initPromise;
  },

  async initialize() {
    this.highlightNav();
    this.bindLogout();

    try {
      const user = await requireUser();
      await ensureUserProfile(user);
      const reference = doc(db, "users", user.uid);

      this.unsubscribeProfile?.();
      this.unsubscribeProfile = onSnapshot(
        reference,
        snapshot => {
          if (!snapshot.exists()) {
            showToast("لم يتم العثور على بيانات حسابك.", "warning");
            return;
          }
          const data = snapshot.data();
          this.user = data.displayName || user.displayName || "متعلم";
          this.xp = this.toSafeNumber(data.xp);
          this.coins = this.toSafeNumber(data.coins);
          this.updateUI(data);
        },
        error => {
          console.error("Profile loading error:", error);
          showToast("تعذر تحميل بيانات حسابك. تحققي من الاتصال.", "error");
        }
      );
    } catch (err) {
      console.error("Authentication error:", err);
    }
  },

  toSafeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
  },

  bindLogout() {
    document.querySelectorAll(".logout, #logoutButton").forEach(element => {
      if (element.dataset.logoutBound === "true") return;
      element.dataset.logoutBound = "true";
      element.addEventListener("click", async event => {
        event.preventDefault();
        element.setAttribute("aria-busy", "true");
        try {
          await logoutUser();
        } catch (error) {
          console.error("Logout error:", error);
          element.removeAttribute("aria-busy");
          showToast("تعذر تسجيل الخروج. حاولي مرة أخرى.", "error");
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
    setText(".js-completed-lessons", this.toSafeNumber(data.completedLessons));
    setText(".js-completed-projects", this.toSafeNumber(data.completedProjects));
    setText(".js-learning-streak", this.toSafeNumber(data.streak));

    const progress = data.languageProgress || {};
    if (Object.prototype.hasOwnProperty.call(progress, "python")) {
      setProgress(".course-python .course-progress", progress.python);
    }
    if (Object.prototype.hasOwnProperty.call(progress, "javascript")) {
      setProgress(".course-javascript .course-progress", progress.javascript);
    }
    if (Object.prototype.hasOwnProperty.call(progress, "cpp")) {
      setProgress(".course-cpp .course-progress", progress.cpp);
    }
  },

  highlightNav() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-link, .mobile-nav a, .nav-item").forEach(link => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      try {
        const destination = new URL(href, location.href).pathname.split("/").pop();
        link.classList.toggle("active", destination === current);
      } catch (error) {
        console.warn("Invalid navigation link:", href);
      }
    });
  },

  addXP() { throw new Error("النقاط تُمنح من الخادم فقط."); },
  addCoins() { throw new Error("العملات لا تُعدل من المتصفح."); },

  destroy() {
    this.unsubscribeProfile?.();
    this.unsubscribeProfile = null;
    this.initPromise = null;
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    App.init().catch(error => console.error("App initialization error:", error));
  }, { once: true });
} else {
  App.init().catch(error => console.error("App initialization error:", error));
}