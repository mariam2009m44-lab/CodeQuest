// Extra Academy Directory actions: student profiles, sessions, code share, groups. Runs inside the Durable Object transaction (free plan).
import * as S from "./academy-sessions-core.js";
import * as G from "./academy-groups-core.js";
export const EXTRA = new Set(["student", "summary", "guardians", "greview", "agroups", "scr", "sls", "scn", "cput", "cget", "gcr", "gls", "gjoin", "grev", "grem", "gmute", "garch", "gpost", "gread", "gdel", "grep", "myrole", "satt", "sattl"]);
const fail = (r) => ({ status: r.status || 400, data: { success: false, message: r.reason } });
const ok = (data = {}) => ({ status: 200, data: { success: true, ...data } });
export async function handleExtra(tx, action, b, now, newId) {
  const uid = String(b.uid || ""), admin = b.admin === true;
  const dir = (await tx.get("dir")) || { apps: {} };
  const app = dir.apps[uid];
  const trainer = !!app && app.status === "approved";
  const stuIdx = (await tx.get("stuidx")) || {};
  const stu = await tx.get("stu:" + uid);
  const activeStudent = !!stu && stu.status === "active";
  const privileged = trainer || admin;
  const canBrowse = privileged || activeStudent;
  const role = admin ? "admin" : trainer ? "trainer" : activeStudent ? "student" : stu ? "student_pending" : app ? "applicant_" + app.status : "none";
  const trainerName = admin && !trainer ? "الإدارة" : (app && app.fullName) || "";
  if (action === "myrole") { const sp = stu ? { ageBand: stu.ageBand, grade: stu.grade, skillLevel: stu.skillLevel, interests: stu.interests, learningGoals: stu.learningGoals, learningNeeds: stu.learningNeeds, preferredSchedule: stu.preferredSchedule, status: stu.status } : null;
    return ok({ role, application: app ? app.status : null, student: stu ? stu.status : null, studentProfile: sp }); }
  if (action === "student") {
    const v = S.validateStudent(b.value); if (!v.ok) return fail({ status: 400, reason: v.reason });
    const r = S.saveStudent(stuIdx, stu, uid, b.email, v.value, now); if (!r.ok) return fail(r);
    await tx.put("stu:" + uid, r.rec); await tx.put("stuidx", stuIdx);
    return ok({ status: r.rec.status });
  }
  if (admin && action === "summary") {
    const apps = Object.values(dir.apps); const ses = (await tx.get("ses")) || {}; const grp = (await tx.get("grp")) || {}; const rep = (await tx.get("rep")) || [];
    return ok({ trainersPending: apps.filter(a => a.status === "pending").length, trainersApproved: apps.filter(a => a.status === "approved").length, students: Object.keys(stuIdx).length,
      guardiansPending: S.listPendingGuardians(stuIdx, 1000).length, sessionsUpcoming: S.listSessions(ses, "", now).length, groups: Object.values(grp).filter(g => !g.archived).length, reports: rep.length });
  }
  if (admin && action === "guardians") return ok({ items: S.listPendingGuardians(stuIdx, 50) });
  if (admin && action === "greview") {
    const target = String(b.target || ""); const rec = await tx.get("stu:" + target);
    const r = S.reviewGuardian(stuIdx, rec, String(b.decision || ""), now); if (!r.ok) return fail(r);
    await tx.put("stu:" + target, r.rec); await tx.put("stuidx", stuIdx); return ok({ status: r.rec.status });
  }
  if (admin && action === "agroups") {
    const grp = (await tx.get("grp")) || {}; const rep = (await tx.get("rep")) || [];
    return ok({ groups: G.listGroups(grp, uid, true), reports: rep.slice(-50).reverse() });
  }
  if (["agroups", "summary", "guardians", "greview"].includes(action)) return fail({ status: 403, reason: "forbidden" });
  // Sessions
  const ses = (await tx.get("ses")) || {}; const codes = (await tx.get("code")) || {};
  const grp = (await tx.get("grp")) || {};
  const inGroup = s => !s.groupId || admin || (grp[s.groupId] && G.roleOf(grp[s.groupId], uid) !== "none" && G.roleOf(grp[s.groupId], uid) !== "pending");
  if (action === "scr") {
    if (!privileged) return fail({ status: 403, reason: "trainer_only" });
    const v = S.validateSession(b.value, now); if (!v.ok) return fail({ status: 400, reason: v.reason });
    const gid = String((b.value && b.value.groupId) || "");
    if (gid && (!grp[gid] || (grp[gid].owner !== uid && !admin))) return fail({ status: 403, reason: "not_your_group" });
    const r = S.createSession(ses, newId(), uid, trainerName, { ...v.value, ...(gid ? { groupId: gid } : {}) }, now); if (!r.ok) return fail(r);
    await tx.put("ses", ses); return ok({ id: r.session.id });
  }
  if (action === "sls") { if (!canBrowse) return fail({ status: 403, reason: "profile_required" }); return ok({ sessions: S.listSessions(ses, uid, now, inGroup), role }); }
  if (action === "satt") { // join tap: records that this account opened the session link (idempotent, no names stored)
    const s = ses[String(b.id || "")]; if (!s || s.canceled) return fail({ status: 404, reason: "not_found" });
    if (!canBrowse || !inGroup(s)) return fail({ status: 403, reason: "profile_required" });
    s.att = s.att || {}; if (!s.att[uid] && Object.keys(s.att).length < 300) s.att[uid] = now;
    await tx.put("ses", ses); return ok();
  }
  if (action === "sattl") { // owner or admin: who tapped join. Group sessions show group nicknames only; others show a count.
    const s = ses[String(b.id || "")]; if (!s) return fail({ status: 404, reason: "not_found" });
    if (s.owner !== uid && !admin) return fail({ status: 403, reason: "forbidden" });
    const att = s.att || {}, g = s.groupId && grp[s.groupId];
    const names = g ? Object.keys(att).map(u => (g.members[u] && g.members[u].nick) || "").filter(Boolean) : [];
    return ok({ count: Object.keys(att).length, names: names.slice(0, 100) });
  }
  if (action === "scn") { const r = S.cancelSession(ses, String(b.id || ""), uid, admin); if (!r.ok) return fail(r); await tx.put("ses", ses); return ok(); }
  if (action === "cput") {
    const r = S.putCode(ses, codes, String(b.id || ""), uid, b.code, b.lang, now); if (!r.ok) return fail(r);
    for (const k of Object.keys(codes)) if (!ses[k] || ses[k].canceled) delete codes[k];
    await tx.put("code", codes); return ok({ v: r.v });
  }
  if (action === "cget") {
    const s = ses[String(b.id || "")]; if (!canBrowse || (s && !inGroup(s))) return fail({ status: 403, reason: "profile_required" });
    const r = S.getCode(ses, codes, String(b.id || ""), b.since); if (!r.ok) return fail(r); return ok(r);
  }
  // Groups
  const gid = String(b.gid || ""); const group = grp[gid];
  if (action === "gcr") {
    if (!privileged) return fail({ status: 403, reason: "trainer_only" });
    const v = G.validateGroup(b.value); if (!v.ok) return fail({ status: 400, reason: v.reason });
    const r = G.createGroup(grp, newId(), uid, trainerName, v.value, now); if (!r.ok) return fail(r);
    await tx.put("grp", grp); return ok({ id: r.group.id });
  }
  if (action === "gls") { if (!canBrowse) return fail({ status: 403, reason: "profile_required" }); return ok({ groups: G.listGroups(grp, uid, false), role }); }
  if (action === "gjoin") {
    if (!activeStudent) return fail({ status: 403, reason: stu ? "guardian_pending" : "profile_required" });
    const r = G.requestJoin(group, uid, b.nick, now); if (!r.ok) return fail(r); await tx.put("grp", grp); return ok();
  }
  let r;
  if (action === "grev") r = G.reviewJoin(group, uid, admin, String(b.target || ""), String(b.decision || ""), now);
  else if (action === "grem") r = G.removeMember(group, uid, admin, String(b.target || uid));
  else if (action === "gmute") r = G.setMute(group, uid, admin, String(b.target || ""), b.on === true);
  else if (action === "garch") r = G.archiveGroup(group, uid, admin);
  if (r) { if (!r.ok) return fail(r); await tx.put("grp", grp); return ok(); }
  const msgs = (await tx.get("msg:" + gid)) || [];
  if (action === "gpost") { r = G.postMessage(group, msgs, uid, admin, b.text, b.kind, newId(), now); if (!r.ok) return fail(r); await tx.put("msg:" + gid, msgs); return ok(); }
  if (action === "gread") { r = G.readMessages(group, msgs, uid, admin, b.since); if (!r.ok) return fail(r); return ok(r); }
  if (action === "gdel") { r = G.deleteMessage(group, msgs, uid, admin, String(b.mid || "")); if (!r.ok) return fail(r); await tx.put("msg:" + gid, msgs); return ok(); }
  if (action === "grep") { const rep = (await tx.get("rep")) || []; r = G.reportMessage(group, msgs, rep, uid, String(b.mid || ""), now); if (!r.ok) return fail(r); await tx.put("rep", rep); return ok(); }
  return { status: 404, data: { success: false } };
}
