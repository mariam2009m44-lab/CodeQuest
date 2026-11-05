(function () {
  "use strict";

  const THEME_KEY = "cq_theme";
  const MOTION_KEY = "cq_motion";

  const DEFAULT_THEME = "dark";
  const DEFAULT_MOTION = "on";

  const root = document.documentElement;

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn("Cody: Could not save preference:", error);
      return false;
    }
  }

  function getSavedTheme() {
    const saved = readStorage(THEME_KEY, DEFAULT_THEME);
    return saved === "light" ? "light" : "dark";
  }

  function getSavedMotion() {
    const saved = readStorage(MOTION_KEY, DEFAULT_MOTION);
    return saved === "off" ? "off" : "on";
  }

  function updateThemeMeta(theme) {
    const meta = document.querySelector(
      'meta[name="theme-color"]'
    );

    if (!meta) return;

    meta.setAttribute(
      "content",
      theme === "light" ? "#F5F7FC" : "#080B18"
    );
  }

  function dispatchPreferenceEvent(name, detail) {
    document.dispatchEvent(
      new CustomEvent(name, { detail })
    );
  }

  function applyTheme(theme) {
    const safeTheme = theme === "light" ? "light" : "dark";

    root.dataset.theme = safeTheme;
    root.style.colorScheme = safeTheme;

    updateThemeMeta(safeTheme);

    dispatchPreferenceEvent("cq:themechange", {
      theme: safeTheme
    });

    return safeTheme;
  }

  function saveTheme(theme) {
    const safeTheme = theme === "light" ? "light" : "dark";

    saveStorage(THEME_KEY, safeTheme);

    return applyTheme(safeTheme);
  }

  function toggleTheme() {
    const currentTheme =
      root.dataset.theme || getSavedTheme();

    const nextTheme =
      currentTheme === "dark" ? "light" : "dark";

    return saveTheme(nextTheme);
  }

  function applyMotion(mode) {
    const safeMode = mode === "off" ? "off" : "on";

    root.dataset.motion = safeMode;

    dispatchPreferenceEvent("cq:motionchange", {
      motion: safeMode
    });

    return safeMode;
  }

  function saveMotion(mode) {
    const safeMode = mode === "off" ? "off" : "on";

    saveStorage(MOTION_KEY, safeMode);

    return applyMotion(safeMode);
  }

  function toggleMotion() {
    const currentMotion =
      root.dataset.motion || getSavedMotion();

    const nextMotion =
      currentMotion === "on" ? "off" : "on";

    return saveMotion(nextMotion);
  }

  function applySavedPreferences() {
    applyTheme(getSavedTheme());
    applyMotion(getSavedMotion());
  }

  // تطبيق الإعدادات قبل عرض الصفحة قدر الإمكان.
  applySavedPreferences();

  // مزامنة الإعدادات بين تبويبات المتصفح.
  window.addEventListener("storage", function (event) {
    if (event.key === THEME_KEY) {
      applyTheme(
        event.newValue === "light" ? "light" : "dark"
      );
    }

    if (event.key === MOTION_KEY) {
      applyMotion(
        event.newValue === "off" ? "off" : "on"
      );
    }

    // عند مسح localStorage بالكامل.
    if (event.key === null) {
      applySavedPreferences();
    }
  });

  // واجهة موحدة لباقي ملفات Cody Academy.
  window.CodyTheme = Object.freeze({
    get: getSavedTheme,
    apply: applyTheme,
    save: saveTheme,
    toggle: toggleTheme
  });

  window.CodyMotion = Object.freeze({
    get: getSavedMotion,
    apply: applyMotion,
    save: saveMotion,
    toggle: toggleMotion
  });

})();