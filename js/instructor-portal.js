import { auth, authPersistenceReady } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const status = document.getElementById("portalStatus");
const action = document.getElementById("portalAction");
const fallback = document.getElementById("loginFallback");

function message(text, error = false) {
  status.textContent = text;
  status.style.color = error ? "#b42318" : "#6e6e73";
}

await authPersistenceReady;
onAuthStateChanged(auth, async user => {
  if (!user) {
    message("سجّل الدخول بحساب CodeQuest للمتابعة.");
    action.href = "login.html?next=instructor-portal.html";
    action.textContent = "تسجيل الدخول للمتابعة";
    fallback.hidden = false;
    return;
  }

  message("جارٍ التحقق من اعتماد حساب المدرّب…");
  action.setAttribute("aria-disabled", "true");
  try {
    const token = await user.getIdTokenResult(true);
    const approved = token.claims.liveRole === "instructor"
      && token.claims.liveInstructorApproved === true;
    const admin = token.claims.liveRole === "admin"
      || token.claims.admin === true;

    if (approved || admin) {
      message(admin ? "تم التحقق من صلاحيات مسؤول الأكاديمية." : "تم التحقق من اعتماد حساب المدرّب.");
      action.href = "live-academy.html";
      action.textContent = "افتح مساحة إدارة الفصول";
      action.removeAttribute("aria-disabled");
      fallback.hidden = true;
    } else {
      message("الحساب مسجّل، لكنه غير معتمد كمدرّب حتى الآن. أدوات إنشاء الفصول لا تُتاح إلا بعد مراجعة مسؤول الأكاديمية.", true);
      action.href = "live-academy.html";
      action.textContent = "عرض الأكاديمية";
      action.removeAttribute("aria-disabled");
      fallback.hidden = true;
    }
  } catch (error) {
    message("تعذّر التحقق من صلاحيات الحساب. حدّثي الصفحة أو سجّل الدخول مرة أخرى.", true);
    action.href = "login.html?next=instructor-portal.html";
    action.textContent = "إعادة تسجيل الدخول";
    fallback.hidden = false;
  }
});
