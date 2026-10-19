
import { db } from "./firebase-config.js";
import { requireUser, ensureUserProfile, logoutUser } from "./auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { showToast } from "./ui.js";

export const App = {
  user: "متعلم",
  xp: 0,
  coins: 0,
  unsubscribeProfile: null,

  async init() {
    this.highlightNav();

    const user = await requireUser();
    await ensureUserProfile(user);

    const reference = doc(db, "users", user.uid);

    this.unsubscribeProfile?.();

    this.unsubscribeProfile = onSnapshot(
      reference,
      snapshot => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();

        this.user = data.displayName || user.displayName || "متعلم";
        this.xp = Number(data.xp) || 0;
        this.coins = Number(data.coins) || 0;

        this.updateUI();
      },
      error => {
        console.error("Profile loading error:", error);
        showToast?.("تعذر تحميل بيانات حسابك. تحققي من الاتصال.", "error");
      }
    );

    document.querySelectorAll(".logout").forEach(element => {
      if (element.dataset.logoutBound === "true") return;

      element.dataset.logoutBound = "true";

      element.addEventListener("click", async event => {
        event.preventDefault();

        try {
          await logoutUser();
        } catch (error) {
          console.error("Logout error:", error);
          showToast?.("تعذر تسجيل الخروج. حاولي مرة أخرى.", "error");
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
    const current = location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(link => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const destination = new URL(href, location.href).pathname.split("/").pop();

      link.classList.toggle("active", destination === current);
    });
  },

  addXP() {
    throw new Error("النقاط تُمنح من الخادم فقط.");
  },

  addCoins() {
    throw new Error("العملات لا تُعدل من المتصفح.");
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    App.init().catch(error => console.error("App initialization error:", error));
  });
} else {
  App.init().catch(error => console.error("App initialization error:", error));
}
