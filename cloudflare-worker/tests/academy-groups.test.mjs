// Student profiles, sessions, code share and trainer groups. Mock Firebase tokens (not real Firebase claims).
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers-boot.mjs";
const app = { fullName: "سارة أحمد", specialties: ["python"], bio: "مدرسة برمجة للأطفال لديها خبرة سنتين في التدريس.", availability: "مساءً" };
const adult = { ageBand: "18+", skillLevel: "beginner", interests: ["python"] };
const kid = { ageBand: "13-15", skillLevel: "beginner", interests: ["python"], guardianConsent: true };
const P = "/api/academy/";
async function world() {
  const w = boot({}); w.env.ACADEMY_APPLICATIONS = "on"; w.env.ACADEMY_ADMIN_UIDS = "uidE";
  const c = (p, token, body = {}) => w.call(P + p, { token, body });
  await c("instructor-application", "tokV", app); await c("admin/review", "tokE", { uid: "uidV", decision: "approved" });
  await c("student-profile", "tokA", adult); await c("student-profile", "tokB", kid);
  return { w, c };
}
const future = () => Date.now() + 3600e3;
const sess = { title: "أساسيات Python", track: "python", startsAt: future(), durationMin: 60, linkUrl: "https://meet.google.com/abc-defg-hij" };
test("off by default: new routes are 503 after auth and 401 anonymous", async () => {
  const w = boot({});
  for (const p of ["student-profile", "sessions/list", "groups/list", "admin/summary"]) { assert.equal((await w.call(P + p, { token: "tokA", body: {} })).status, 503, p); assert.equal((await w.call(P + p, { body: {} })).status, 401, p); }
});
test("student profile: adult active, under-18 pending until the owner confirms the guardian", async () => {
  const { c } = await world();
  assert.equal((await c("my-role", "tokA")).data.role, "student");
  assert.equal((await c("my-role", "tokB")).data.role, "student_pending");
  assert.equal((await c("student-profile", "tokU", { ...kid, guardianConsent: false })).status, 400);
  assert.equal((await c("sessions/list", "tokB")).status, 403, "pending under-18 cannot see sessions");
  assert.equal((await c("admin/guardians", "tokB")).status, 403);
  const g = await c("admin/guardians", "tokE"); assert.equal(g.data.items.length, 1);
  assert.equal((await c("admin/guardian-review", "tokE", { target: "uidB", decision: "verified" })).data.status, "active");
  assert.equal((await c("sessions/list", "tokB")).status, 200);
});
test("sessions: only approved trainers or the owner create; link host is allow-listed; students read; code share is trainer-write, student-read", async () => {
  const { c } = await world();
  assert.equal((await c("sessions/create", "tokA", sess)).status, 403);
  assert.equal((await c("sessions/create", "tokV", { ...sess, linkUrl: "https://evil.example/x" })).data.message, "link_not_allowed");
  assert.equal((await c("sessions/create", "tokV", { ...sess, linkUrl: "http://meet.google.com/x" })).status, 400);
  assert.equal((await c("sessions/create", "tokV", { ...sess, linkUrl: "https://meet.google.com.evil.com/x" })).status, 400);
  const mk = await c("sessions/create", "tokV", sess); assert.equal(mk.status, 200);
  const l = await c("sessions/list", "tokA"); assert.equal(l.data.sessions.length, 1); assert.equal(l.data.sessions[0].mine, false);
  const id = mk.data.id;
  assert.equal((await c("sessions/code-put", "tokA", { id, code: "x" })).status, 403);
  assert.equal((await c("sessions/code-put", "tokV", { id, code: "print(1)", lang: "python" })).status, 200);
  const g = await c("sessions/code-get", "tokA", { id, since: 0 }); assert.equal(g.data.code, "print(1)");
  assert.equal((await c("sessions/code-get", "tokA", { id, since: g.data.v })).data.changed, false);
  assert.equal((await c("sessions/code-put", "tokV", { id, code: "y".repeat(7000) })).status, 400);
  assert.equal((await c("sessions/cancel", "tokA", { id })).status, 403);
  assert.equal((await c("sessions/cancel", "tokV", { id })).status, 200);
  assert.equal((await c("sessions/list", "tokA")).data.sessions.length, 0);
});
test("groups: trainer creates, student asks, trainer approves, text only, no links from students, mute, report, remove, admin sees all", async () => {
  const { w, c } = await world();
  assert.equal((await c("groups/create", "tokA", { name: "مجموعة", track: "python" })).status, 403);
  const gid = (await c("groups/create", "tokV", { name: "مجموعة بايثون", description: "للمبتدئين", track: "python" })).data.id;
  assert.equal((await c("groups/join", "tokB", { gid, nick: "نور" })).status, 403, "pending guardian cannot join");
  assert.equal((await c("groups/join", "tokA", { gid, nick: "" })).data.message, "nickname_required");
  assert.equal((await c("groups/join", "tokA", { gid, nick: "علي" })).status, 200);
  assert.equal((await c("groups/post", "tokA", { gid, text: "مرحبا" })).status, 403, "not a member yet");
  assert.equal((await c("groups/review", "tokA", { gid, target: "uidA", decision: "approve" })).status, 403);
  assert.equal((await c("groups/review", "tokV", { gid, target: "uidA", decision: "approve" })).status, 200);
  assert.equal((await c("groups/post", "tokA", { gid, text: "ادخلوا https://x.com" })).data.message, "no_links_or_contacts");
  assert.equal((await c("groups/post", "tokA", { gid, text: "واتساب 01012345678" })).data.message, "no_links_or_contacts");
  assert.equal((await c("groups/post", "tokA", { gid, text: "سؤال عن الدرس" })).status, 200);
  assert.equal((await c("groups/post", "tokA", { gid, text: "سؤال ثاني" })).status, 429);
  assert.equal((await c("groups/post", "tokA", { gid, text: "إعلان", kind: "ann" })).data.message, "announce_owner_only");
  assert.equal((await c("groups/post", "tokV", { gid, text: "الجلسة غدًا https://meet.google.com/a", kind: "ann" })).status, 200);
  const r = await c("groups/read", "tokA", { gid, since: 0 }); assert.equal(r.data.items.length, 2); assert.equal(r.data.items[1].kind, "ann"); assert.equal(r.data.members[0].uid, undefined, "students never see member ids");
  assert.equal((await c("groups/read", "tokB", { gid })).status, 403, "non-member cannot read");
  const mid = r.data.items[1].id;
  assert.equal((await c("groups/report", "tokA", { gid, mid })).status, 200);
  assert.equal((await c("admin/groups", "tokE")).data.reports.length, 1);
  assert.equal((await c("admin/groups", "tokA")).status, 403);
  assert.equal((await c("groups/mute", "tokV", { gid, target: "uidA", on: true })).status, 200);
  assert.equal((await c("groups/post", "tokA", { gid, text: "هل أنا مكتوم" })).data.message, "muted");
  assert.equal((await c("groups/delete-msg", "tokA", { gid, mid })).status, 403);
  assert.equal((await c("groups/delete-msg", "tokV", { gid, mid })).status, 200);
  assert.equal((await c("groups/read", "tokA", { gid, since: 0 })).data.items.length, 1);
  assert.equal((await c("groups/remove", "tokV", { gid, target: "uidA" })).status, 200);
  assert.equal((await c("groups/read", "tokA", { gid })).status, 403);
  assert.equal((await c("groups/read", "tokE", { gid })).status, 200, "owner (admin) can read any group");
  assert.equal((await c("admin/summary", "tokE")).data.groups, 1);
});
test("a session tied to a group is hidden from non-members", async () => {
  const { c } = await world();
  const gid = (await c("groups/create", "tokV", { name: "مجموعة خاصة", track: "python" })).data.id;
  await c("groups/join", "tokA", { gid, nick: "علي" }); await c("groups/review", "tokV", { gid, target: "uidA", decision: "approve" });
  assert.equal((await c("sessions/create", "tokV", { ...sess, groupId: "nope" })).status, 403);
  assert.equal((await c("sessions/create", "tokV", { ...sess, groupId: gid })).status, 200);
  assert.equal((await c("sessions/list", "tokA")).data.sessions.length, 1);
  await c("admin/guardian-review", "tokE", { target: "uidB", decision: "verified" });
  assert.equal((await c("sessions/list", "tokB")).data.sessions.length, 0);
});
test("attendance: an active student's join tap is recorded once; only the owner or admin reads it; pending students and strangers cannot", async () => {
  const { c } = await world();
  const mk = await c("sessions/create", "tokV", sess); assert.equal(mk.data.success, true); const id = mk.data.id;
  assert.equal((await c("sessions/attend", "tokA", { id })).status, 200); assert.equal((await c("sessions/attend", "tokA", { id })).status, 200);
  assert.equal((await c("sessions/attend", "tokB", { id })).status, 403);
  assert.equal((await c("sessions/attendance", "tokA", { id })).status, 403);
  const r = await c("sessions/attendance", "tokV", { id }); assert.equal(r.data.count, 1); assert.deepEqual(r.data.names, []);
  const mine = (await c("sessions/list", "tokV")).data.sessions.find(x => x.id === id); assert.equal(mine.attended, 1);
  const theirs = (await c("sessions/list", "tokA")).data.sessions.find(x => x.id === id); assert.equal("attended" in theirs, false);
});

import { MEMBER_CAP, reviewJoin } from "../academy-groups-core.js";
test("group size cap is 8: the 9th approval is refused", () => {
  assert.equal(MEMBER_CAP, 8);
  const g = { owner: "o", members: {}, pending: {}, muted: {} };
  for (let i = 0; i < 9; i++) g.pending["u" + i] = { nick: "n" + i, at: 1 };
  for (let i = 0; i < 8; i++) assert.equal(reviewJoin(g, "o", false, "u" + i, "approve", 2).ok, true);
  const r = reviewJoin(g, "o", false, "u8", "approve", 3); assert.equal(r.ok, false); assert.equal(r.reason, "group_full");
});

test("demo day: session kind is kept, unknown kinds fall back to lesson", async () => {
  const { c } = await world();
  const a = await c("sessions/create", "tokV", { ...sess, kind: "demo" }); const b = await c("sessions/create", "tokV", { ...sess, kind: "x" });
  const l = (await c("sessions/list", "tokV")).data.sessions;
  assert.equal(l.find(x => x.id === a.data.id).kind, "demo"); assert.equal(l.find(x => x.id === b.data.id).kind, "lesson");
});

import { createAssignment, listAssignments, markAssignment, deleteAssignment } from "../academy-groups-core.js";
test("assignments: owner posts, members tick done, owner sees names, outsiders refused", () => {
  const g = { id: "g1", owner: "o", members: { a: { nick: "نور" }, b: { nick: "سلمى" } }, pending: { p: { nick: "x" } }, muted: {} }, asg = {};
  assert.equal(createAssignment(asg, g, "a", false, { title: "تمرين 1" }, "i1", 1000).status, 403);
  assert.equal(createAssignment(asg, g, "o", false, { title: "x" }, "i1", 1000).reason, "invalid");
  assert.equal(createAssignment(asg, g, "o", false, { title: "تمرين الحلقات", text: "حل 3 مسائل", due: 5000 }, "i1", 1000).ok, true);
  assert.equal(markAssignment(asg, g, "p", "i1", true, 2000).status, 403);
  assert.equal(markAssignment(asg, g, "a", "i1", true, 2000).ok, true); markAssignment(asg, g, "a", "i1", true, 3000);
  const m = listAssignments(asg, g, "a", false); assert.equal(m.items[0].done, true); assert.equal("doneCount" in m.items[0], false);
  const o = listAssignments(asg, g, "o", false); assert.equal(o.items[0].doneCount, 1); assert.deepEqual(o.items[0].doneNames, ["نور"]);
  assert.equal(listAssignments(asg, g, "z", false).status, 403);
  assert.equal(markAssignment(asg, g, "a", "i1", false, 4000).ok, true); assert.equal(listAssignments(asg, g, "o", false).items[0].doneCount, 0);
  assert.equal(deleteAssignment(asg, g, "a", false, "i1").status, 403); assert.equal(deleteAssignment(asg, g, "o", false, "i1").ok, true); assert.equal(listAssignments(asg, g, "o", false).items.length, 0);
});
test("assignments routes work end to end through the Worker", async () => {
  const { c } = await world();
  const gid = (await c("groups/create", "tokV", { name: "مجموعة بايثون", description: "", track: "python" })).data.id;
  await c("groups/join", "tokA", { gid, nick: "علي" }); await c("groups/review", "tokV", { gid, target: "uidA", decision: "approve" });
  assert.equal((await c("assignments/create", "tokA", { gid, title: "تمرين 1" })).status, 403);
  const mk = await c("assignments/create", "tokV", { gid, title: "تمرين الحلقات", text: "حل مسألتين" }); assert.equal(mk.status, 200);
  assert.equal((await c("assignments/mark", "tokA", { gid, id: mk.data.id, on: true })).status, 200);
  assert.equal((await c("assignments/list", "tokV", { gid })).data.items[0].doneCount, 1);
  assert.equal((await c("assignments/list", "tokA", { gid })).data.items[0].done, true);
});

import { removeMember, requestJoin } from "../academy-groups-core.js";
test("a student can withdraw a pending request and leave a group; nobody else can remove them", () => {
  const g = { id: "g", owner: "o", members: { m: { nick: "نور" } }, pending: {}, muted: {} };
  assert.equal(requestJoin(g, "p", "سلمى", 1).ok, true); assert.equal(removeMember(g, "x", false, "p").ok, false);
  assert.equal(removeMember(g, "p", false, "p").ok, true); assert.equal(Object.keys(g.pending).length, 0);
  assert.equal(removeMember(g, "m", false, "m").ok, true); assert.equal(Object.keys(g.members).length, 0);
});
