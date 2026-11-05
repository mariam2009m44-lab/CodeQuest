
const AVATARS = [
  {
    id: "cody",
    name: "Cody",
    hair: "#26365f",
    skin: "#f2c6a5",
    clothes: "#39c9e8",
    accent: "#8cecff",
    style: "boy"
  },
  {
    id: "layla",
    name: "Layla",
    hair: "#302044",
    skin: "#e9b995",
    clothes: "#a78bfa",
    accent: "#d8c8ff",
    style: "girl"
  },
  {
    id: "omar",
    name: "Omar",
    hair: "#503020",
    skin: "#c98d68",
    clothes: "#42c99a",
    accent: "#a0ffdc",
    style: "boy"
  },
  {
    id: "sara",
    name: "Sara",
    hair: "#6a3150",
    skin: "#f0c5aa",
    clothes: "#ff8db5",
    accent: "#ffc6dc",
    style: "girl"
  },
  {
    id: "robo",
    name: "Robo",
    hair: "#7c91a8",
    skin: "#b9d8e8",
    clothes: "#637bff",
    accent: "#aabaff",
    style: "robot"
  },
  {
    id: "nova",
    name: "Nova",
    hair: "#263b79",
    skin: "#d9b6a8",
    clothes: "#ffbd59",
    accent: "#ffe0a0",
    style: "girl"
  },
  {
    id: "astronaut",
    name: "رائد الفضاء",
    emoji: "👩‍🚀",
    hair: "#26365f",
    skin: "#d9eaff",
    clothes: "#4b83d1",
    accent: "#b9e5ff",
    style: "robot",
    storeItem: true
  },
  {
    id: "fox",
    name: "الثعلب الذكي",
    emoji: "🦊",
    hair: "#8c4b25",
    skin: "#ffe0bf",
    clothes: "#e88a43",
    accent: "#ffd29a",
    style: "boy",
    storeItem: true
  },
  {
    id: "robot",
    name: "الروبوت المتقدم",
    emoji: "🤖",
    hair: "#607b9b",
    skin: "#b9d8e8",
    clothes: "#637bff",
    accent: "#aabaff",
    style: "robot",
    storeItem: true
  },
  {
    id: "dragon",
    name: "تنين الكود",
    emoji: "🐉",
    hair: "#315d45",
    skin: "#b7e4c7",
    clothes: "#398c68",
    accent: "#b6ffd8",
    style: "robot",
    storeItem: true
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
  return AVATARS.find(avatar => avatar.id === avatarId)
    || AVATARS[0];
}

function createAvatarSVG(avatar) {
  if (avatar.emoji) {
    return `
      <svg class="anime-avatar-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 155 190" role="img" aria-label="${escapeAttribute(avatar.name)}">
        <text x="77.5" y="130" text-anchor="middle" font-size="112">${escapeAttribute(avatar.emoji)}</text>
      </svg>
    `;
  }

  const hair = escapeAttribute(avatar.hair);
  const skin = escapeAttribute(avatar.skin);
  const clothes = escapeAttribute(avatar.clothes);
  const accent = escapeAttribute(avatar.accent);

  const isGirl = avatar.style === "girl";
  const isRobot = avatar.style === "robot";

  const hairShape = isGirl
    ? `
      <path d="M39 65 Q31 20 75 17 Q119 18 112 67
        L111 119 Q102 139 96 112
        L94 63 Q75 83 52 65
        L48 119 Q34 137 32 105 Z"
        fill="${hair}"/>
      <path d="M42 52 Q49 15 79 22 Q103 20 111 49
        Q91 39 79 45 Q59 35 42 52Z"
        fill="${hair}"/>
    `
    : `
      <path d="M37 64 Q35 20 77 20
        Q113 20 114 61
        L105 53 Q91 42 78 46
        Q56 40 42 59Z"
        fill="${hair}"/>
      <path d="M43 47 Q54 19 78 25
        Q94 24 106 43 Q82 37 67 47
        Q53 54 43 47Z"
        fill="${hair}"/>
    `;

  const robotHead = `
    <rect x="39" y="29" width="77" height="83"
      rx="23" fill="${skin}" stroke="${accent}" stroke-width="4"/>
    <rect x="48" y="52" width="59" height="29"
      rx="12" fill="#17243f"/>
    <circle cx="65" cy="66" r="5" fill="${accent}"/>
    <circle cx="91" cy="66" r="5" fill="${accent}"/>
    <path d="M66 91 Q78 98 91 91"
      stroke="#34445d" stroke-width="4"
      fill="none" stroke-linecap="round"/>
    <path d="M39 60 H29 M116 60 H126"
      stroke="${accent}" stroke-width="5"
      stroke-linecap="round"/>
    <circle cx="77" cy="22" r="5" fill="${accent}"/>
  `;

  const humanHead = `
    <ellipse cx="77" cy="72" rx="34" ry="42"
      fill="${skin}"/>

    ${hairShape}

    <path d="M59 72 Q66 66 72 72"
      stroke="#49312f" stroke-width="3"
      fill="none" stroke-linecap="round"/>

    <path d="M84 72 Q91 66 97 72"
      stroke="#49312f" stroke-width="3"
      fill="none" stroke-linecap="round"/>

    <ellipse cx="66" cy="81" rx="4" ry="5"
      fill="#263047"/>

    <ellipse cx="90" cy="81" rx="4" ry="5"
      fill="#263047"/>

    <path d="M73 99 Q78 103 83 99"
      stroke="#a75c62" stroke-width="3"
      fill="none" stroke-linecap="round"/>

    <ellipse cx="54" cy="91" rx="7" ry="4"
      fill="#f39b9b" opacity=".35"/>

    <ellipse cx="100" cy="91" rx="7" ry="4"
      fill="#f39b9b" opacity=".35"/>
  `;

  return `
    <svg
      class="anime-avatar-svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 155 190"
      role="img"
      aria-label="شخصية Cody Academy"
    >
      <defs>
        <linearGradient id="body-${avatar.id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${accent}"/>
          <stop offset="100%" stop-color="${clothes}"/>
        </linearGradient>
      </defs>

      <ellipse cx="77" cy="178" rx="42" ry="7"
        fill="#000" opacity=".18"/>

      <rect x="66" y="105" width="23" height="25"
        rx="9" fill="${skin}"/>

      <path
        d="M45 126 Q77 112 109 126
        Q125 142 127 177
        L27 177 Q30 142 45 126Z"
        fill="url(#body-${avatar.id})"
      />

      <path
        d="M64 128 L77 145 L91 128"
        fill="none"
        stroke="#ffffff"
        stroke-width="3"
        opacity=".75"
      />

      <circle cx="77" cy="155" r="4"
        fill="${accent}" opacity=".9"/>

      <path d="M42 137 L29 161"
        stroke="${clothes}" stroke-width="13"
        stroke-linecap="round"/>

      <path d="M112 137 L125 161"
        stroke="${clothes}" stroke-width="13"
        stroke-linecap="round"/>

      ${isRobot ? robotHead : humanHead}

      <circle cx="123" cy="34" r="4"
        fill="${accent}" opacity=".9"/>

      <path d="M24 39 L27 47 L35 50 L27 53 L24 61
        L21 53 L13 50 L21 47Z"
        fill="${accent}" opacity=".8"/>
    </svg>
  `;
}

export function getAllAvatars() {
  return AVATARS.map(avatar => ({ ...avatar }));
}

export function renderAvatar(avatarId = DEFAULT_AVATAR) {
  const avatar = getAvatar(avatarId);

  return `
    <div class="anime-avatar" data-avatar="${avatar.id}">
      <div class="anime-character">
        ${createAvatarSVG(avatar)}
      </div>
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
  if (document.getElementById("cody-avatar-styles")) {
    return;
  }

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
      overflow: visible;
    }

    .anime-character {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      transform-origin: center bottom;
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
    }

    .avatar-card .anime-avatar {
      min-height: 190px;
    }

    .avatar-card .anime-avatar-svg {
      max-width: 220px;
    }

    .avatar-container .anime-avatar {
      width: 100%;
      height: 100%;
    }

    .avatar-container .anime-avatar-svg {
      max-width: 180px;
    }

    @media (max-width: 700px) {
      .avatar-card .anime-avatar-svg {
        max-width: 190px;
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
