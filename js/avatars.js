

/* =====================================================
   CODY ACADEMY
   CSS ANIME AVATARS
   Original characters drawn entirely with HTML + CSS
===================================================== */

const AVATARS = [
  { id: "cody", skin: "#f4c5a7", hair: "#273047", hair2: "#384a70", outfit: "#48b9ed", eyes: "#263c75", style: "boy-one" },
  { id: "layla", skin: "#f4c9b4", hair: "#40264f", hair2: "#754b91", outfit: "#a77bea", eyes: "#654a9e", style: "girl-one" },
  { id: "omar", skin: "#dca987", hair: "#392c27", hair2: "#654637", outfit: "#e5a84f", eyes: "#49372c", style: "boy-two" },
  { id: "sara", skin: "#f4d0b7", hair: "#9a583c", hair2: "#c17b51", outfit: "#53c8a6", eyes: "#397b73", style: "girl-two" },
  { id: "robo", skin: "#e9b99f", hair: "#202b48", hair2: "#435c91", outfit: "#e47791", eyes: "#385caa", style: "boy-three" },
  { id: "nova", skin: "#f1c4ae", hair: "#6941a0", hair2: "#a47ae0", outfit: "#8b7ce8", eyes: "#6d4bb2", style: "girl-three" }
];

const avatarMap = Object.fromEntries(
  AVATARS.map(item => [item.id, item])
);

function avatarMarkup(item) {
  return `
    <div class="anime-avatar anime-${item.style}"
         style="
          --skin:${item.skin};
          --hair:${item.hair};
          --hair2:${item.hair2};
          --outfit:${item.outfit};
          --eyes:${item.eyes};
         ">

      <div class="anime-shadow"></div>

      <div class="anime-character">

        <!-- Hair behind the head -->
        <div class="anime-back-hair"></div>

        <!-- Neck -->
        <div class="anime-neck"></div>

        <!-- Body -->
        <div class="anime-body">
          <div class="anime-collar"></div>
          <div class="anime-shirt-detail"></div>
          <div class="anime-button"></div>
        </div>

        <!-- Arms -->
        <div class="anime-arm anime-arm-left"></div>
        <div class="anime-arm anime-arm-right"></div>

        <!-- Head -->
        <div class="anime-head">

          <div class="anime-ear anime-ear-left"></div>
          <div class="anime-ear anime-ear-right"></div>

          <div class="anime-face">

            <div class="anime-fringe"></div>
            <div class="anime-side-hair anime-side-left"></div>
            <div class="anime-side-hair anime-side-right"></div>

            <div class="anime-eyebrow eyebrow-left"></div>
            <div class="anime-eyebrow eyebrow-right"></div>

            <div class="anime-eye eye-left">
              <span></span>
            </div>

            <div class="anime-eye eye-right">
              <span></span>
            </div>

            <div class="anime-blush blush-left"></div>
            <div class="anime-blush blush-right"></div>

            <div class="anime-nose"></div>
            <div class="anime-mouth"></div>

          </div>

          <div class="anime-hair-decoration"></div>
        </div>

        <!-- Legs -->
        <div class="anime-leg leg-left"></div>
        <div class="anime-leg leg-right"></div>

        <!-- Shoes -->
        <div class="anime-shoe shoe-left"></div>
        <div class="anime-shoe shoe-right"></div>

      </div>

      <!-- Decorative stars -->
      <span class="anime-star star-one">✦</span>
      <span class="anime-star star-two">✧</span>
      <span class="anime-star star-three">·</span>

    </div>
  `;
}

export function getAllAvatars() {
  return AVATARS.map(item => ({
    id: item.id
  }));
}

export function getAvatar(id) {
  return avatarMap[id] || avatarMap.cody;
}

export function renderAvatar(id) {
  const item = getAvatar(id);
  return avatarMarkup(item);
}

export function renderAvatarCard(id) {
  return `
    <div class="avatar-art-container">
      ${renderAvatar(id)}
    </div>
  `;
}

export function installAvatarStyles() {
  if (document.getElementById("anime-avatar-css")) return;

  const style = document.createElement("style");
  style.id = "anime-avatar-css";

  style.textContent = `

    /* ==================================
       AVATAR STAGE
    ================================== */

    .avatar-art-container {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: visible;
    }

    .anime-avatar {
      width: 210px;
      height: 245px;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      isolation: isolate;
      overflow: hidden;
      border-radius: 20px;
      background:
        radial-gradient(circle at 50% 42%,
          color-mix(in srgb, var(--outfit), transparent 72%),
          transparent 70%);
    }

    .anime-character {
      width: 180px;
      height: 225px;
      position: relative;
      transform-origin: 50% 90%;
      animation: anime-idle 3.5s ease-in-out infinite;
    }

    .anime-shadow {
      position: absolute;
      bottom: 8px;
      left: 50%;
      width: 105px;
      height: 13px;
      border-radius: 50%;
      background: rgba(0,0,0,.22);
      transform: translateX(-50%);
      filter: blur(5px);
    }

    /* ==================================
       BODY
    ================================== */

    .anime-body {
      position: absolute;
      z-index: 3;
      bottom: 29px;
      left: 39px;
      width: 102px;
      height: 91px;
      border-radius: 42px 42px 18px 18px;
      background: linear-gradient(
        140deg,
        color-mix(in srgb, var(--outfit), white 28%),
        var(--outfit) 55%,
        color-mix(in srgb, var(--outfit), black 20%)
      );
      border: 2px solid rgba(255,255,255,.42);
      box-shadow: inset 0 5px 9px rgba(255,255,255,.16);
    }

    .anime-collar {
      position: absolute;
      top: -2px;
      left: 29px;
      width: 40px;
      height: 25px;
      background: rgba(255,255,255,.88);
      clip-path: polygon(0 0, 50% 55%, 100% 0, 75% 100%, 25% 100%);
    }

    .anime-shirt-detail {
      position: absolute;
      left: 47px;
      top: 29px;
      width: 8px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255,255,255,.65);
    }

    .anime-button {
      position: absolute;
      left: 49px;
      top: 69px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #fff;
    }

    .anime-neck {
      position: absolute;
      z-index: 2;
      top: 119px;
      left: 73px;
      width: 34px;
      height: 36px;
      border-radius: 0 0 13px 13px;
      background: var(--skin);
    }

    .anime-arm {
      position: absolute;
      z-index: 2;
      top: 159px;
      width: 23px;
      height: 70px;
      border-radius: 20px;
      background: var(--outfit);
      border: 2px solid rgba(255,255,255,.3);
    }

    .anime-arm-left {
      left: 27px;
      transform: rotate(17deg);
    }

    .anime-arm-right {
      right: 27px;
      transform: rotate(-17deg);
    }

    /* ==================================
       HEAD AND FACE
    ================================== */

    .anime-head {
      position: absolute;
      z-index: 5;
      top: 24px;
      left: 43px;
      width: 94px;
      height: 111px;
    }

    .anime-back-hair {
      position: absolute;
      z-index: 3;
      top: 15px;
      left: 31px;
      width: 118px;
      height: 127px;
      border-radius: 48% 48% 35% 35%;
      background: linear-gradient(
        120deg,
        var(--hair2),
        var(--hair) 65%
      );
    }

    .anime-face {
      position: absolute;
      z-index: 4;
      inset: 8px 3px 0;
      overflow: visible;
      border-radius: 47% 47% 46% 46%;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--skin), white 18%),
        var(--skin) 65%,
        color-mix(in srgb, var(--skin), #b46f62 15%)
      );
      box-shadow: inset -5px -4px 8px rgba(128,65,55,.08);
    }

    .anime-ear {
      position: absolute;
      z-index: 2;
      top: 56px;
      width: 15px;
      height: 23px;
      border-radius: 50%;
      background: var(--skin);
    }

    .anime-ear-left { left: -3px; }
    .anime-ear-right { right: -3px; }

    /* Anime bangs */
    .anime-fringe {
      position: absolute;
      z-index: 7;
      top: -6px;
      left: -4px;
      width: 100px;
      height: 49px;
      background: var(--hair);
      border-radius: 52% 48% 22% 20%;
      clip-path: polygon(
        0 0, 100% 0, 100% 70%,
        83% 52%, 73% 100%, 58% 58%,
        42% 94%, 32% 58%, 15% 85%, 0 68%
      );
    }

    .anime-side-hair {
      position: absolute;
      z-index: 6;
      top: 22px;
      width: 18px;
      height: 72px;
      background: var(--hair);
    }

    .anime-side-left {
      left: -3px;
      border-radius: 0 0 15px 9px;
      transform: rotate(5deg);
    }

    .anime-side-right {
      right: -3px;
      border-radius: 0 0 9px 15px;
      transform: rotate(-5deg);
    }

    /* Eyes */
    .anime-eye {
      position: absolute;
      z-index: 8;
      top: 53px;
      width: 17px;
      height: 22px;
      border-radius: 48% 48% 45% 45%;
      background: #fff;
      overflow: hidden;
      border: 1px solid rgba(30,30,50,.2);
    }

    .eye-left { left: 19px; }
    .eye-right { right: 19px; }

    .anime-eye span {
      position: absolute;
      bottom: 1px;
      left: 3px;
      width: 11px;
      height: 16px;
      border-radius: 50%;
      background: var(--eyes);
    }

    .anime-eye span::after {
      content: "";
      position: absolute;
      top: 2px;
      left: 2px;
      width: 4px;
      height: 5px;
      border-radius: 50%;
      background: #fff;
    }

    .anime-eyebrow {
      position: absolute;
      z-index: 8;
      top: 46px;
      width: 20px;
      height: 4px;
      border-radius: 50%;
      background: var(--hair);
    }

    .eyebrow-left { left: 17px; }
    .eyebrow-right { right: 17px; }

    .anime-blush {
      position: absolute;
      z-index: 7;
      top: 80px;
      width: 16px;
      height: 7px;
      border-radius: 50%;
      background: #ed8b9a;
      opacity: .38;
      filter: blur(2px);
    }

    .blush-left { left: 9px; }
    .blush-right { right: 9px; }

    .anime-nose {
      position: absolute;
      z-index: 8;
      top: 77px;
      left: 47px;
      width: 4px;
      height: 5px;
      border-radius: 50%;
      background: rgba(153,90,80,.4);
    }

    .anime-mouth {
      position: absolute;
      z-index: 8;
      top: 87px;
      left: 39px;
      width: 17px;
      height: 8px;
      border-bottom: 2px solid #a95462;
      border-radius: 50%;
    }

    /* ==================================
       HAIR VARIATIONS
    ================================== */

    .anime-girl-one .anime-back-hair,
    .anime-girl-three .anime-back-hair {
      height: 155px;
      top: 3px;
      border-radius: 48% 48% 20% 20%;
    }

    .anime-girl-one .anime-side-hair,
    .anime-girl-three .anime-side-hair {
      height: 100px;
      width: 22px;
    }

    .anime-girl-one .anime-fringe {
      height: 43px;
      clip-path: polygon(
        0 0, 100% 0, 100% 68%,
        80% 100%, 65% 58%, 50% 95%,
        34% 57%, 15% 95%, 0 60%
      );
    }

    .anime-girl-two .anime-fringe {
      height: 36px;
      border-radius: 50% 50% 15% 15%;
      clip-path: polygon(
        0 0, 100% 0, 100% 75%,
        70% 100%, 50% 65%, 28% 100%, 0 70%
      );
    }

    .anime-girl-two .anime-side-hair {
      height: 84px;
      width: 15px;
    }

    .anime-boy-two .anime-fringe {
      width: 100px;
      height: 36px;
      transform: rotate(-5deg);
    }

    .anime-boy-two .anime-back-hair {
      height: 105px;
      border-radius: 50% 50% 25% 25%;
    }

    .anime-boy-three .anime-fringe {
      height: 43px;
      transform: rotate(3deg);
    }

    .anime-boy-three .anime-back-hair {
      height: 105px;
      border-radius: 48% 48% 30% 30%;
    }

    /* ==================================
       LEGS AND SHOES
    ================================== */

    .anime-leg {
      position: absolute;
      z-index: 1;
      bottom: 8px;
      width: 27px;
      height: 44px;
      border-radius: 8px 8px 13px 13px;
      background: #293b59;
    }

    .leg-left { left: 59px; }
    .leg-right { right: 59px; }

    .anime-shoe {
      position: absolute;
      z-index: 2;
      bottom: 3px;
      width: 37px;
      height: 16px;
      border-radius: 13px 13px 7px 7px;
      background: #f4f6ff;
      box-shadow: inset 0 -4px 0 rgba(0,0,0,.12);
    }

    .shoe-left { left: 51px; }
    .shoe-right { right: 51px; }

    /* ==================================
       ACCESSORIES
    ================================== */

    .anime-hair-decoration {
      position: absolute;
      z-index: 10;
      top: 12px;
      right: 0;
      width: 20px;
      height: 20px;
      border-radius: 50% 50% 50% 0;
      background: var(--outfit);
      transform: rotate(45deg);
      box-shadow: 0 2px 7px rgba(0,0,0,.15);
    }

    .anime-boy-one .anime-hair-decoration,
    .anime-boy-two .anime-hair-decoration,
    .anime-boy-three .anime-hair-decoration {
      display: none;
    }

    .anime-girl-two .anime-hair-decoration {
      top: 19px;
      right: -3px;
      width: 24px;
      height: 24px;
      border: 3px solid #fff;
    }

    .anime-girl-three .anime-hair-decoration {
      top: 10px;
      right: -5px;
      width: 23px;
      height: 23px;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(255,255,255,.3);
    }

    /* ==================================
       LITTLE STARS
    ================================== */

    .anime-star {
      position: absolute;
      z-index: 10;
      color: #fff;
      text-shadow: 0 0 10px var(--outfit);
      animation: anime-sparkle 2.8s ease-in-out infinite;
      pointer-events: none;
    }

    .star-one {
      top: 32px;
      left: 23px;
      font-size: 20px;
    }

    .star-two {
      top: 90px;
      right: 16px;
      font-size: 25px;
      animation-delay: .7s;
    }

    .star-three {
      bottom: 65px;
      left: 20px;
      font-size: 30px;
      animation-delay: 1.2s;
    }

    /* ==================================
       ANIMATIONS
    ================================== */

    @keyframes anime-idle {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-5px);
      }
    }

    @keyframes anime-sparkle {
      0%, 100% {
        opacity: .35;
        transform: scale(.8) rotate(0deg);
      }
      50% {
        opacity: 1;
        transform: scale(1.2) rotate(15deg);
      }
    }

    /* Selection card */
    .avatar-card .avatar-art-container {
      width: 100%;
    }

    .avatar-card .anime-avatar {
      max-width: 100%;
      margin: auto;
    }

    .avatar-card.selected .anime-avatar {
      filter: drop-shadow(0 0 12px var(--cyan));
    }

    /* Profile */
    .avatar-container .anime-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: transparent;
    }

    .avatar-container .anime-character {
      transform: scale(.88);
      transform-origin: 50% 90%;
    }

    @media (max-width: 500px) {
      .anime-avatar {
        width: 160px;
        height: 195px;
      }

      .anime-character {
        transform: scale(.83);
        transform-origin: 50% 90%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .anime-character,
      .anime-star {
        animation: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}
