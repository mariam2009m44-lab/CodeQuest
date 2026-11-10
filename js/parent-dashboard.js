import { auth, functions } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";

const call = name => httpsCallable(functions, name, { timeout: 30000 });
const claimCode = call("claimParentLinkCode");
const createCode = call("createParentLinkCode");
const getDashboard = call("getParentDashboard");
const unlinkChild = call("unlinkParentChild");

const $ = selector => document.querySelector(selector);
const childrenContainer = $("#childrenContainer");
const claimButton = $("#claimLinkButton");
const createButton = $("#createLinkButton");
const refreshButton = $("#refreshButton");
const codeInput = $("#parentLinkCode");
const claimStatus = $("#claimStatus");
const createStatus = $("#createStatus");
let currentUser = null;
let generatedCodeValue = "";

function setStatus(element, message, type = "") {
  element.textContent = message;
  element.className = "status" + (type ? " " + type : "");
}

function setBusy(button, busy, label) {
  if (!button.dataset.label) button.dataset.label = button.textContent.trim();
  button.disabled = busy;
  button.textContent = busy ? label : button.dataset.label;
}

function friendlyError(error) {
  const code = error?.code || "";
  if (code.includes("unauthenticated")) return "سجّل الدخول أولًا لاستخدام مساحة العائلة.";
  if (code.includes("permission-denied")) return "لا توجد صلاحية لتنفيذ العملية.";
  if (code.includes("not-found")) return "رمز الربط غير موجود أو انتهت صلاحيته.";
  if (code.includes("already-exists")) return "تم استخدام الرمز أو ربط الحساب بالفعل.";
  if (code.includes("deadline-exceeded")) return "انتهت صلاحية الرمز. اطلب رمزًا جديدًا.";
  if (code.includes("unavailable") || code.includes("network")) return "تعذر الاتصال بالخدمة. تحقق من الإنترنت وحاول مرة أخرى.";
  return error?.message || "حدث خطأ غير متوقع. حاول مرة أخرى.";
}

function formatDate(value) {
  if (!value) return "لا يوجد نشاط مسجل بعد";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير متاح";
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function renderChild(child) {
  const card = element("article", "child-card");
  const head = element("div", "child-head");
  head.append(element("span", "child-avatar", "♙"));
  const identity = element("div");
  identity.append(element("div", "child-name", child.displayName));
  identity.append(element("div", "child-sub", "ملف تعلّم مرتبط وآمن"));
  head.append(identity);
  card.append(head);

  const stats = element("div", "stats");
  [
    [child.completedLessons, "درس مكتمل"],
    [child.lessonsThisWeek, "هذا الأسبوع"],
    [child.projectsCount, "مشروع محفوظ"]
  ].forEach(([value, label]) => {
    const box = element("div", "stat");
    box.append(element("strong", "", Number(value) || 0));
    box.append(element("span", "", label));
    stats.append(box);
  });
  card.append(stats);

  const languages = element("div", "language-list");
  const labels = {
    python: "Python",
    javascript: "JavaScript",
    cpp: "C++",
    java: "Java"
  };
  Object.entries(labels).forEach(([key, label]) => {
    const row = element("div", "language-row");
    row.append(element("span", "", label));
    row.append(element("strong", "", (child.languageCounts?.[key] || 0) + " درس"));
    languages.append(row);
  });
  card.append(languages);

  const last = element("p", "child-sub", "آخر نشاط: " + formatDate(child.lastActivity));
  last.style.margin = "14px 0 0";
  card.append(last);

  const actions = element("div", "child-actions");
  actions.append(element("span", "child-sub", "المستوى " + (child.level || 1) + " · " + (child.xp || 0) + " XP · " + (child.stars || 0) + " نجمة"));
  const unlink = element("button", "unlink-button", "إلغاء الربط");
  unlink.type = "button";
  unlink.addEventListener("click", async () => {
    if (!window.confirm("هل تريد إلغاء ربط هذا الحساب؟ لن يتم حذف حساب المتعلم أو تقدمه.")) return;
    unlink.disabled = true;
    try {
      await unlinkChild({ childUid: child.childUid });
      await loadDashboard();
    } catch (error) {
      window.alert(friendlyError(error));
      unlink.disabled = false;
    }
  });
  actions.append(unlink);
  card.append(actions);
  return card;
}

function renderChildren(children) {
  childrenContainer.replaceChildren();
  if (!children.length) {
    const empty = element("div", "empty-state");
    empty.style.gridColumn = "1 / -1";
    empty.append(element("i", "", "♧"));
    empty.append(element("strong", "", "لا توجد حسابات مرتبطة حتى الآن"));
    empty.append(element("p", "", "افتح حساب المتعلم في هذا الجهاز، وأنشئ رمز ربط، ثم أدخله هنا من حساب ولي الأمر."));
    childrenContainer.append(empty);
    return;
  }
  children.forEach(child => childrenContainer.append(renderChild(child)));
}

async function loadDashboard() {
  if (!currentUser) return;
  refreshButton.disabled = true;
  try {
    const response = await getDashboard({});
    const children = Array.isArray(response.data?.children) ? response.data.children : [];
    renderChildren(children);
  } catch (error) {
    childrenContainer.replaceChildren(element("div", "empty-state", friendlyError(error)));
  } finally {
    refreshButton.disabled = false;
  }
}

claimButton.addEventListener("click", async () => {
  const code = codeInput.value.trim().toLowerCase();
  if (!/^[a-f0-9]{16}$/.test(code)) {
    setStatus(claimStatus, "أدخل الرمز المكوّن من 16 حرفًا ورقمًا.", "error");
    return;
  }
  setBusy(claimButton, true, "جارٍ ربط الحساب...");
  setStatus(claimStatus, "يتم التحقق من الرمز بأمان...");
  try {
    const response = await claimCode({ code });
    setStatus(claimStatus, "تم ربط حساب " + response.data.childName + " بنجاح.", "success");
    codeInput.value = "";
    await loadDashboard();
  } catch (error) {
    setStatus(claimStatus, friendlyError(error), "error");
  } finally {
    setBusy(claimButton, false);
  }
});

createButton.addEventListener("click", async () => {
  setBusy(createButton, true, "جارٍ إنشاء الرمز...");
  setStatus(createStatus, "يتم إنشاء رمز استخدام واحد...");
  try {
    const response = await createCode({});
    generatedCodeValue = String(response.data.code || "").toUpperCase();
    $("#generatedCode").textContent = generatedCodeValue;
    $("#generatedExpiry").textContent = "ينتهي في " + formatDate(response.data.expiresAt);
    $("#generatedCodeBox").classList.add("visible");
    setStatus(createStatus, "شارك الرمز مع ولي أمرك فقط.", "success");
  } catch (error) {
    setStatus(createStatus, friendlyError(error), "error");
  } finally {
    setBusy(createButton, false);
  }
});

$("#copyCodeButton").addEventListener("click", async () => {
  if (!generatedCodeValue) return;
  try {
    await navigator.clipboard.writeText(generatedCodeValue);
    setStatus(createStatus, "تم نسخ الرمز.", "success");
  } catch {
    setStatus(createStatus, "تعذر النسخ تلقائيًا. انسخ الرمز الظاهر يدويًا.", "error");
  }
});

refreshButton.addEventListener("click", loadDashboard);
codeInput.addEventListener("input", () => {
  codeInput.value = codeInput.value.replace(/[^a-fA-F0-9]/g, "").slice(0, 16).toUpperCase();
});

onAuthStateChanged(auth, user => {
  currentUser = user;
  if (!user) {
    childrenContainer.replaceChildren();
    const empty = element("div", "empty-state");
    empty.style.gridColumn = "1 / -1";
    empty.append(element("strong", "", "سجّل الدخول للمتابعة"));
    const link = element("a", "soft-button", "تسجيل الدخول");
    link.href = "login.html";
    link.style.marginTop = "12px";
    empty.append(link);
    childrenContainer.append(empty);
    claimButton.disabled = true;
    createButton.disabled = true;
    setStatus(claimStatus, "يلزم تسجيل الدخول لاستخدام الربط.");
    setStatus(createStatus, "يلزم تسجيل الدخول لإنشاء رمز.");
    return;
  }
  claimButton.disabled = false;
  createButton.disabled = false;
  loadDashboard();
});
