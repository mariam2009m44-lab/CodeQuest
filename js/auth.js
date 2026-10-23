
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
  initializeAuthPage(form);
}

function initializeAuthPage(form) {
  const isSignup = form.id === "signupForm";

  const submitButton = form.querySelector('[type="submit"]');
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const nameInput = document.getElementById("name");
  const resetButton = document.getElementById("resetPassword");

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
    "achievements.html"
  ]);

  function getNextPage() {
    const requestedPage = params.get("next") || "dashboard.html";

    try {
      const url = new URL(
        requestedPage,
        window.location.origin
      );

      const page = url.pathname.split("/").pop();

      const isSameOrigin =
        url.origin === window.location.origin;

      const isAllowedPage = allowedPages.has(page);

      const hasValidPath =
        !url.pathname.includes("\\") &&
        !url.pathname.includes("/../") &&
        !url.pathname.startsWith("//");

      if (
        isSameOrigin &&
        isAllowedPage &&
        hasValidPath
      ) {
        return page + url.search + url.hash;
      }
    } catch (error) {
      console.warn("عنوان الصفحة التالية غير صالح.");
    }

    return "dashboard.html";
  }

  if (!emailInput || !passwordInput || !submitButton) {
    console.error(
      "نموذج الحساب يحتاج إلى حقول البريد وكلمة المرور وزر الإرسال."
    );
    return;
  }

  emailInput.autocomplete = "email";
  emailInput.required = true;

  passwordInput.autocomplete = isSignup
    ? "new-password"
    : "current-password";

  passwordInput.required = true;

  if (isSignup && nameInput) {
    nameInput.autocomplete = "nickname";
    nameInput.maxLength = 50;
    nameInput.required = true;
  }

  let message = document.getElementById("authMessage");

  if (!message) {
    message = document.createElement("p");
    message.id = "authMessage";
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");

    message.style.cssText = [
      "margin-top:16px",
      "font-size:14px",
      "line-height:1.8",
      "overflow-wrap:anywhere"
    ].join(";");

    form.insertAdjacentElement("afterend", message);
  }

  function displayMessage(text, isError = false) {
    message.textContent = text;

    message.style.color = isError
      ? "#b91c1c"
      : "#166534";

    message.setAttribute(
      "role",
      isError ? "alert" : "status"
    );
  }

  function getErrorMessage(error) {
    if (error?.code) {
      return authError(error);
    }

    return error?.message || "حدث خطأ غير متوقع. حاولي مرة أخرى.";
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (
      !form.reportValidity() ||
      submitButton.disabled
    ) {
      return;
    }

    const originalButtonText = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    submitButton.textContent = "جارٍ التحقق...";

    displayMessage("");

    try {
      if (isSignup) {
        if (!nameInput) {
          throw new Error("حقل الاسم غير موجود في نموذج التسجيل.");
        }

        await registerUser(
          nameInput.value,
          emailInput.value,
          passwordInput.value
        );
      } else {
        await loginUser(
          emailInput.value,
          passwordInput.value
        );
      }

      displayMessage("تم التحقق بنجاح. جارٍ فتح حسابك.");

      window.location.replace(getNextPage());
    } catch (error) {
      console.error("Authentication form error:", error);

      displayMessage(
        getErrorMessage(error),
        true
      );
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
      submitButton.textContent = originalButtonText;
    }
  });

  if (resetButton && !isSignup) {
    resetButton.addEventListener("click", async event => {
      event.preventDefault();

      if (resetButton.dataset.pending === "true") {
        return;
      }

      const originalText = resetButton.textContent;

      resetButton.dataset.pending = "true";
      resetButton.setAttribute("aria-busy", "true");

      if ("disabled" in resetButton) {
        resetButton.disabled = true;
      }

      resetButton.textContent = "جارٍ إرسال الطلب...";

      try {
        const email = emailInput.value.trim();

        if (!email) {
          displayMessage(
            "اكتبي بريدك الإلكتروني أولًا.",
            true
          );

          emailInput.focus();
          return;
        }

        await resetPassword(email);

        displayMessage(
          "لو البريد الإلكتروني مسجل، هتوصلك رسالة لإعادة تعيين كلمة المرور."
        );
      } catch (error) {
        console.error("Password reset error:", error);

        displayMessage(
          getErrorMessage(error),
          true
        );
      } finally {
        delete resetButton.dataset.pending;
        resetButton.removeAttribute("aria-busy");

        if ("disabled" in resetButton) {
          resetButton.disabled = false;
        }

        resetButton.textContent = originalText;
      }
    });
  }
}
