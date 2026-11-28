// Clean Arabic text for academy calls. Raw codes such as "internal" or
// "not-found" never reach the page; service-down cases say so plainly.
const DOWN = /^(functions\/)?(internal|unavailable|not-found|deadline-exceeded|unknown|cancelled|resource-exhausted)$/;
export const ACADEMY_DOWN_TEXT = "الأكاديمية المباشرة لم تُفتح بعد. يمكنك متابعة التعلم والتمارين كالمعتاد، وستظهر الفصول هنا عندما تُفعَّل.";
export function academyErrorIsDown(error) {
  const code = String(error?.code || "").trim();
  const msg = String(error?.message || "").trim();
  if (DOWN.test(code) || DOWN.test(msg)) return true;
  if (/failed to fetch|network|cors|load failed/i.test(msg)) return true;
  return false;
}
export function acadMsg(error) {
  if (academyErrorIsDown(error)) return ACADEMY_DOWN_TEXT;
  const msg = String(error?.message || "").trim();
  return /[\u0600-\u06FF]/.test(msg) ? msg : "";
}
// Older pages (community directory, live classes) still call a service that is not deployed. Say so plainly and point to the working hub.
export const LEGACY_DOWN_TEXT = "هذه الصفحة تعتمد على خدمة لم تُفتح بعد. المجموعات والجلسات المباشرة والواجبات تعمل الآن من «مساحة الأكاديمية».";
export function legacyMsg(error) { return academyErrorIsDown(error) ? LEGACY_DOWN_TEXT : acadMsg(error); }
