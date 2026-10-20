
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const select = selector => document.querySelector(selector);

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function setText(selector, value) {
  const element = select(selector);
  if (element) element.textContent = String(value);
}

function setProgress(selector, value) {
  const progress = Math.min(100, safeNumber(value));
  const bar = select(selector);

  if (!bar) return;

  const fill = bar.querySelector(".course-progress-fill");

  if (fill) {
    fill.style.width = `${progress}%`;
  }

  bar.setAttribute("aria-valuenow", String(progress));

  const card = bar.closest(".course-card");
  const label = card?.querySelector(
    ".course-progress-info strong"
  );

  if (label) label.textContent = `${progress}%`;
}

function updateDashboard(data) {
  const xp = safeNumber(data.xp);
  const level = Math.floor(xp / 100) + 1;

  setText(".js-user-name", data.displayName || "بطل البرمجة");
  setText(".js-user-xp", xp);
  setText(".js-user-coins", safeNumber(data.coins));
  setText(".js-user-level", level);

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

  // Update progress only when saved progress data exists.
  const progress = data.languageProgress || {};

  if (Object.prototype.hasOwnProperty.call(progress, "python")) {
    setProgress(
      ".course-python .course-progress",
      progress.python
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(progress, "javascript")
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
}

let unsubscribeProfile = null;

onAuthStateChanged(auth, user => {
  unsubscribeProfile?.();
  unsubscribeProfile = null;

  if (!user) return;

  const profileRef = doc(db, "users", user.uid);

  unsubscribeProfile = onSnapshot(
    profileRef,
    snapshot => {
      if (!snapshot.exists()) {
        console.warn("User profile was not found.");
        return;
      }

      updateDashboard(snapshot.data());
    },
    error => {
      console.error("Dashboard data error:", error);
    }
  );
});
