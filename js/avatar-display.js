
import { requireUser } from "./auth.js";
import { db } from "./firebase-config.js";

import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

import {
  getAllAvatars,
  renderAvatar,
  installAvatarStyles
} from "./avatars.js";

const DEFAULT_AVATAR = "cody";

function getAvailableAvatar(userData) {
  const avatars = getAllAvatars();
  const activeAvatar = userData?.activeAvatar || DEFAULT_AVATAR;

  const inventory = Array.isArray(userData?.inventory)
    ? userData.inventory
    : [];

  const selected = avatars.find(avatar => {
    if (avatar.id !== activeAvatar) return false;

    return !avatar.storeItem || inventory.includes(avatar.id);
  });

  return selected?.id || DEFAULT_AVATAR;
}

function installDashboardAvatarStyles() {
  if (document.getElementById("dashboard-avatar-fix")) return;

  const style = document.createElement("style");
  style.id = "dashboard-avatar-fix";

  style.textContent = `
    .dashboard-avatar-art {
      display: flex !important;
      align-items: flex-end !important;
      justify-content: center !important;
      width: 100% !important;
      height: 100% !important;
      overflow: hidden !important;
    }

    .dashboard-avatar-art .anime-avatar {
      width: 58px !important;
      height: 58px !important;
      min-height: 58px !important;
      margin: 0 !important;
      overflow: hidden !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    .dashboard-avatar-art .anime-character {
      width: 100% !important;
      height: 100% !important;
      transform: scale(1) !important;
      transform-origin: center bottom !important;
    }

    .dashboard-avatar-art .anime-avatar-svg {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
      max-width: 58px !important;
    }

    @media (prefers-reduced-motion: reduce) {
      .dashboard-avatar-art *,
      .dashboard-avatar-art *::before {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function renderSelectedAvatar(userData) {
  const avatarId = getAvailableAvatar(userData);

  const dashboardContainer = document.getElementById(
    "dashboardAvatarArt"
  );

  const profileContainer = document.getElementById(
    "userAvatar"
  );

  if (dashboardContainer) {
    dashboardContainer.innerHTML = renderAvatar(avatarId);
  }

  if (profileContainer) {
    profileContainer.innerHTML = renderAvatar(avatarId);
  }
}

async function initializeAvatarDisplay() {
  installAvatarStyles();
  installDashboardAvatarStyles();

  try {
    const user = await requireUser();

    if (!user?.uid) {
      throw new Error("لم يتم العثور على الحساب الحالي.");
    }

    const userRef = doc(db, "users", user.uid);

    onSnapshot(
      userRef,
      snapshot => {
        if (!snapshot.exists()) {
          renderSelectedAvatar({});
          return;
        }

        renderSelectedAvatar(snapshot.data());
      },
      error => {
        console.error("Avatar synchronization error:", error);
      }
    );

  } catch (error) {
    console.error("Avatar initialization error:", error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeAvatarDisplay,
    { once: true }
  );
} else {
  initializeAvatarDisplay();
}
