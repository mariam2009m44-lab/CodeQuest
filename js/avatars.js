
/* =====================================================
   CODY ACADEMY - AVATAR ENGINE
   Six original vector characters.
   No PNG, JPG, external image or library required.
===================================================== */

const characters = {
  cody: {
    name: "كودي",
    description: "رفيقك الذكي",
    color: "#55eaff",
    dark: "#19385e",
    kind: "robot"
  },
  layla: {
    name: "ليلى",
    description: "المبرمجة المبدعة",
    color: "#c58aff",
    dark: "#563477",
    kind: "girl"
  },
  omar: {
    name: "عمر",
    description: "مستكشف الفضاء",
    color: "#55c8ff",
    dark: "#244a78",
    kind: "astronaut"
  },
  sara: {
    name: "سارة",
    description: "العالمة الصغيرة",
    color: "#65eacb",
    dark: "#236b69",
    kind: "scientist"
  },
  robo: {
    name: "روبو",
    description: "المساعد الآلي",
    color: "#ffc66d",
    dark: "#66502d",
    kind: "robot2"
  },
  nova: {
    name: "نوفا",
    description: "الصديق الفضائي",
    color: "#b99aff",
    dark: "#493b83",
    kind: "alien"
  }
};

function robotArt(color, dark, alternate = false) {
  return `
    <path d="M140 55V35" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="140" cy="27" r="12" fill="${color}"/>
    <circle cx="140" cy="27" r="5" fill="#fff"/>

    <path d="M78 170L48 207M202 170L232 207"
      stroke="#b8d7ed" stroke-width="19" stroke-linecap="round"/>
    <circle cx="47" cy="211" r="13" fill="${color}"/>
    <circle cx="233" cy="211" r="13" fill="${color}"/>

    <path d="M91 153Q140 137 189 153L198 258Q140 279 82 258Z"
      fill="${alternate ? dark : "#d8efff"}"
      stroke="${color}" stroke-width="5"/>

    <rect x="105" y="171" width="70" height="58" rx="18"
      fill="${dark}" stroke="${color}" stroke-width="3"/>

    ${alternate
      ? `<circle cx="140" cy="200" r="16" fill="${color}"/>
         <path d="M131 200H149" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`
      : `<path d="M119 200H161" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
         <circle cx="140" cy="216" r="5" fill="#fff"/>`
    }

    <rect x="105" y="253" width="29" height="31" rx="10" fill="#b8d7ed"/>
    <rect x="146" y="253" width="29" height="31" rx="10" fill="#b8d7ed"/>
    <path d="M96 283H137M143 283H184"
      stroke="${color}" stroke-width="12" stroke-linecap="round"/>

    <rect x="72" y="61" width="136" height="105" rx="36"
      fill="#d8e9f7" stroke="#fff" stroke-width="4"/>

    <rect x="86" y="79" width="108" height="69" rx="25"
      fill="${dark}"/>

    <ellipse cx="116" cy="108" rx="11" ry="14" fill="${color}"/>
    <ellipse cx="164" cy="108" rx="11" ry="14" fill="${color}"/>
    <circle cx="119" cy="103" r="4" fill="#fff"/>
    <circle cx="167" cy="103" r="4" fill="#fff"/>

    <path d="M121 128Q140 144 159 128"
      fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>

    <rect x="60" y="95" width="12" height="35" rx="6" fill="${color}"/>
    <rect x="208" y="95" width="12" height="35" rx="6" fill="${color}"/>
  `;
}

function humanArt(color, dark, hairColor, accessory = false) {
  return `
    <!-- Hair behind head -->
    <path d="M78 115Q60 38 140 39Q220 38 202 125L194 177H86Z"
      fill="${hairColor}"/>

    <!-- Arms -->
    <path d="M93 176L55 222M187 176L225 222"
      stroke="#e9b99e" stroke-width="19" stroke-linecap="round"/>
    <circle cx="53" cy="226" r="12" fill="#f1c4a9"/>
    <circle cx="227" cy="226" r="12" fill="#f1c4a9"/>

    <!-- Body and suit -->
    <path d="M96 157Q140 141 184 157L205 261Q140 284 75 261Z"
      fill="${dark}" stroke="${color}" stroke-width="5"/>

    <path d="M111 178L140 204L169 178"
      fill="none" stroke="${color}" stroke-width="5"
      stroke-linecap="round"/>

    <circle cx="140" cy="224" r="11" fill="${color}"/>
    <path d="M88 246H192" stroke="#eaf7ff" stroke-width="7"/>

    <!-- Legs -->
    <path d="M108 260L102 287H134L138 263"
      fill="#263e69"/>
    <path d="M142 263L146 287H178L172 260"
      fill="#263e69"/>
    <path d="M99 289H136M144 289H181"
      stroke="${color}" stroke-width="10" stroke-linecap="round"/>

    <!-- Neck -->
    <rect x="124" y="137" width="32" height="29" rx="11"
      fill="#e9b99e"/>

    <!-- Face -->
    <ellipse cx="140" cy="105" rx="53" ry="65"
      fill="#f5c9ad"/>

    <!-- Hair -->
    <path d="M87 101Q78 44 140 43Q205 43 194 104
      Q173 76 146 79Q117 88 87 101Z"
      fill="${hairColor}"/>

    <path d="M88 93Q67 130 91 167L100 113Z"
      fill="${hairColor}"/>
    <path d="M192 93Q213 130 189 167L180 113Z"
      fill="${hairColor}"/>

    <!-- Eyes -->
    <ellipse cx="120" cy="109" rx="7" ry="10" fill="#30283d"/>
    <ellipse cx="160" cy="109" rx="7" ry="10" fill="#30283d"/>
    <circle cx="122" cy="105" r="3" fill="#fff"/>
    <circle cx="162" cy="105" r="3" fill="#fff"/>

    <!-- Eyebrows -->
    <path d="M108 94Q119 87 130 94M150 94Q161 87 172 94"
      fill="none" stroke="${hairColor}" stroke-width="4"
      stroke-linecap="round"/>

    <!-- Nose and smile -->
    <path d="M140 115L136 128L143 130"
      fill="none" stroke="#c58c7c" stroke-width="2"/>
    <path d="M127 140Q140 151 153 140"
      fill="none" stroke="#a84f63" stroke-width="3"
      stroke-linecap="round"/>

    <!-- Cheeks -->
    <ellipse cx="105" cy="132" rx="10" ry="5" fill="#ff91a7" opacity=".4"/>
    <ellipse cx="175" cy="132" rx="10" ry="5" fill="#ff91a7" opacity=".4"/>

    ${accessory
      ? `<path d="M182 66L199 51L210 67L194 81Z"
          fill="${color}" stroke="#fff" stroke-width="2"/>`
      : `<path d="M95 66Q140 42 185 66"
          fill="none" stroke="${color}" stroke-width="5"/>`
    }
  `;
}

function omarArt(color, dark) {
  return `
    <!-- Backpack -->
    <rect x="48" y="147" width="36" height="86" rx="14"
      fill="${dark}" stroke="${color}" stroke-width="3"/>
    <rect x="196" y="147" width="36" height="86" rx="14"
      fill="${dark}" stroke="${color}" stroke-width="3"/>

    <!-- Arms -->
    <path d="M92 172L54 213M188 172L226 213"
      stroke="#dceeff" stroke-width="22" stroke-linecap="round"/>
    <circle cx="52" cy="217" r="13" fill="${color}"/>
    <circle cx="228" cy="217" r="13" fill="${color}"/>

    <!-- Suit -->
    <path d="M94 151Q140 133 186 151L203 259Q140 281 77 259Z"
      fill="#e4f3ff" stroke="${color}" stroke-width="5"/>

    <rect x="109" y="174" width="62" height="54" rx="12"
      fill="${dark}" stroke="${color}" stroke-width="3"/>
    <circle cx="140" cy="201" r="13" fill="${color}"/>
    <path d="M132 201L138 207L150 193"
      fill="none" stroke="#fff" stroke-width="4"/>

    <!-- Boots -->
    <path d="M106 255L101 284H135L138 258M142 258L145 284H179L174 255"
      fill="#b8d8ef"/>
    <path d="M96 285H137M143 285H184"
      stroke="${color}" stroke-width="12" stroke-linecap="round"/>

    <!-- Neck -->
    <rect x="124" y="137" width="32" height="26" rx="10"
      fill="#e9b99e"/>

    <!-- Helmet -->
    <circle cx="140" cy="104" r="75"
      fill="#bceaff" fill-opacity=".15"
      stroke="#e2f8ff" stroke-width="8"/>
    <circle cx="140" cy="104" r="64"
      fill="#6ac8ef" fill-opacity=".12"
      stroke="${color}" stroke-width="2"/>

    <!-- Face -->
    <ellipse cx="140" cy="108" rx="43" ry="52" fill="#f1c3a6"/>

    <!-- Hair -->
    <path d="M97 95Q91 49 140 49Q188 49 183 95
      Q158 76 130 79Q112 82 97 95Z"
      fill="#26324b"/>

    <ellipse cx="124" cy="111" rx="6" ry="8" fill="#26324b"/>
    <ellipse cx="156" cy="111" rx="6" ry="8" fill="#26324b"/>
    <circle cx="126" cy="108" r="2.5" fill="#fff"/>
    <circle cx="158" cy="108" r="2.5" fill="#fff"/>

    <path d="M129 133Q140 141 151 133"
      fill="none" stroke="#a44e57" stroke-width="3"
      stroke-linecap="round"/>

    <path d="M88 76Q105 35 137 32"
      fill="none" stroke="#fff" stroke-width="6"
      stroke-linecap="round" opacity=".8"/>
  `;
}

function novaArt(color, dark) {
  return `
    <!-- Ears -->
    <path d="M88 106Q34 49 58 145L99 153Z"
      fill="${color}" stroke="#e2d8ff" stroke-width="4"/>
    <path d="M192 106Q246 49 222 145L181 153Z"
      fill="${color}" stroke="#e2d8ff" stroke-width="4"/>

    <!-- Antenna -->
    <path d="M140 49V26" stroke="#e4d9ff" stroke-width="7"
      stroke-linecap="round"/>
    <circle cx="140" cy="19" r="12" fill="#fff"/>
    <circle cx="140" cy="19" r="7" fill="${color}"/>

    <!-- Body -->
    <path d="M94 163Q140 139 186 163L201 260Q140 282 79 260Z"
      fill="${dark}" stroke="${color}" stroke-width="5"/>

    <circle cx="140" cy="218" r="13" fill="${color}"/>
    <path d="M132 218H148" stroke="#fff" stroke-width="4"
      stroke-linecap="round"/>

    <!-- Arms -->
    <path d="M94 181L57 224M186 181L223 224"
      stroke="${color}" stroke-width="19" stroke-linecap="round"/>
    <circle cx="56" cy="228" r="12" fill="#e2d8ff"/>
    <circle cx="224" cy="228" r="12" fill="#e2d8ff"/>

    <!-- Feet -->
    <rect x="105" y="252" width="27" height="34" rx="12" fill="${color}"/>
    <rect x="148" y="252" width="27" height="34" rx="12" fill="${color}"/>
    <ellipse cx="117" cy="289" rx="23" ry="10" fill="#e2d8ff"/>
    <ellipse cx="163" cy="289" rx="23" ry="10" fill="#e2d8ff"/>

    <!-- Head -->
    <path d="M140 43Q210 43 210 111Q210 178 140 178
      Q70 178 70 111Q70 43 140 43Z"
      fill="${color}" stroke="#e2d8ff" stroke-width="4"/>

    <!-- Eyes -->
    <ellipse cx="115" cy="111" rx="17" ry="23" fill="#fff"/>
    <ellipse cx="165" cy="111" rx="17" ry="23" fill="#fff"/>
    <ellipse cx="118" cy="113" rx="9" ry="14" fill="${dark}"/>
    <ellipse cx="162" cy="113" rx="9" ry="14" fill="${dark}"/>
    <circle cx="121" cy="106" r="4" fill="#fff"/>
    <circle cx="165" cy="106" r="4" fill="#fff"/>

    <!-- Smile -->
    <path d="M123 145Q140 160 157 145"
      fill="none" stroke="${dark}" stroke-width="4"
      stroke-linecap="round"/>

    <!-- Cheeks -->
    <ellipse cx="91" cy="138" rx="11" ry="6" fill="#ffb8df" opacity=".7"/>
    <ellipse cx="189" cy="138" rx="11" ry="6" fill="#ffb8df" opacity=".7"/>
  `;
}

function characterSVG(id) {
  const item = characters[id] || characters.cody;

  let art;

  switch (item.kind) {
    case "robot":
      art = robotArt(item.color, item.dark, false);
      break;
    case "robot2":
      art = robotArt(item.color, item.dark, true);
      break;
    case "girl":
      art = humanArt(item.color, item.dark, "#38275f", true);
      break;
    case "scientist":
      art = humanArt(item.color, item.dark, "#5b352d", false);
      break;
    case "astronaut":
      art = omarArt(item.color, item.dark);
      break;
    case "alien":
      art = novaArt(item.color, item.dark);
      break;
    default:
      art = robotArt("#55eaff", "#19385e");
  }

  return `
    <svg
      class="cody-character"
      viewBox="0 0 280 320"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="${item.name}"
    >
      <defs>
        <radialGradient id="avatarGlow-${id}">
          <stop offset="0%" stop-color="${item.color}" stop-opacity=".3"/>
          <stop offset="100%" stop-color="${item.color}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="avatarBackground-${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${item.color}" stop-opacity=".12"/>
          <stop offset="100%" stop-color="${item.dark}" stop-opacity=".02"/>
        </linearGradient>
      </defs>

      <circle cx="140" cy="150" r="130"
        fill="url(#avatarGlow-${id})"/>

      <circle cx="38" cy="92" r="3" fill="#fff" opacity=".8"/>
      <circle cx="237" cy="75" r="3" fill="${item.color}"/>
      <circle cx="230" cy="215" r="3" fill="#fff" opacity=".6"/>
      <path d="M42 183l5-5 5 5-5 5z" fill="${item.color}"/>

      <ellipse cx="140" cy="300" rx="67" ry="9"
        fill="#000" opacity=".18"/>

      ${art}
    </svg>
  `;
}

/* Public API */

export function getAllAvatars() {
  return Object.entries(characters).map(([id, item]) => ({
    id,
    name: item.name,
    description: item.description,
    color: item.color
  }));
}

export function getAvatar(id) {
  return characters[id] || characters.cody;
}

export function renderAvatar(id) {
  return characterSVG(characters[id] ? id : "cody");
}

export function renderAvatarCard(id) {
  const item = getAvatar(id);

  return `
    <div class="avatar-illustration">
      ${renderAvatar(id)}
    </div>
    <div class="avatar-character-name">${item.name}</div>
    <div class="avatar-character-description">${item.description}</div>
  `;
}

export function installAvatarStyles() {
  if (document.getElementById("cody-avatar-styles")) return;

  const style = document.createElement("style");
  style.id = "cody-avatar-styles";

  style.textContent = `
    .avatar-illustration {
      width: 100%;
      max-width: 220px;
      aspect-ratio: 1 / 1.12;
      display: grid;
      place-items: center;
      margin: auto;
      position: relative;
    }

    .cody-character {
      width: 100%;
      height: 100%;
      display: block;
      overflow: visible;
      transform-origin: 50% 75%;
      animation: codyFloat 3.4s ease-in-out infinite;
      filter: drop-shadow(0 12px 15px rgba(0,0,0,.22));
    }

    .avatar-card:hover .cody-character {
      animation-duration: 1.8s;
    }

    .avatar-character-name {
      color: #fff;
      font-size: 1.12rem;
      font-weight: 900;
      text-align: center;
      margin-top: 8px;
    }

    .avatar-character-description {
      color: #aebbd9;
      font-size: .83rem;
      text-align: center;
      margin-top: 3px;
    }

    @keyframes codyFloat {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-7px) rotate(1deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .cody-character { animation: none !important; }
    }
  `;

  document.head.appendChild(style);
}
