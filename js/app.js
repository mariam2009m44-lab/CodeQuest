import { auth, db } from "./firebase-config.js";
import { requireUser, ensureUserProfile, logoutUser } from "./auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { showToast } from "./ui.js";

export const App = {
  user: "متعلم",
  xp: 0,
  coins: 0,

  async init() {
    this.highlightNav();
    const user = await requireUser();
    await ensureUserProfile(user);
    
    const reference = doc(db, "users", user.uid);
    onSnapshot(reference, snapshot => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      this.user = data.displayName || "متعلم";
      this.xp = Number(data.xp) || 0;
      this.coins = Number(data.coins) || 0;
      this.updateUI();
    });

    document.querySelectorAll(".logout").forEach(el => {
      el.addEventListener("click", async e => { e.preventDefault(); await logoutUser(); });
    });
  },

  updateUI() {
    document.querySelectorAll(".js-user-name").forEach(el => el.textContent = this.user);
    document.querySelectorAll(".js-user-xp").forEach(el => el.textContent = this.xp);
    document.querySelectorAll(".js-user-coins").forEach(el => el.textContent = this.coins);
  },

  highlightNav() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(link => {
      const dest = new URL(link.getAttribute("href") || ".", location.href).pathname.split("/").pop();
      link.classList.toggle("active", dest === current);
    });
  },

  addXP() { throw new Error("النقاط تُمنح من الخادم فقط."); },
  addCoins() { throw new Error("العملات لا تُعدل من المتصفح."); }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => App.init().catch(e => console.error(e)));
} else {
  App.init().catch(e => console.error(e));
}
