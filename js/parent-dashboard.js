import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { parentApi, parentErrorText } from "./parent-api.js";

const $ = selector => document.querySelector(selector);
const childrenContainer = $("#childrenContainer");
const claimButton = $("#claimLinkButton");
const refreshButton = $("#refreshButton");
const codeInput = $("#parentLinkCode");
const claimStatus = $("#claimStatus");
let currentUser = null;
// A slower response for a previous account or an earlier refresh must never replace the current view.
let dashboardRequestId = 0;

function setStatus(el, message, type = "") { el.textContent = message; el.className = "status" + (type ? " " + type : ""); }
function setBusy(button, busy, label) { if (!button.dataset.label) button.dataset.label = button.textContent.trim(); button.disabled = busy; button.textContent = busy ? label : button.dataset.label; }
function element(tag, className, text) { const n = document.createElement(tag); if (className) n.className = className; if (text !== undefined) n.textContent = String(text); return n; }
function clearPrivate() { dashboardRequestId++; childrenContainer.replaceChildren(); }

// Shown fields (exactly what the server returns): lessonTestsPassed and unitExamsPassed, server-assessed counts only.
// "unknown" means the server has no assessed results for this account. It is NOT zero: results may exist that were never synced.
function renderChild(child, index, d) {
  const card = element("article", "child-card");
  const head = element("div", "child-head");
  head.append(element("span", "child-avatar", "♙"));
  const identity = element("div");
  identity.append(element("div", "child-name", "حساب متعلم مرتبط " + (index + 1)));
  identity.append(element("div", "child-sub", "الاسم والبريد غير معروضين"));
  head.append(identity); card.append(head);
  const known = d && d.available === true && d.syncState === "assessed";
  const stats = element("div", "stats");
  [[d?.lessonTestsPassed, "اختبار درس ناجح"], [d?.unitExamsPassed, "امتحان وحدة ناجح"]].forEach(([value, label]) => {
    const box = element("div", "stat");
    box.append(element("strong", "", known ? (Number(value) || 0) : "غير متاح"));
    box.append(element("span", "", label));
    stats.append(box);
  });
  card.append(stats);
  if (!known) {
    const note = element("p", "child-sub", d?.syncState === "read_failed" ? "تعذر تحميل البيانات مؤقتًا. حاول التحديث بعد قليل." : "لا توجد بعد نتائج موثّقة على الخادم لهذا الحساب، وهذا لا يعني أنه لم يتعلم شيئًا.");
    note.setAttribute("role", "status"); note.style.margin = "10px 0 0"; card.append(note);
  } else {
    const note = element("p", "child-sub", "تُحسب النتائج التي قيّمها الخادم فقط."); note.style.margin = "10px 0 0"; card.append(note);
  }
  const actions = element("div", "child-actions");
  const unlink = element("button", "unlink-button", "إلغاء الربط"); unlink.type = "button";
  unlink.addEventListener("click", async () => {
    if (!window.confirm("هل تريد إلغاء ربط هذا الحساب؟ لن يتم حذف حساب المتعلم أو تقدمه.")) return;
    unlink.disabled = true;
    const r = await parentApi(currentUser, "unlink", { child: child.uid });
    if (r.ok) await loadDashboard(); else { window.alert(parentErrorText(r)); unlink.disabled = false; }
  });
  actions.append(unlink); card.append(actions);
  return card;
}

function emptyState(title, text) {
  const empty = element("div", "empty-state"); empty.style.gridColumn = "1 / -1";
  empty.append(element("strong", "", title)); if (text) empty.append(element("p", "", text)); return empty;
}

async function loadDashboard() {
  if (!currentUser?.uid) return;
  const uid = currentUser.uid, id = ++dashboardRequestId;
  childrenContainer.replaceChildren(element("div", "empty-state", "جارٍ تحميل بيانات الأسرة..."));
  refreshButton.disabled = true;
  const stale = () => id !== dashboardRequestId || currentUser?.uid !== uid;
  try {
    const list = await parentApi(currentUser, "children", {});
    if (stale()) return;
    if (!list.ok) { childrenContainer.replaceChildren(emptyState(parentErrorText(list))); return; }
    const kids = Array.isArray(list.data.children) ? list.data.children : [];
    if (!kids.length) { childrenContainer.replaceChildren(emptyState("لا توجد حسابات مرتبطة حتى الآن", "يُنشئ المتعلم رمز الربط من حسابه، ثم يشاركه مع ولي الأمر لإدخاله هنا.")); return; }
    const cards = [];
    for (let i = 0; i < kids.length; i++) {
      const r = await parentApi(currentUser, "dashboard", { child: kids[i].uid });
      if (stale()) return;
      // A failed or refused read renders no child data at all.
      if (r.status === 403) { cards.push(null); continue; }
      cards.push(renderChild(kids[i], i, r.ok ? r.data : { available: false, syncState: "read_failed" }));
    }
    childrenContainer.replaceChildren(...cards.filter(Boolean));
    if (!childrenContainer.children.length) childrenContainer.replaceChildren(emptyState("لا توجد حسابات مرتبطة حتى الآن"));
  } finally { if (id === dashboardRequestId) refreshButton.disabled = !currentUser?.uid; }
}

claimButton.addEventListener("click", async () => {
  const code = codeInput.value.trim().toUpperCase().replace(/[\s-]/g, "");
  if (!/^[A-Z2-9]{12}$/.test(code)) { setStatus(claimStatus, "أدخل الرمز المكوّن من 12 حرفًا ورقمًا.", "error"); return; }
  setBusy(claimButton, true, "جارٍ ربط الحساب...");
  setStatus(claimStatus, "يتم التحقق من الرمز بأمان...");
  try {
    const r = await parentApi(currentUser, "claim", { code });
    if (!r.ok) { setStatus(claimStatus, parentErrorText(r), "error"); return; }
    setStatus(claimStatus, "تم ربط الحساب بنجاح.", "success"); codeInput.value = "";
    await loadDashboard();
  } finally { setBusy(claimButton, false); }
});
refreshButton.addEventListener("click", loadDashboard);
codeInput.addEventListener("input", () => { codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 12); });

onAuthStateChanged(auth, user => {
  currentUser = user; clearPrivate();
  if (!user) {
    refreshButton.disabled = true; claimButton.disabled = true;
    const e = emptyState("سجّل الدخول للمتابعة"); const link = element("a", "soft-button", "تسجيل الدخول"); link.href = "login.html"; link.style.marginTop = "12px"; e.append(link);
    childrenContainer.append(e); setStatus(claimStatus, "يلزم تسجيل الدخول لاستخدام الربط.");
    return;
  }
  claimButton.disabled = false; loadDashboard();
});
