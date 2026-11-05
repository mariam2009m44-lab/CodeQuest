(function () {
  "use strict";

  const STORAGE_KEY = "cq_theme";
  const DEFAULT_THEME = "dark";

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === "light" || saved === "dark"
        ? saved
        : DEFAULT_THEME;
    } catch (error) {
      return DEFAULT_THEME;
    }
  }

  function updateThemeMeta(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');

    if (meta) {
      meta.setAttribute(
        "content",
        theme === "light" ? "#F5F7FC" : "#080B18"
      );
    }
  }

  function applyTheme(theme) {
    const safeTheme = theme === "light" ? "light" : "dark";

    document.documentElement.dataset.theme = safeTheme;
    document.documentElement.style.colorScheme = safeTheme;

    updateThemeMeta(safeTheme);

    document.dispatchEvent(
      new CustomEvent("cq:themechange", {
        detail: { theme: safeTheme }
      })
    );

    return safeTheme;
  }

  function saveTheme(theme) {
    const safeTheme = theme === "light" ? "light" : "dark";

    try {
      localStorage.setItem(STORAGE_KEY, safeTheme);
    } catch (error) {
      console.warn("Could not save theme preference:", error);
    }

    return applyTheme(safeTheme);
  }

  // تطبيق الوضع المحفوظ فور تحميل الصفحة.
  const initialTheme = getSavedTheme();
  applyTheme(initialTheme);

  // مزامنة الوضع إذا تغير من تبويب آخر.
  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) {
      applyTheme(
        event.newValue === "light" ? "light" : "dark"
      );
    }
  });

  // إتاحة دوال الثيم لباقي ملفات المنصة.
  window.CodyTheme = Object.freeze({
    get: getSavedTheme,
    apply: applyTheme,
    save: saveTheme,
    toggle: function () {
      const nextTheme =
        document.documentElement.dataset.theme === "dark"
          ? "light"
          : "dark";

      return saveTheme(nextTheme);
    }
  });
})();