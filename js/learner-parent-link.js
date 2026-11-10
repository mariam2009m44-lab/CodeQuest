import { auth, functions } from "./firebase-config.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";
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
const getMyParentLinks = httpsCallable(functions, "getMyParentLinks", { timeout: 30000 });
const removeParentLink = httpsCallable(functions, "removeParentLinkAsChild", { timeout: 30000 });

if (createButton && copyButton && codeBox && codeValue && expiryNode && statusNode) {
  const createCode = httpsCallable(functions, "createParentLinkCode", { timeout: 30000 });
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
    createButton.disabled = true;
    createButton.textContent = "جارٍ إنشاء الرمز...";
    setStatus("يتم إنشاء رمز مؤقت وآمن...");
    codeBox.hidden = true;
    currentCode = "";

    try {
      await requireUser();
      const response = await createCode({});
      const data = response?.data || {};
      if (data.success !== true || !/^[a-f0-9]{16}$/i.test(String(data.code || ""))) {
        throw new Error("لم يصل رمز ربط صالح من الخادم.");
      }

      currentCode = String(data.code).toUpperCase();
      codeValue.textContent = currentCode;
      const expiry = new Date(data.expiresAt);
      expiryNode.textContent = Number.isNaN(expiry.getTime())
        ? "الرمز صالح لمدة 30 دقيقة من وقت إنشائه."
        : "ينتهي في " + new Intl.DateTimeFormat("ar-EG", {
            dateStyle: "medium",
            timeStyle: "short"
          }).format(expiry);
      codeBox.hidden = false;
      setStatus("شارك الرمز مع ولي أمرك فقط.", "success");
    } catch (error) {
      console.error("Parent link code creation failed:", error);
      const code = String(error?.code || "");
      const message = code.includes("unauthenticated")
        ? "سجّل الدخول أولًا لإنشاء رمز الربط."
        : code.includes("unavailable") || code.includes("not-found")
          ? "خدمة ربط الحسابات غير مفعّلة حاليًا. حاول لاحقًا."
          : error?.message || "تعذر إنشاء رمز الربط.";
      setStatus(message, "error");
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

  async function loadLinkedParents() {
    if (!linkedParentsSection || !linkedParentsList) return;
    try {
      const response = await getMyParentLinks({});
      const parents = Array.isArray(response.data?.parents) ? response.data.parents : [];
      linkedParentsList.replaceChildren();
      linkedParentsSection.hidden = parents.length === 0;
      parents.forEach(parent => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--border-soft);border-radius:12px";
        const name = document.createElement("strong");
        name.textContent = parent.displayName || "ولي الأمر";
        const unlink = document.createElement("button");
        unlink.type = "button";
        unlink.className = "btn-secondary";
        unlink.textContent = "إلغاء الربط";
        unlink.addEventListener("click", async () => {
          if (!window.confirm("هل تريد إلغاء ربط حساب ولي الأمر؟ لن يتم حذف أي حساب أو تقدم تعليمي.")) return;
          unlink.disabled = true;
          try {
            await removeParentLink({ parentUid: parent.parentUid });
            await loadLinkedParents();
            setStatus("تم إلغاء الربط بنجاح.", "success");
          } catch (error) {
            console.error("Parent unlink failed:", error);
            setStatus("تعذر إلغاء الربط الآن. حاول مرة أخرى.", "error");
            unlink.disabled = false;
          }
        });
        row.append(name, unlink);
        linkedParentsList.append(row);
      });
    } catch (error) {
      console.warn("Could not load linked parent accounts:", error);
      linkedParentsSection.hidden = false;
      linkedParentsList.textContent = "تعذر تحميل الحسابات المرتبطة حاليًا.";
    }
  }

  onAuthStateChanged(auth, user => {
    if (user) loadLinkedParents();
    else {
      linkedParentsSection.hidden = true;
      linkedParentsList.replaceChildren();
    }
  });
}
