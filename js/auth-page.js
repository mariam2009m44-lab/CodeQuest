
import {
  loginUser,
  registerUser,
  resetPassword,
  authError
} from "./auth.js";

const form =
  document.getElementById("loginForm") ||
  document.getElementById("signupForm");

if (form) {
  const isSignup = form.id === "signupForm";
  const submitButton = form.querySelector('[type="submit"]');
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const nameInput = document.getElementById("name");

  const params = new URLSearchParams(location.search);
  const allowedPages = new Set([
    "dashboard.html",
    "languages.html",
    "levels.html",
    "lecture.html",
    "playground.html",
    "profile.html",
    "games.html",
    "projects.html",
    "achievements.html",
    "progress.html",
    "shop.html",
    "leaderboard.html",
    "settings.html"
  ]);

  function getNextPage() {
    const raw = params.get("next") || "dashboard.html";

    try {
      const url = new URL(raw, location.origin);
      const page = url.pathname.split("/").pop();

      if (
        url.origin === location.origin &&
        allowedPages.has(page)
      ) {
        return page + url.search + url.hash;
      }
    } catch {
      // استخدام الصفحة الافتراضية.
    }

    return "dashboard.html";
  }

  if (nameInput) {
    nameInput.autocomplete = "name";
    nameInput.maxLength = 50;
  }

  if (emailInput) {
    emailInput.autocomplete = "email";
    emailInput.maxLength = 254;
  }

  if (passwordInput) {
    passwordInput.autocomplete = isSignup
      ? "new-password"
      : "current-password";
  }

  const message = document.createElement("p");
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
  form.after(message);

  function displayMessage(text, isError = false) {
    message.textContent = text;
    message.style.color = isError ? "#b91c1c" : "#166534";
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!form.reportValidity() || submitButton.disabled) return;

    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "جارٍ التحقق...";
    displayMessage("");

    try {
      if (isSignup) {
        if (!nameInput || !emailInput || !passwordInput) {
          throw new Error("بعض حقول التسجيل غير موجودة.");
        }

        await registerUser(
          nameInput.value,
          emailInput.value,
          passwordInput.value
        );
      } else {
        if (!emailInput || !passwordInput) {
          throw new Error("حقول تسجيل الدخول غير موجودة.");
        }

        await loginUser(
          emailInput.value,
          passwordInput.value
        );
      }

      location.replace(getNextPage());
    } catch (error) {
      displayMessage(
        error?.code ? authError(error) : error?.message || "حدث خطأ غير متوقع.",
        true
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });

  const resetButton = document.getElementById("resetPassword");

  if (resetButton && !isSignup) {
    resetButton.addEventListener("click", async () => {
      if (!emailInput || resetButton.disabled) return;

      const originalText = resetButton.textContent;
      resetButton.disabled = true;
      resetButton.textContent = "جارٍ الإرسال...";

      try {
        await resetPassword(emailInput.value);
        displayMessage(
          "لو البريد مسجل، هتوصلك رسالة لإعادة تعيين كلمة المرور."
        );
      } catch (error) {
        displayMessage(
          error?.code ? authError(error) : error?.message || "تعذر إرسال الرسالة.",
          true
        );
      } finally {
        resetButton.disabled = false;
        resetButton.textContent = originalText;
      }
    });
  }
} else {
  console.error("لم يتم العثور على نموذج تسجيل الدخول أو إنشاء الحساب.");
}
