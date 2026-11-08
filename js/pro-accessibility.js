(() => {
  "use strict";

  if (window.__codeQuestAccessibilityLoaded) return;
  window.__codeQuestAccessibilityLoaded = true;

  document.querySelectorAll("button, a").forEach((element) => {
    const text = (element.textContent || "").trim();
    const label = element.getAttribute("aria-label");
    const title = element.getAttribute("title");

    if (!text && !label && title) {
      element.setAttribute("aria-label", title);
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      let target;
      try {
        target = document.querySelector(targetId);
      } catch {
        return;
      }
      if (!target) return;

      event.preventDefault();
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start"
      });

      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
    });
  });

  document.querySelectorAll('[role="status"], [role="alert"]').forEach((element) => {
    if (!element.hasAttribute("aria-live")) {
      element.setAttribute(
        "aria-live",
        element.getAttribute("role") === "alert" ? "assertive" : "polite"
      );
    }
  });

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  function updateMotionPreference() {
    document.documentElement.classList.toggle(
      "reduce-motion",
      reducedMotion.matches
    );
  }

  updateMotionPreference();

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", updateMotionPreference);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(updateMotionPreference);
  }
})();
