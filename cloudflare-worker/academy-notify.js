// Admin notice by email (free path). OFF unless ACADEMY_EMAIL_NOTICE is "on" AND the dashboard secrets RESEND_API_KEY and ADMIN_NOTICE_EMAIL exist.
// Notice only: the kind of event and a link to the admin page. No applicant name, email, phone or answers are ever put in the mail.
// Sends only to ADMIN_NOTICE_EMAIL (the owner's own address, a dashboard secret, never in the repo). Daily cap in KV. Failure never affects the user's request.
export const NOTICE_DAILY_CAP = 50;
const KINDS = {
  trainer: { subject: "CodeQuest: طلب مدرب جديد", line: "وصل طلب مدرب جديد." },
  student: { subject: "CodeQuest: تسجيل طالب جديد", line: "سجّل طالب جديد في الأكاديمية." }
};
export async function readLastNotice(env) {
  let last = null;
  try { const v = env.QUIZ_ANSWERS && await env.QUIZ_ANSWERS.get("notice:last"); last = v ? JSON.parse(v) : null; } catch { last = null; }
  // Live presence check, names only (never values): is the flag on and does this Worker see both secrets right now.
  return { ...(last || {}), live: { flag: env.ACADEMY_EMAIL_NOTICE === "on", key: !!env.RESEND_API_KEY, email: !!env.ADMIN_NOTICE_EMAIL } };
}
async function remember(env, kind, reason, status) {
  try { if (env.QUIZ_ANSWERS) await env.QUIZ_ANSWERS.put("notice:last", JSON.stringify({ at: new Date().toISOString(), kind, reason, status: status || 0 }), { expirationTtl: 60 * 60 * 24 * 14 }); } catch {}
}
export async function sendAdminNotice(env, kind, uid, fetchImpl = fetch) {
  try {
    if (env.ACADEMY_EMAIL_NOTICE !== "on" || !KINDS[kind] || !env.QUIZ_ANSWERS) return { sent: false, reason: "off" };
    if (!env.RESEND_API_KEY || !env.ADMIN_NOTICE_EMAIL) { await remember(env, kind, "missing_" + (env.RESEND_API_KEY ? "" : "key") + (env.ADMIN_NOTICE_EMAIL ? "" : "email")); return { sent: false, reason: "missing_secret" }; }
    const day = new Date().toISOString().slice(0, 10);
    const capKey = "notice:cap:" + day;
    const used = Number(await env.QUIZ_ANSWERS.get(capKey)) || 0;
    if (used >= NOTICE_DAILY_CAP) return { sent: false, reason: "cap" };
    if (kind === "student") { // one notice per student, edits never mail again
      const seen = "notice:stu:" + String(uid || "").slice(0, 64);
      if (await env.QUIZ_ANSWERS.get(seen)) return { sent: false, reason: "seen" };
      await env.QUIZ_ANSWERS.put(seen, "1", { expirationTtl: 60 * 60 * 24 * 365 });
    }
    await env.QUIZ_ANSWERS.put(capKey, String(used + 1), { expirationTtl: 60 * 60 * 36 });
    const k = KINDS[kind];
    const link = "https://codequest-mu-six.vercel.app/academy-admin.html";
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.RESEND_API_KEY },
      body: JSON.stringify({ from: "CodeQuest <onboarding@resend.dev>", to: [env.ADMIN_NOTICE_EMAIL], subject: k.subject, text: k.line + "\nلوحة الإدارة للمراجعة:\n" + link })
    });
    if (!res.ok && kind === "student") { try { await env.QUIZ_ANSWERS.delete("notice:stu:" + String(uid || "").slice(0, 64)); } catch {} } // a refused send must not block the retry
    await remember(env, kind, res.ok ? "sent" : "http_" + res.status, res.status);
    return { sent: res.ok, reason: res.ok ? "sent" : "http_" + res.status };
  } catch { await remember(env, kind, "error"); return { sent: false, reason: "error" }; }
}
