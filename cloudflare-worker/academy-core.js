// Pure academy logic for the free Worker path (no I/O). Mirrors the validation of the Firebase callable submitInstructorApplication.
const SPECIALTIES = ["python", "javascript", "cpp", "java", "web", "ai"];
const STYLES = ["projects", "interactive", "problem-solving", "visual", "discussion"];
const AGES = ["10-12", "13-15", "16-17", "18+"];
const LEVELS = ["beginner", "basic", "intermediate", "advanced"];
export const APPLICATION_CAP = 2000;
export const DAILY_SUBMITS = 5;
// PROVISIONAL thresholds (not user-approved policy): total new-or-updated applications accepted per UTC day, and admin page size.
export const GLOBAL_DAILY_INTAKE = 100;
export const PAGE_MAX = 100;
const str = v => String(v == null ? "" : v).trim();
const uniq = v => Array.isArray(v) ? [...new Set(v.map(String))] : [];
const httpsOk = v => !v || (v.length <= 500 && /^https:\/\//i.test(v));
export function validateApplication(d) {
  d = d && typeof d === "object" && !Array.isArray(d) ? d : {};
  const v = {
    fullName: str(d.fullName), specialties: uniq(d.specialties), experience: str(d.experience), bio: str(d.bio),
    portfolioUrl: str(d.portfolioUrl), availability: str(d.availability), linkedinUrl: str(d.linkedinUrl),
    introVideoUrl: str(d.introVideoUrl), teachingDemoUrl: str(d.teachingDemoUrl), qualifications: str(d.qualifications),
    teachingExperience: str(d.teachingExperience), teachingStyles: uniq(d.teachingStyles), ageGroups: uniq(d.ageGroups),
    teachingLevels: uniq(d.teachingLevels),
    sampleWorkLinks: Array.isArray(d.sampleWorkLinks) ? [...new Set(d.sampleWorkLinks.map(x => str(x)).filter(Boolean))] : []
  };
  const bad = v.fullName.length < 3 || v.fullName.length > 80 || v.specialties.length < 1 || v.specialties.length > 6 ||
    v.specialties.some(x => !SPECIALTIES.includes(x)) || v.experience.length > 120 || v.bio.length < 30 || v.bio.length > 1200 ||
    v.availability.length > 300 || v.qualifications.length > 500 || v.teachingExperience.length > 800 ||
    v.teachingStyles.length > 5 || v.teachingStyles.some(x => !STYLES.includes(x)) ||
    v.ageGroups.length > 4 || v.ageGroups.some(x => !AGES.includes(x)) ||
    v.teachingLevels.length > 4 || v.teachingLevels.some(x => !LEVELS.includes(x)) ||
    v.sampleWorkLinks.length > 5 || v.sampleWorkLinks.some(x => !httpsOk(x)) ||
    !httpsOk(v.portfolioUrl) || !httpsOk(v.linkedinUrl) || !httpsOk(v.introVideoUrl) || !httpsOk(v.teachingDemoUrl);
  return bad ? { ok: false } : { ok: true, value: v };
}
export function emptyDirectory() { return { apps: {}, audit: [], submits: {}, intake: { day: "", n: 0 } }; }
export function submitApplication(dir, uid, email, emailVerified, value, now) {
  const day = new Date(now).toISOString().slice(0, 10);
  const q = dir.submits[uid] && dir.submits[uid].day === day ? dir.submits[uid] : { day, n: 0 };
  if (q.n >= DAILY_SUBMITS) return { ok: false, status: 429, reason: "rate_limited" };
  const intake = dir.intake && dir.intake.day === day ? dir.intake : { day, n: 0 };
  if (intake.n >= GLOBAL_DAILY_INTAKE) return { ok: false, status: 503, reason: "intake_full_today" };
  const prev = dir.apps[uid];
  if (prev && prev.status === "approved") return { ok: false, status: 409, reason: "already_approved" };
  if (!prev && Object.keys(dir.apps).length >= APPLICATION_CAP) return { ok: false, status: 503, reason: "directory_full" };
  q.n += 1; dir.submits[uid] = q; intake.n += 1; dir.intake = intake;
  dir.apps[uid] = { ...value, uid, email: String(email || "").slice(0, 254), emailVerified: emailVerified === true, status: "pending", submittedAt: prev ? prev.submittedAt : now, updatedAt: now };
  dir.audit.push({ actor: uid, action: "application_submitted", target: uid, at: now });
  if (dir.audit.length > 500) dir.audit.splice(0, dir.audit.length - 500);
  return { ok: true, status: "pending" };
}
// The owner sees their own application (to pre-fill the form). Nobody else's is ever returned here.
export function myStatus(dir, uid) { const a = dir.apps[uid]; return a ? { exists: true, status: a.status, submittedAt: a.submittedAt, updatedAt: a.updatedAt, application: { ...a, uid: undefined } } : { exists: false }; }
export function listApplications(dir, status, cursor, limit) {
  const lim = Math.min(Math.max(Number.isInteger(limit) ? limit : 25, 1), PAGE_MAX);
  let rows = Object.values(dir.apps).filter(a => !status || a.status === status).sort((a, b) => b.updatedAt - a.updatedAt || (a.uid < b.uid ? -1 : 1));
  const key = a => a.updatedAt + ":" + a.uid;
  if (typeof cursor === "string" && cursor) { const i = rows.findIndex(a => key(a) === cursor); rows = i < 0 ? [] : rows.slice(i + 1); }
  const page = rows.slice(0, lim).map(a => ({ ...a, cursorId: key(a) }));
  return { items: page, hasMore: rows.length > lim };
}
// Records the decision only. It never grants a role or contacts the applicant.
export function reviewApplication(dir, adminUid, targetUid, decision, now) {
  if (!["approved", "rejected"].includes(decision)) return { ok: false, status: 400, reason: "bad_decision" };
  if (adminUid === targetUid) return { ok: false, status: 403, reason: "no_self_review" };
  const a = dir.apps[targetUid]; if (!a) return { ok: false, status: 404, reason: "not_found" };
  if (a.status !== "pending") return { ok: false, status: 409, reason: "not_pending" };
  if (decision === "approved" && a.emailVerified !== true) return { ok: false, status: 409, reason: "email_not_verified" };
  a.status = decision; a.reviewedAt = now; a.updatedAt = now;
  dir.audit.push({ actor: adminUid, action: "application_" + decision, target: targetUid, at: now });
  return { ok: true, status: decision };
}
