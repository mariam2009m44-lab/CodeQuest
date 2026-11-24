

/*
 * Cody Academy — Shared UI Utilities
 * Toast notifications and optional feedback sounds.
 *
 * Public API:
 * import { showToast } from "./ui.js";
 * showToast("تم الحفظ", "success");
 */

const TOAST_CONTAINER_ID = "toast-container";
const TOAST_DURATION = 3500;

const TOAST_COLORS = Object.freeze({
  info: {
    background: "#E8EAFE",
    foreground: "#30266F",
    border: "#B9B7F4"
  },
  success: {
    background: "#DDF8ED",
    foreground: "#075B3D",
    border: "#8BE0BC"
  },
  warning: {
    background: "#FFF4D6",
    foreground: "#754B00",
    border: "#F1D184"
  },
  error: {
    background: "#FFE5E8",
    foreground: "#8C1D32",
    border: "#F3A6B2"
  }
});

function playFeedbackSound(type) {
  // One local engine owns mute, volume and timbre across the platform.
  // No autoplay default or third-party audio request on a saved notification.
  const effect = type === "success" ? "correct" : type === "error" ? "wrong" : null;
  if (effect) window.CodeQuestAudio?.play(effect);
}

function getToastContainer() {
  let container = document.getElementById(
    TOAST_CONTAINER_ID
  );

  if (container) {
    return container;
  }

  container = document.createElement("div");
  container.id = TOAST_CONTAINER_ID;
  container.setAttribute(
    "aria-label",
    "إشعارات المنصة"
  );

  container.style.cssText = [
    "position:fixed",
    "top:max(16px, env(safe-area-inset-top))",
    "left:50%",
    "transform:translateX(-50%)",
    "z-index:10000",
    "display:flex",
    "flex-direction:column",
    "align-items:center",
    "gap:10px",
    "width:min(440px, calc(100vw - 32px))",
    "pointer-events:none"
  ].join(";");

  document.body.appendChild(container);

  return container;
}

function normalizeToastType(type) {
  return Object.prototype.hasOwnProperty.call(
    TOAST_COLORS,
    type
  )
    ? type
    : "info";
}

/**
 * Display an accessible toast notification.
 *
 * @param {string} message Notification text.
 * @param {"info"|"success"|"warning"|"error"} type
 * @returns {HTMLElement|null}
 */
export const showToast = (message, type = "info") => {
  if (
    typeof document === "undefined" ||
    !document.body
  ) {
    return null;
  }

  const safeType = normalizeToastType(type);
  const safeMessage = String(message ?? "").trim();

  if (!safeMessage) {
    return null;
  }

  const container = getToastContainer();
  const palette = TOAST_COLORS[safeType];

  const toast = document.createElement("div");

  toast.className = `cq-toast cq-toast--${safeType}`;

  toast.setAttribute(
    "role",
    safeType === "error" ? "alert" : "status"
  );

  toast.setAttribute(
    "aria-live",
    safeType === "error" ? "assertive" : "polite"
  );

  toast.setAttribute("aria-atomic", "true");

  // textContent prevents injected HTML from being executed.
  toast.textContent = safeMessage;

  toast.style.cssText = [
    "width:100%",
    "max-width:100%",
    "padding:12px 18px",
    `border:1px solid ${palette.border}`,
    "border-radius:14px",
    `background:${palette.background}`,
    `color:${palette.foreground}`,
    "font-family:Cairo, Tahoma, sans-serif",
    "font-size:14px",
    "font-weight:700",
    "line-height:1.7",
    "text-align:center",
    "overflow-wrap:anywhere",
    "box-shadow:0 10px 30px rgba(0,0,0,.16)",
    "opacity:0",
    "transform:translateY(-8px)",
    "transition:opacity 180ms ease, transform 180ms ease",
    "pointer-events:auto"
  ].join(";");

  container.appendChild(toast);

  playFeedbackSound(safeType);

  const reduceMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  if (reduceMotion) {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  } else {
    window.requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
  }

  const removeToast = () => {
    if (!toast.isConnected) {
      return;
    }

    toast.style.opacity = "0";
    toast.style.transform = "translateY(-8px)";

    window.setTimeout(() => {
      toast.remove();

      if (
        container.isConnected &&
        container.childElementCount === 0
      ) {
        container.remove();
      }
    }, reduceMotion ? 0 : 200);
  };

  const timeoutId = window.setTimeout(
    removeToast,
    TOAST_DURATION
  );

  toast.addEventListener(
    "click",
    () => {
      window.clearTimeout(timeoutId);
      removeToast();
    },
    { once: true }
  );

  return toast;
};