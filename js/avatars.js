/* =========================================
   CODY ACADEMY
   Shared Avatar Display Controller
========================================= */

import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
  renderAvatar,
  installAvatarStyles
} from "./avatars.js";

const DEFAULT_AVATAR = "cody";

const VALID_AVATARS = [
  "cody",
  "layla",
  "omar",
  "sara",
  "robo",
  "nova"
];

function getSavedAvatar() {
  const saved = localStorage.getItem("cq_avatar");

  return VALID_AVATARS.includes(saved)
    ? saved
    : DEFAULT_AVATAR;
}

async function loadAvatarId(user) {
  let avatarId = getSavedAvatar();

  if (!user) {
    return avatarId;
  }

  try {
    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      const savedAvatar = snapshot.data().activeAvatar;

      if (VALID_AVATARS.includes(savedAvatar)) {
        avatarId = savedAvatar;
      }
    }
  } catch (error) {
    console.error("Could not load saved avatar:", error);
  }

  localStorage.setItem("cq_avatar", avatarId);

  return avatarId;
}

function renderDashboardAvatar(avatarId) {
  const oldAvatar = document.querySelector(
    ".topbar-avatar .avatar-emoji"
  );

  const topbar = document.querySelector(".topbar-avatar");

  if (!topbar) return;

  let container = document.getElementById("dashboardAvatar");

  if (!container) {
    container = document.createElement("span");
    container.id = "dashboardAvatar";
    container.className = "dashboard-avatar-art";

    if (oldAvatar) {
      oldAvatar.replaceWith(container);
    } else {
      topbar.prepend(container);
    }
  }

  container.innerHTML = renderAvatar(avatarId);
  container.setAttribute("aria-label", "الشخصية المختارة");
}

function renderProfileAvatar(avatarId) {
  const container = document.getElementById("userAvatar");

  if (!container) return;

  container.innerHTML = renderAvatar(avatarId);

  container.setAttribute(
    "aria-label",
    "الشخصية المختارة في Cody Academy"
  );
}

function renderCurrentPageAvatar(avatarId) {
  renderDashboardAvatar(avatarId);

  /*
   * صفحة الحساب تحتوي بالفعل على دالة تحميل
   * الشخصية الخاصة بها. هذا الجزء احتياطي فقط.
   */
  const profileContainer = document.getElementById("userAvatar");

  if (profileContainer && !profileContainer.children.length) {
    renderProfileAvatar(avatarId);
  }
}

function startAvatarDisplay() {
  installAvatarStyles();

  onAuthStateChanged(auth, async user => {
    const avatarId = await loadAvatarId(user);

    renderCurrentPageAvatar(avatarId);
  });
}

startAvatarDisplay();