import { auth, authPersistenceReady } from "./firebase-config.js";
import { academyWorker } from "./academy-api.js";
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

  message("جارٍ التحقق من حالة حسابك…");
  action.setAttribute("aria-disabled", "true");
  try {
    const r = await academyWorker(user, "my-role", {});
    const role = r.ok ? r.data.role : "";
    if (!r.ok) throw new Error("role");
    action.removeAttribute("aria-disabled"); fallback.hidden = true;
    if (role === "trainer" || role === "admin") {
      message("حسابك معتمد كمدرّب. افتح مجتمع الأكاديمية لإنشاء المجموعات وجدولة الجلسات.");
      action.href = "academy-hub.html"; action.textContent = "افتح مجتمع الأكاديمية";
    } else if (role === "applicant_pending") {
      message("طلبك قيد المراجعة. سنعتمده قريبًا، ويمكنك في الأثناء تصفّح مجتمع الأكاديمية.");
      action.href = "academy-hub.html"; action.textContent = "تصفّح مجتمع الأكاديمية";
    } else {
      message("لم تقدّم طلب مدرّب بعد. التقديم يستغرق دقائق، وبعد الاعتماد تنشئ مجموعاتك وجلساتك.");
      action.href = "academy-registration.html"; action.textContent = "قدّم كمدرّب";
    }
  } catch (error) {
    message("تعذّر التحقق من صلاحيات الحساب. حدّث الصفحة أو سجّل الدخول مرة أخرى.", true);
    action.href = "login.html?next=instructor-portal.html";
    action.textContent = "إعادة تسجيل الدخول";
    fallback.hidden = false;
  }
});
