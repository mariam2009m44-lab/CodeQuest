import { auth } from "./firebase-config.js";
import { parentApi, parentErrorText } from "./parent-api.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { requireUser } from "./auth.js";

const createButton = document.getElementById("createParentCodeButton");
const copyButton = document.getElementById("copyParentCodeButton");
const codeBox = document.getElementById("parentCodeBox");
const codeValue = document.getElementById("parentCodeValue");
const expiryNode = document.getElementById("parentCodeExpiry");
const statusNode = document.getElementById("parentCodeStatus");
const linkedParentsSection = document.getElementById("linkedParentsSection");
const linkedParentsList = document.getElementById("linkedParentsList");

if (createButton && copyButton && codeBox && codeValue && expiryNode && statusNode) {
  let currentCode = "";

  function setStatus(message, type = "") {
    statusNode.textContent = message;
    statusNode.style.color = type === "error"
      ? "var(--danger, #ff8c9c)"
      : type === "success"
        ? "var(--success, #43c99a)"
        : "var(--text-muted)";
  }

  createButton.addEventListener("click", async () => {
    const consent = document.getElementById("parentConsentCheck");
    if (consent && !consent.checked) {
      setStatus("وافق على ما سيراه ولي الأمر أولًا، ثم أنشئ الرمز.", "error");
      return;
    }
    createButton.disabled = true;
    createButton.textContent = "جارٍ إنشاء الرمز...";
    setStatus("يتم إنشاء رمز مؤقت وآمن...");
    codeBox.hidden = true;
    currentCode = "";

    try {
      const user = await requireUser();
      const r = await parentApi(user, "create", { consent: true });
      if (!r.ok || r.data.success !== true || !/^[A-Z2-9]{12}$/.test(String(r.data.code || ""))) throw new Error(parentErrorText(r));
      currentCode = String(r.data.code);
      codeValue.textContent = currentCode;
      const expiry = new Date(r.data.expiresAt);
      expiryNode.textContent = Number.isNaN(expiry.getTime())
        ? "الرمز صالح لمدة 30 دقيقة من وقت إنشائه."
        : "ينتهي في " + new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(expiry);
      codeBox.hidden = false;
      setStatus("شارك الرمز مع ولي أمرك فقط.", "success");
    } catch (error) {
      setStatus(error?.message || "تعذر إنشاء رمز الربط.", "error");
    } finally {
      createButton.disabled = false;
      createButton.textContent = "إنشاء رمز الربط";
    }
  });

  copyButton.addEventListener("click", async () => {
    if (!currentCode) return;
    try {
      await navigator.clipboard.writeText(currentCode);
      setStatus("تم نسخ الرمز. شاركه مع ولي أمرك فقط.", "success");
    } catch {
      setStatus("تعذر النسخ تلقائيًا؛ انسخ الرمز الظاهر يدويًا.", "error");
    }
  });

  function clearPrivate() {
    currentCode = ""; codeValue.textContent = ""; codeBox.hidden = true;
    if (linkedParentsSection) linkedParentsSection.hidden = true;
    if (linkedParentsList) linkedParentsList.replaceChildren();
  }
  async function loadLinkedParents(user) {
    if (!linkedParentsSection || !linkedParentsList) return;
    const r = await parentApi(user, "parents", {});
    if (auth.currentUser?.uid !== user.uid) return;
    if (!r.ok) { if (r.off) { clearPrivate(); return; } linkedParentsSection.hidden = false; linkedParentsList.textContent = "تعذر تحميل الحسابات المرتبطة حاليًا."; return; }
    const parents = Array.isArray(r.data.parents) ? r.data.parents : [];
    linkedParentsList.replaceChildren();
    linkedParentsSection.hidden = parents.length === 0;
    parents.forEach((parent, i) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--border-soft);border-radius:12px";
      const name = document.createElement("strong");
      name.textContent = "حساب ولي أمر مرتبط " + (i + 1);
      const unlink = document.createElement("button");
      unlink.type = "button"; unlink.className = "btn-secondary"; unlink.textContent = "إلغاء الربط";
      unlink.addEventListener("click", async () => {
        if (!window.confirm("هل تريد إلغاء ربط حساب ولي الأمر؟ لن يتم حذف أي حساب أو تقدم تعليمي.")) return;
        unlink.disabled = true;
        const u = await parentApi(user, "unlink", { parent: parent.parentUid });
        if (u.ok) { setStatus("تم إلغاء الربط بنجاح.", "success"); await loadLinkedParents(user); }
        else { setStatus(parentErrorText(u), "error"); unlink.disabled = false; }
      });
      row.append(name, unlink);
      linkedParentsList.append(row);
    });
  }

  onAuthStateChanged(auth, user => {
    clearPrivate();
    if (user) loadLinkedParents(user);
  });
}
