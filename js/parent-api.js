// Parent-link calls on the free Worker path. Responses are private: never cached, never reused across accounts.
const WORKER = "https://codequest.mariam2009m44.workers.dev";
export async function parentApi(user, path, body) {
  try {
    const token = await user.getIdToken();
    const res = await fetch(WORKER + "/api/parent/" + path, { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify(body || {}) });
    const data = await res.json().catch(() => ({}));
    const off = (res.status === 503 && (data.message === "parent_off" || data.message === "parent_unavailable")) || (res.status === 404 && typeof data.message === "string" && data.message.includes("المسار"));
    return { ok: res.ok, status: res.status, data, off, unreachable: false };
  } catch { return { ok: false, status: 0, data: {}, off: false, unreachable: true }; }
}
export const parentErrorText = r => r.off ? "خدمة ربط الحسابات غير مفعّلة حاليًا." : r.unreachable ? "تعذر الاتصال بالخدمة. تحقق من الإنترنت وحاول مرة أخرى." : r.status === 401 ? "سجّل الدخول أولًا." : r.status === 429 ? "محاولات كثيرة. حاول لاحقًا." : r.status === 404 ? "الرمز غير صحيح أو انتهت صلاحيته أو استُخدم." : r.status === 403 ? "لا توجد صلاحية لهذه العملية." : "تعذر تنفيذ العملية الآن. حاول مرة أخرى.";
