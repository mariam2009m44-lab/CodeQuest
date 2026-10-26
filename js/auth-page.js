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
  const params = new URLSearchParams(window.location.search);

  const allowedPages = new Set([
    "dashboard.html",
    "languages.html",
    "levels.html",
    "lecture.html",
    "playground.html",
    "profile.html",
    "games.html",
    "game-quiz.html",
    "game-memory.html",
    "game-build.html",
    "game-bug.html",
    "game-match.html",
    "game-speed.html",
    "projects.html",
    "avatar.html",
    "progress.html",
    "shop.html",
    "store.html",
    "leaderboard.html",
    "settings.html",
    "python-welcome.html",
    "python-chapters.html",
    "python-lesson.html",
    "python-exam.html",
    "python-projects.html",
    "java-chapters.html",
    "java-lessons.html",
    "lang-intro.html",
    "vr-lab.html",
    "studio.html"
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
    } catch {}

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

  message.className = "auth-message";
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");

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
} else {
  console.error("لم يتم العثور على نموذج تسجيل الدخول أو إنشاء الحساب.");
}