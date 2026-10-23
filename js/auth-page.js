import {
  loginUser,
  registerUser,
  resetPassword,
  authError
} from "./auth.js";

const form =
  document.getElementById("loginForm") ||
  document.getElementById("signupForm");

if (!form) {
  console.error("لم يتم العثور على نموذج تسجيل الدخول أو إنشاء الحساب.");
} else {
  const isSignup = form.id === "signupForm";
  const submitButton = form.querySelector('[type="submit"]');
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const nameInput = document.getElementById("name");
  const params = new URLSearchParams(window.location.search);

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
      const url = new URL(raw, window.location.origin);
      const page = url.pathname.split("/").pop();

      if (
        url.origin === window.location.origin &&
        allowedPages.has(page)
      ) {
        return `${page}${url.search}${url.hash}`;
      }
    } catch {
      // استخدام صفحة لوحة التحكم عند وجود رابط غير صالح.
    }

    return "dashboard.html";
  }

  if (nameInput) {
    nameInput.autocomplete = "name";
    nameInput.maxLength = 50;
    nameInput.required = true;
  }

  if (emailInput) {
    emailInput.autocomplete = "email";
    emailInput.maxLength = 254;
    emailInput.required = true;
  }

  if (passwordInput) {
    passwordInput.autocomplete = isSignup
      ? "new-password"
      : "current-password";

    passwordInput.required = true;
  }

  const message = document.createElement("p");
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
  message.className = "auth-message";
  form.insertAdjacentElement("afterend", message);

  function displayMessage(text, isError = false) {
    message.textContent = text;
    message.setAttribute("role", isError ? "alert" : "status");
    message.style.color = isError ? "#b91c1c" : "#166534";
  }

  function getErrorMessage(error) {
    if (error?.code) {
      return authError(error);
    }

    return error?.message || "حدث خطأ غير متوقع. حاولي مرة أخرى.";
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!form.reportValidity() || submitButton?.disabled) {
      return;
    }

    const originalText = submitButton?.textContent || "";
    
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "جارٍ التحقق...";
    }

    displayMessage("");

    try {
      if (isSignup) {
        if (!nameInput || !emailInput || !passwordInput) {
          throw new Error("بعض حقول إنشاء الحساب غير موجودة.");
        }

        await registerUser(
          nameInput.value.trim(),
          emailInput.value.trim(),
          passwordInput.value
        );
      } else {
        if (!emailInput || !passwordInput) {
          throw new Error("حقول تسجيل الدخول غير موجودة.");
        }

        await loginUser(
          emailInput.value.trim(),
          passwordInput.value
        );
      }

      window.location.replace(getNextPage());
    } catch (error) {
      displayMessage(getErrorMessage(error), true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });

  const resetButton = document.getElementById("resetPassword");

  if (resetButton && !isSignup) {
    resetButton.addEventListener("click", async () => {
      if (!emailInput || resetButton.disabled) {
        return;
      }

      if (!emailInput.value.trim() || !emailInput.checkValidity()) {
        emailInput.reportValidity();
        displayMessage("اكتبي بريدًا إلكترونيًا صحيحًا أولًا.", true);
        return;
      }

      const originalText = resetButton.textContent;
      resetButton.disabled = true;
      resetButton.textContent = "جارٍ الإرسال...";

      try {
        await resetPassword(emailInput.value.trim());

        displayMessage(
          "لو البريد مسجل، هتوصلك رسالة لإعادة تعيين كلمة المرور."
        );
      } catch (error) {
        displayMessage(getErrorMessage(error), true);
      } finally {
        resetButton.disabled = false;
        resetButton.textContent = originalText;
      }
    });
  }
}