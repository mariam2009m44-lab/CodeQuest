
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
  throw new Error("نموذج الحساب غير موجود.");
}

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
  "projects.html"
]);

function getNextPage() {
  const raw = params.get("next") || "dashboard.html";

  try {
    const url = new URL(raw, location.origin);
    const page = url.pathname.split("/").pop();

    if (
      url.origin === location.origin &&
      !url.pathname.includes("/../") &&
      allowedPages.has(page)
    ) {
      return page + url.search + url.hash;
    }
  } catch (error) {
    // استخدام الصفحة الافتراضية عند وجود عنوان غير صالح.
  }

  return "dashboard.html";
}

if (nameInput) {
  nameInput.autocomplete = "nickname";
  nameInput.maxLength = 50;
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
    try {
      await resetPassword(emailInput.value);
      displayMessage("لو البريد مسجل، هتوصلك رسالة لإعادة تعيين كلمة المرور.");
    } catch (error) {
      displayMessage(
        error?.code ? authError(error) : error?.message || "تعذر إرسال الرسالة.",
        true
      );
    }
  });
}
