// Pure logic for student profiles, live-session listings and the trainer's view-only code share (free Worker path, no I/O).
const AGES = ["10-12", "13-15", "16-17", "18+"];
const LEVELS = ["beginner", "basic", "intermediate"];
const INTERESTS = ["python", "javascript", "cpp", "java", "web"];
const TRACKS = ["python", "javascript", "cpp", "java", "web", "ai"];
export const SESSION_HOSTS = ["meet.google.com", "zoom.us", "meet.jit.si", "teams.microsoft.com", "teams.live.com", "whereby.com", "8x8.vc"];
export const SESSION_CAP = 300;
export const CODE_MAX = 6000;
export const MAX_DAYS_AHEAD = 90;
const str = v => String(v == null ? "" : v).trim();
export function hostAllowed(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || u.username || u.password) return false;
    const h = u.hostname.toLowerCase();
    return SESSION_HOSTS.some(a => h === a || h.endsWith("." + a));
  } catch { return false; }
}
export function validateStudent(d) {
  d = d && typeof d === "object" && !Array.isArray(d) ? d : {};
  const v = { ageBand: str(d.ageBand), grade: str(d.grade), skillLevel: str(d.skillLevel), interests: Array.isArray(d.interests) ? [...new Set(d.interests.map(String))] : [],
    learningGoals: str(d.learningGoals), learningNeeds: str(d.learningNeeds), preferredSchedule: str(d.preferredSchedule), guardianConsent: d.guardianConsent === true };
  if (!AGES.includes(v.ageBand) || v.grade.length > 60 || !LEVELS.includes(v.skillLevel) || v.interests.length < 1 || v.interests.length > 5 || v.interests.some(x => !INTERESTS.includes(x)) ||
    v.learningGoals.length > 500 || v.learningNeeds.length > 500 || v.preferredSchedule.length > 200) return { ok: false, reason: "invalid" };
  if (v.ageBand !== "18+" && !v.guardianConsent) return { ok: false, reason: "guardian_consent_required" };
  return { ok: true, value: v };
}
// An 18+ profile is active at once. Under 18 stays pending until the owner confirms the guardian; an existing confirmation survives edits only if the age band does not change.
export function saveStudent(idx, prev, uid, email, value, now) {
  const adult = value.ageBand === "18+";
  const verified = adult || (!!prev && prev.ageBand === value.ageBand && prev.guardianVerified === true);
  const rec = { ...value, uid, email: String(email || "").slice(0, 254), guardianVerified: verified, status: verified ? "active" : "pending_guardian", createdAt: prev ? prev.createdAt : now, updatedAt: now };
  if (!prev && Object.keys(idx).length >= 2000) return { ok: false, status: 503, reason: "directory_full" };
  idx[uid] = { s: rec.status, a: rec.ageBand, e: rec.email, t: now };
  return { ok: true, rec };
}
export function reviewGuardian(idx, rec, decision, now) {
  if (!rec) return { ok: false, status: 404, reason: "not_found" };
  if (!["verified", "rejected"].includes(decision)) return { ok: false, status: 400, reason: "bad_decision" };
  rec.guardianVerified = decision === "verified"; rec.status = rec.guardianVerified ? "active" : "pending_guardian"; rec.guardianReviewedAt = now; rec.updatedAt = now;
  idx[rec.uid] = { s: rec.status, a: rec.ageBand, e: rec.email, t: now, r: decision };
  return { ok: true, rec };
}
export function listPendingGuardians(idx, limit = 50) {
  return Object.entries(idx).filter(([, x]) => x.s === "pending_guardian" && x.r !== "rejected").sort((a, b) => b[1].t - a[1].t).slice(0, limit).map(([uid, x]) => ({ uid, ageBand: x.a, email: x.e, at: x.t }));
}
export function validateSession(d, now) {
  d = d && typeof d === "object" && !Array.isArray(d) ? d : {};
  const v = { title: str(d.title), description: str(d.description), track: str(d.track), startsAt: Number(d.startsAt), durationMin: Number(d.durationMin), linkUrl: str(d.linkUrl) };
  if (v.title.length < 3 || v.title.length > 80 || v.description.length > 500 || !TRACKS.includes(v.track) || !Number.isFinite(v.startsAt) ||
    v.startsAt < now - 15 * 60000 || v.startsAt > now + MAX_DAYS_AHEAD * 86400000 || !Number.isInteger(v.durationMin) || v.durationMin < 15 || v.durationMin > 240) return { ok: false, reason: "invalid" };
  if (!hostAllowed(v.linkUrl) || v.linkUrl.length > 500) return { ok: false, reason: "link_not_allowed" };
  return { ok: true, value: v };
}
export function createSession(sessions, id, uid, name, value, now) {
  const live = Object.values(sessions).filter(s => !s.canceled && s.startsAt + s.durationMin * 60000 > now);
  if (live.filter(s => s.owner === uid).length >= 10) return { ok: false, status: 429, reason: "too_many_sessions" };
  if (Object.keys(sessions).length >= SESSION_CAP) { // drop the oldest finished ones first
    const old = Object.values(sessions).filter(s => s.startsAt + s.durationMin * 60000 < now - 86400000).sort((a, b) => a.startsAt - b.startsAt);
    for (const s of old.slice(0, 50)) delete sessions[s.id];
    if (Object.keys(sessions).length >= SESSION_CAP) return { ok: false, status: 503, reason: "sessions_full" };
  }
  sessions[id] = { ...value, id, owner: uid, ownerName: String(name || "").slice(0, 80), canceled: false, createdAt: now };
  return { ok: true, session: sessions[id] };
}
export function listSessions(sessions, uid, now, visible) {
  return Object.values(sessions).filter(s => !s.canceled && s.startsAt + s.durationMin * 60000 > now - 30 * 60000 && (!visible || visible(s)))
    .sort((a, b) => a.startsAt - b.startsAt).slice(0, 60).map(s => ({ id: s.id, title: s.title, description: s.description, track: s.track, startsAt: s.startsAt, durationMin: s.durationMin, linkUrl: s.linkUrl, groupId: s.groupId || "", ownerName: s.ownerName, mine: s.owner === uid, ...(s.owner === uid ? { attended: Object.keys(s.att || {}).length } : {}) }));
}
export function cancelSession(sessions, id, uid, isAdmin) {
  const s = sessions[id]; if (!s) return { ok: false, status: 404, reason: "not_found" };
  if (s.owner !== uid && !isAdmin) return { ok: false, status: 403, reason: "forbidden" };
  s.canceled = true; return { ok: true };
}
export function putCode(sessions, codes, id, uid, code, lang, now) {
  const s = sessions[id]; if (!s || s.canceled) return { ok: false, status: 404, reason: "not_found" };
  if (s.owner !== uid) return { ok: false, status: 403, reason: "forbidden" };
  const text = String(code == null ? "" : code);
  if (text.length > CODE_MAX) return { ok: false, status: 400, reason: "too_long" };
  const prev = codes[id];
  if (prev && now - prev.at < 1000) return { ok: false, status: 429, reason: "slow_down" };
  codes[id] = { code: text, lang: ["python", "javascript", "cpp", "java"].includes(lang) ? lang : "python", v: (prev ? prev.v : 0) + 1, at: now };
  return { ok: true, v: codes[id].v };
}
export function getCode(sessions, codes, id, since) {
  const s = sessions[id]; if (!s || s.canceled) return { ok: false, status: 404, reason: "not_found" };
  const c = codes[id]; if (!c) return { ok: true, v: 0, changed: false };
  if (Number(since) === c.v) return { ok: true, v: c.v, changed: false };
  return { ok: true, v: c.v, changed: true, code: c.code, lang: c.lang, at: c.at };
}
