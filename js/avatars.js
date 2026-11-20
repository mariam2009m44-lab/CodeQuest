const AVATARS = [
  {
    id: "cody",
    name: "آدم",
    image: "file_00000000bbf88210834d4e591659d62b.png",
    style: "boy"
  },
  {
    id: "layla",
    name: "ليلى",
    image: "file_00000000d13081f4be3e24aee3c0d04b.png",
    style: "girl"
  },
  {
    id: "omar",
    name: "عمر",
    image: "file_000000005ff081f4996abff133614eaf.png",
    style: "boy"
  },
  {
    id: "sara",
    name: "سارة",
    image: "file_00000000892481f499eef90fadd992c8.png",
    style: "girl"
  },
  {
    id: "robo",
    name: "ياسين",
    image: "file_0000000098cc8243a22c913069ac838c.png",
    style: "boy"
  },
  {
    id: "nova",
    name: "جنى",
    image: "file_00000000f55881f48d535befd2ef6069.png",
    style: "girl"
  },
  {
    id: "yazan",
    name: "زياد",
    image: "file_000000000a9081f4b24b676bf0ea7135.png",
    style: "boy"
  },
  {
    id: "malak",
    name: "ميرا",
    image: "file_00000000b9c481f4b536d309fb5088aa.png",
    style: "girl"
  }
];

const DEFAULT_AVATAR = "cody";

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getAvatar(avatarId) {
  return AVATARS.find(avatar => avatar.id === avatarId) || AVATARS[0];
}

function createAvatarSVG(avatar) {
  const emoji = escapeAttribute(avatar.emoji || "✨");
  return `
    <svg class="anime-avatar-svg" xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 155 190" role="img" aria-label="${escapeAttribute(avatar.name)}">
      <text x="77.5" y="130" text-anchor="middle" font-size="112">${emoji}</text>
    </svg>
  `;
}

export function getAllAvatars() {
  return AVATARS.map(avatar => ({ ...avatar }));
}

export function renderAvatar(avatarId = DEFAULT_AVATAR) {
  const avatar = getAvatar(avatarId);
  // Resolve image assets relative to this module, not the current page URL.
  // This keeps the images working on GitHub Pages project paths (/CodeQuest/)
  // as well as when the same component is rendered from other site pages.
  const imageUrl = avatar.image
    ? new URL(`../assets/avatars/${avatar.image}`, import.meta.url).href
    : null;

  const art = imageUrl
    ? `<img class="anime-avatar-image" src="${escapeAttribute(imageUrl)}"
        alt="${escapeAttribute(avatar.name)}" loading="eager" decoding="async"
        draggable="false">`
    : createAvatarSVG(avatar);

  return `
    <div class="anime-avatar" data-avatar="${escapeAttribute(avatar.id)}">
      <div class="anime-character">${art}</div>
    </div>
  `;
}

export function renderAvatarCard(avatarId = DEFAULT_AVATAR) {
  const avatar = getAvatar(avatarId);
  return `
    <div class="avatar-art-container">
      ${renderAvatar(avatar.id)}
    </div>
  `;
}

export function installAvatarStyles() {
  if (document.getElementById("cody-avatar-styles")) return;

  const style = document.createElement("style");
  style.id = "cody-avatar-styles";
  style.textContent = `
    .anime-avatar {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 235px;
      overflow: hidden;
    }

    .anime-character {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      transform-origin: center bottom;
    }

    .anime-avatar-image {
      display: block;
      width: 100%;
      height: 100%;
      max-width: 260px;
      object-fit: contain;
      object-position: center bottom;
      filter: drop-shadow(0 9px 14px rgba(0, 0, 0, .22));
      user-select: none;
      -webkit-user-drag: none;
    }

    .anime-avatar-svg {
      display: block;
      width: 100%;
      height: 100%;
      max-width: 230px;
      overflow: visible;
    }

    .avatar-art-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-width: 0;
    }

    .avatar-card .anime-avatar {
      min-height: 190px;
      height: clamp(180px, 22vw, 250px);
    }

    .avatar-card .anime-avatar-image {
      max-width: 100%;
    }

    .avatar-container .anime-avatar {
      width: 100%;
      height: 100%;
    }

    .avatar-container .anime-avatar-image {
      max-width: 100%;
    }

    @media (max-width: 700px) {
      .avatar-card .anime-avatar {
        height: clamp(155px, 48vw, 205px);
        min-height: 155px;
      }
    }

    @media (max-width: 360px) {
      .avatar-card .anime-avatar {
        height: 150px;
        min-height: 150px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .anime-character {
        animation: none !important;
        transition: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}
