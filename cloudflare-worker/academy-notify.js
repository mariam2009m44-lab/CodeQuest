// Admin notice by email (free path). OFF unless ACADEMY_EMAIL_NOTICE is "on" AND the dashboard secrets RESEND_API_KEY and ADMIN_NOTICE_EMAIL exist.
// Notice only: the kind of event and a link to the admin page. No applicant name, email, phone or answers are ever put in the mail.
// Sends only to ADMIN_NOTICE_EMAIL (the owner's own address, a dashboard secret, never in the repo). Daily cap in KV. Failure never affects the user's request.
export const NOTICE_DAILY_CAP = 50;
const KINDS = {
  trainer: { subject: "CodeQuest: طلب مدرب جديد", line: "وصل طلب مدرب جديد." },
  student: { subject: "CodeQuest: تسجيل طالب جديد", line: "سجّل طالب جديد في الأكاديمية." }
};
export async function sendAdminNotice(env, kind, uid, fetchImpl = fetch) {
  try {
    if (env.ACADEMY_EMAIL_NOTICE !== "on" || !env.RESEND_API_KEY || !env.ADMIN_NOTICE_EMAIL || !KINDS[kind] || !env.QUIZ_ANSWERS) return { sent: false, reason: "off" };
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
      body: JSON.stringify({ from: "CodeQuest <onboarding@resend.dev>", to: [env.ADMIN_NOTICE_EMAIL], subject: k.subject, text: k.line + "\nافتحي لوحة الإدارة للمراجعة:\n" + link })
    });
    return { sent: res.ok, reason: res.ok ? "sent" : "http_" + res.status };
  } catch { return { sent: false, reason: "error" }; }
}
