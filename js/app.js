
import { db } from "./firebase-config.js";
import {
  requireUser,
  ensureUserProfile,
  logoutUser
} from "./auth.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { showToast } from "./ui.js";

export const App = {
  user: "متعلم",
  xp: 0,
  coins: 0,
  unsubscribeProfile: null,
  initPromise: null,

  init() {
    // Prevent duplicate initialization.
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.initialize();

    this.initPromise.catch(() => {
      this.initPromise = null;
    });

    return this.initPromise;
  },

  async initialize() {
    this.highlightNav();

    const user = await requireUser();
    await ensureUserProfile(user);

    const reference = doc(db, "users", user.uid);

    this.unsubscribeProfile?.();

    this.unsubscribeProfile = onSnapshot(
      reference,
      snapshot => {
        if (!snapshot.exists()) {
          showToast(
            "لم يتم العثور على بيانات حسابك.",
            "warning"
          );
          return;
        }

        const data = snapshot.data();

        this.user =
          data.displayName ||
          user.displayName ||
          "متعلم";

        this.xp = this.toSafeNumber(data.xp);
        this.coins = this.toSafeNumber(data.coins);

        this.updateUI();
      },
      error => {
        console.error("Profile loading error:", error);

        showToast(
          "تعذر تحميل بيانات حسابك. تحققي من الاتصال.",
          "error"
        );
      }
    );

    this.bindLogout();
  },

  toSafeNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) && number >= 0
      ? number
      : 0;
  },

  bindLogout() {
    document
      .querySelectorAll(".logout, #logoutButton")
      .forEach(element => {
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

            showToast(
              "تعذر تسجيل الخروج. حاولي مرة أخرى.",
              "error"
            );
          }
        });
      });
  },

  updateUI() {
    document.querySelectorAll(".js-user-name").forEach(element => {
      element.textContent = this.user;
    });

    document.querySelectorAll(".js-user-xp").forEach(element => {
      element.textContent = this.xp;
    });

    document.querySelectorAll(".js-user-coins").forEach(element => {
      element.textContent = this.coins;
    });
  },

  highlightNav() {
    const current =
      location.pathname.split("/").pop() || "index.html";

    document
      .querySelectorAll(".nav-item, .mobile-nav-item")
      .forEach(link => {
        const href = link.getAttribute("href");

        if (!href || href === "#") return;

        try {
          const destination = new URL(
            href,
            location.href
          ).pathname.split("/").pop();

          link.classList.toggle(
            "active",
            destination === current
          );
        } catch (error) {
          console.warn("Invalid navigation link:", href);
        }
      });
  },

  // Rewards must be handled by trusted server-side logic.
  addXP() {
    throw new Error("النقاط تُمنح من الخادم فقط.");
  },

  addCoins() {
    throw new Error("العملات لا تُعدل من المتصفح.");
  },

  destroy() {
    this.unsubscribeProfile?.();
    this.unsubscribeProfile = null;
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
