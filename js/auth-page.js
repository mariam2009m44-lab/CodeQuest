
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
  const themeButton = document.getElementById("authThemeToggle");

  function syncAuthThemeControl() {
    if (!themeButton) return;
    const dark = document.documentElement.dataset.theme !== "light";
    const icon = themeButton.querySelector("i");
    const nextLabel = dark ? "المظهر الفاتح" : "المظهر الداكن";
    themeButton.setAttribute("aria-label", `التبديل إلى ${nextLabel}`);
    themeButton.title = `التبديل إلى ${nextLabel}`;
    if (icon) icon.className = dark ? "ri-sun-line" : "ri-moon-line";
  }

  themeButton?.addEventListener("click", () => {
    if (window.CodyTheme?.toggle) window.CodyTheme.toggle();
    syncAuthThemeControl();
  });
  document.addEventListener("cq:themechange", syncAuthThemeControl);
  syncAuthThemeControl();
  const submitButton = form.querySelector('[type="submit"]');
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const nameInput = document.getElementById("name");
  const params = new URLSearchParams(window.location.search);

  const sibling = document.querySelector(
    isSignup ? 'a[href="login.html"]' : 'a[href="signup.html"]'
  );

  if (sibling && params.has("next")) {
    const target = new URL(sibling.href);
    target.searchParams.set("next", params.get("next"));
    sibling.href = target.href;
  }

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
    "game-3d.html",
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
    "studio.html",
    "parent.html",
    "achievements.html",
    "course-path.html"
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
    } catch (error) {
      console.warn("Invalid redirect destination:", error);
    }

    return "dashboard.html";
  }

  if (nameInput) {
    nameInput.autocomplete = "nickname";
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
    message.replaceChildren(document.createTextNode(text));
    message.classList.toggle("is-error", Boolean(isError) && Boolean(text));
    message.classList.toggle("is-success", Boolean(text) && !isError);
    message.setAttribute("role", isError ? "alert" : "status");
  }

  function displayExistingAccountMessage() {
    displayMessage(
      "هذا البريد الإلكتروني مسجّل بالفعل. لا حاجة إلى إنشاء حساب آخر؛ انتقل إلى تسجيل الدخول. إذا لم تتذكر كلمة المرور، استخدم خيار «نسيت كلمة المرور؟» هناك.",
      true
    );

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.flexWrap = "wrap";
    actions.style.gap = "12px";
    actions.style.marginTop = "10px";

    const loginLink = document.createElement("a");
    loginLink.href = "login.html";
    loginLink.textContent = "الانتقال إلى تسجيل الدخول";
    loginLink.style.fontWeight = "800";
    loginLink.style.color = "#4f46e5";

    actions.append(loginLink);
    message.append(actions);
  }

  function getErrorMessage(error) {
    const code = typeof error?.code === "string"
      ? ` (رمز الخطأ: ${error.code})`
      : "";

    if (error?.accountCreated) {
      if (error.profileStage === "auth-profile") {
        return `تم إنشاء حساب الدخول، لكن تعذر حفظ اسم العرض في Firebase Authentication. لا تنشئ حسابًا آخر؛ سجّل الدخول، ويمكن إعادة ضبط اسم العرض لاحقًا. ${code}`;
      }

      const stage = error.profileStage === "read"
        ? "قراءة ملف التعلّم"
        : "حفظ ملف التعلّم";

      return `تم إنشاء حساب الدخول بالفعل، لكن تعذرت ${stage} في Firestore. لا تنشئ حسابًا آخر؛ سجّل الدخول مرة أخرى. إذا استمرت المشكلة، يجب مراجعة قواعد Firestore المنشورة. ${code}`;
    }

    if (error?.code === "auth/invalid-credential") {
      return `رفض Firebase بيانات تسجيل الدخول. تحقّق من أن مزوّد الحساب هو Email/Password، ثم استخدم خيار «نسيت كلمة المرور؟» إذا لزم الأمر. لا يحدد هذا الرمز وحده ما إذا كان السبب البريد الإلكتروني أم كلمة المرور.${code}`;
    }

    if (error?.code) {
      return `${authError(error)}${code}`;
    }

    return error?.message || "حدث خطأ غير متوقع. حاول مرة أخرى.";
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
      // Log diagnostic metadata only. Never log passwords or form values.
      console.error("CodeQuest authentication flow failed:", {
        code: error?.code || null,
        profileStage: error?.profileStage || null,
        accountCreated: error?.accountCreated === true,
        message: error?.message || String(error)
      });

      if (isSignup && error?.code === "auth/email-already-in-use") {
        displayExistingAccountMessage();
      } else {
        displayMessage(getErrorMessage(error), true);
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });

  const resetButton = document.getElementById("resetPassword");

  async function sendResetLink(button) {
    if (!emailInput || button.disabled) return;

    const email = emailInput.value.trim();
    if (!email || !emailInput.checkValidity()) {
      emailInput.reportValidity();
      displayMessage("أدخل البريد الإلكتروني المستخدم في الحساب أولًا.", true);
      return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "جارٍ إرسال الرابط...";

    try {
      await resetPassword(email);
      displayMessage(
        "تم طلب إرسال رابط إعادة التعيين. افحص صندوق الوارد والرسائل غير المرغوب فيها (Spam)، ثم افتح الرابط وعيّن كلمة مرور جديدة."
      );
    } catch (error) {
      displayMessage(getErrorMessage(error), true);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  if (resetButton && !isSignup) {
    resetButton.addEventListener("click", () => sendResetLink(resetButton));
  }
}
