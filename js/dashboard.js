import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  collection,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const select = selector => document.querySelector(selector);

const CURRICULUM_TOTALS = Object.freeze({
  python: 48,
  javascript: 26,
  cpp: 23,
  java: 16
});

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
  if (fill) fill.style.width = `${progress}%`;

  bar.setAttribute("aria-valuenow", String(progress));

  const card = bar.closest(".course-card");
  const label = card?.querySelector(".course-progress-info strong");
  if (label) label.textContent = `${progress}%`;
}

function updateDashboard(data) {
  const xp = safeNumber(data.xp);

  setText(".js-user-name", data.displayName || "متعلم");
  setText(".js-user-xp", xp);
  setText(".js-user-stars", safeNumber(data.stars));
  setText(".js-user-coins", safeNumber(data.coins));
  setText(".js-user-level", Math.floor(xp / 100) + 1);
  setText(".js-completed-projects", safeNumber(data.completedProjects));
  setText(".js-learning-streak", safeNumber(data.streak));
}

function getValidProgressCounts(snapshot) {
  const completed = {
    python: new Set(),
    javascript: new Set(),
    cpp: new Set(),
    java: new Set()
  };

  for (const item of snapshot.docs) {
    const data = item.data() || {};
    const language = data.language;

    if (!Object.prototype.hasOwnProperty.call(CURRICULUM_TOTALS, language)) {
      continue;
    }

    if (
      data.completed !== true ||
      !Number.isSafeInteger(data.chapter) ||
      !Number.isSafeInteger(data.lesson) ||
      data.chapter < 0 ||
      data.lesson < 0
    ) {
      continue;
    }

    const key = `${data.chapter}:${data.lesson}`;
    completed[language].add(key);
  }

  return completed;
}

function updateLearningProgress(snapshot) {
  const completed = getValidProgressCounts(snapshot);
  let totalCompleted = 0;

  for (const [language, totalLessons] of Object.entries(CURRICULUM_TOTALS)) {
    const count = Math.min(completed[language].size, totalLessons);
    const percentage = totalLessons > 0
      ? Math.round((count / totalLessons) * 100)
      : 0;

    totalCompleted += count;
    setProgress(`.course-${language} .course-progress`, percentage);
  }

  setText(".js-completed-lessons", totalCompleted);
}

let unsubscribeProfile = null;
let unsubscribeProgress = null;

onAuthStateChanged(auth, user => {
  unsubscribeProfile?.();
  unsubscribeProgress?.();
  unsubscribeProfile = null;
  unsubscribeProgress = null;

  if (!user) {
    setText(".js-completed-lessons", 0);
    for (const language of Object.keys(CURRICULUM_TOTALS)) {
      setProgress(`.course-${language} .course-progress`, 0);
    }
    return;
  }

  const profileRef = doc(db, "users", user.uid);
  const progressRef = collection(db, "users", user.uid, "lessonProgress");

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
      console.error("Dashboard profile error:", error);
    }
  );

  unsubscribeProgress = onSnapshot(
    progressRef,
    snapshot => {
      if (auth.currentUser?.uid !== user.uid) return;
      updateLearningProgress(snapshot);
    },
    error => {
      console.error("Dashboard learning progress error:", error);
    }
  );
});
