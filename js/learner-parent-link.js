import { auth, functions } from "./firebase-config.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";
import { requireUser } from "./auth.js";

const createButton = document.getElementById("createParentCodeButton");
const copyButton = document.getElementById("copyParentCodeButton");
const codeBox = document.getElementById("parentCodeBox");
const codeValue = document.getElementById("parentCodeValue");
const expiryNode = document.getElementById("parentCodeExpiry");
const statusNode = document.getElementById("parentCodeStatus");

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
}
