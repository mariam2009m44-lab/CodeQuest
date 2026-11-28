// Pure logic for trainer-led student groups (free Worker path, no I/O). Text only, no direct messages, no links from students.
export const GROUP_CAP = 200;
export const MEMBER_CAP = 8;
export const MSG_KEEP = 200;
export const MSG_MAX = 500;
const TRACKS = ["python", "javascript", "cpp", "java", "web", "ai"];
const str = v => String(v == null ? "" : v).trim();
const LINK_RE = /(https?:|www\.|[a-z0-9-]+\.(com|net|org|io|me|ly|app|dev|co|tv|gg|xyz|info)\b|@[a-z0-9_.]{3,})/i;
const PHONE_RE = /(\+?\d[\d\s-]{7,}\d)/;
export function validateGroup(d) {
  d = d && typeof d === "object" && !Array.isArray(d) ? d : {};
  const v = { name: str(d.name), description: str(d.description), track: str(d.track) };
  if (v.name.length < 3 || v.name.length > 60 || v.description.length > 300 || !TRACKS.includes(v.track)) return { ok: false, reason: "invalid" };
  return { ok: true, value: v };
}
export function cleanNick(n) { return str(n).replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 20); }
export function createGroup(g, id, uid, ownerName, value, now) {
  if (Object.values(g).filter(x => x.owner === uid && !x.archived).length >= 10) return { ok: false, status: 429, reason: "too_many_groups" };
  if (Object.keys(g).length >= GROUP_CAP) return { ok: false, status: 503, reason: "groups_full" };
  g[id] = { ...value, id, owner: uid, ownerName: String(ownerName || "").slice(0, 80), archived: false, createdAt: now, members: {}, pending: {}, muted: {} };
  return { ok: true, group: g[id] };
}
export function roleOf(group, uid) { return !group ? "none" : group.owner === uid ? "owner" : group.members[uid] ? "member" : group.pending[uid] ? "pending" : "none"; }
// Discovery shows only what is needed to ask to join. No member names.
export function listGroups(g, uid, isAdmin) {
  return Object.values(g).filter(x => !x.archived || isAdmin).sort((a, b) => b.createdAt - a.createdAt).slice(0, 100).map(x => ({
    id: x.id, name: x.name, description: x.description, track: x.track, ownerName: x.ownerName, members: Object.keys(x.members).length, role: roleOf(x, uid), archived: x.archived }));
}
export function requestJoin(group, uid, nick, now) {
  if (!group || group.archived) return { ok: false, status: 404, reason: "not_found" };
  if (roleOf(group, uid) !== "none") return { ok: false, status: 409, reason: "already_" + roleOf(group, uid) };
  if (Object.keys(group.members).length + Object.keys(group.pending).length >= MEMBER_CAP * 2) return { ok: false, status: 503, reason: "group_full" };
  const n = cleanNick(nick); if (n.length < 2) return { ok: false, status: 400, reason: "nickname_required" };
  group.pending[uid] = { nick: n, at: now }; return { ok: true };
}
export function reviewJoin(group, actor, isAdmin, target, decision, now) {
  if (!group) return { ok: false, status: 404, reason: "not_found" };
  if (group.owner !== actor && !isAdmin) return { ok: false, status: 403, reason: "forbidden" };
  const p = group.pending[target]; if (!p) return { ok: false, status: 404, reason: "no_request" };
  if (!["approve", "reject"].includes(decision)) return { ok: false, status: 400, reason: "bad_decision" };
  if (decision === "approve") {
    if (Object.keys(group.members).length >= MEMBER_CAP) return { ok: false, status: 409, reason: "group_full" };
    group.members[target] = { nick: p.nick, at: now };
  }
  delete group.pending[target]; return { ok: true };
}
export function removeMember(group, actor, isAdmin, target) {
  if (!group) return { ok: false, status: 404, reason: "not_found" };
  const self = actor === target && !!group.members[target];
  if (group.owner !== actor && !isAdmin && !self) return { ok: false, status: 403, reason: "forbidden" };
  if (!group.members[target]) return { ok: false, status: 404, reason: "not_member" };
  delete group.members[target]; delete group.muted[target]; return { ok: true };
}
export function setMute(group, actor, isAdmin, target, on) {
  if (!group) return { ok: false, status: 404, reason: "not_found" };
  if (group.owner !== actor && !isAdmin) return { ok: false, status: 403, reason: "forbidden" };
  if (!group.members[target]) return { ok: false, status: 404, reason: "not_member" };
  if (on) group.muted[target] = 1; else delete group.muted[target]; return { ok: true };
}
export function archiveGroup(group, actor, isAdmin) {
  if (!group) return { ok: false, status: 404, reason: "not_found" };
  if (group.owner !== actor && !isAdmin) return { ok: false, status: 403, reason: "forbidden" };
  group.archived = true; return { ok: true };
}
export function textProblem(text, trainer) {
  const t = str(text);
  if (!t) return "empty"; if (t.length > MSG_MAX) return "too_long";
  if (!trainer && (LINK_RE.test(t) || PHONE_RE.test(t))) return "no_links_or_contacts";
  return "";
}
// kind "ann" (announcement) is for the group's trainer only.
export function postMessage(group, msgs, actor, isAdmin, text, kind, mid, now) {
  if (!group || group.archived) return { ok: false, status: 404, reason: "not_found" };
  const role = roleOf(group, actor), owner = role === "owner";
  if (!owner && role !== "member" && !isAdmin) return { ok: false, status: 403, reason: "not_member" };
  if (group.muted[actor]) return { ok: false, status: 403, reason: "muted" };
  const k = kind === "ann" ? "ann" : "msg";
  if (k === "ann" && !owner && !isAdmin) return { ok: false, status: 403, reason: "announce_owner_only" };
  const bad = textProblem(text, owner || isAdmin); if (bad) return { ok: false, status: 400, reason: bad };
  const last = [...msgs].reverse().find(m => m.uid === actor);
  if (last && now - last.at < 2000) return { ok: false, status: 429, reason: "slow_down" };
  const nick = owner ? group.ownerName : isAdmin && !group.members[actor] ? "الإدارة" : group.members[actor].nick;
  msgs.push({ id: mid, uid: actor, nick, role: owner ? "trainer" : isAdmin && !group.members[actor] ? "admin" : "student", text: str(text), kind: k, at: now });
  if (msgs.length > MSG_KEEP) msgs.splice(0, msgs.length - MSG_KEEP);
  return { ok: true };
}
export function readMessages(group, msgs, actor, isAdmin, since) {
  const role = roleOf(group, actor);
  if (!group) return { ok: false, status: 404, reason: "not_found" };
  if (role !== "owner" && role !== "member" && !isAdmin) return { ok: false, status: 403, reason: "not_member" };
  const s = Number(since) || 0;
  const items = msgs.filter(m => m.at > s && !m.deleted).map(m => ({ id: m.id, nick: m.nick, role: m.role, text: m.text, kind: m.kind, at: m.at, mine: m.uid === actor }));
  const members = Object.entries(group.members).map(([uid, m]) => ({ uid: role === "owner" || isAdmin ? uid : undefined, nick: m.nick, muted: !!group.muted[uid] }));
  const pending = role === "owner" || isAdmin ? Object.entries(group.pending).map(([uid, p]) => ({ uid, nick: p.nick, at: p.at })) : [];
  return { ok: true, items, members, pending, group: { id: group.id, name: group.name, description: group.description, track: group.track, ownerName: group.ownerName, archived: group.archived }, role: role === "none" ? "admin" : role };
}
export function deleteMessage(group, msgs, actor, isAdmin, mid) {
  if (!group) return { ok: false, status: 404, reason: "not_found" };
  const m = msgs.find(x => x.id === mid); if (!m) return { ok: false, status: 404, reason: "not_found" };
  if (group.owner !== actor && !isAdmin && m.uid !== actor) return { ok: false, status: 403, reason: "forbidden" };
  m.deleted = true; m.text = ""; return { ok: true };
}
export function reportMessage(group, msgs, reports, actor, mid, now) {
  if (!group || roleOf(group, actor) !== "member") return { ok: false, status: 403, reason: "not_member" };
  const m = msgs.find(x => x.id === mid); if (!m || m.deleted) return { ok: false, status: 404, reason: "not_found" };
  if (reports.some(r => r.gid === group.id && r.mid === mid && r.by === actor)) return { ok: true };
  reports.push({ gid: group.id, group: group.name, mid, text: m.text.slice(0, 200), nick: m.nick, by: actor, at: now });
  if (reports.length > 200) reports.splice(0, reports.length - 200);
  return { ok: true };
}

// Assignments: text only, per group. Trainer posts, members tick "done". Owner sees the count and nicknames.
export const ASG_CAP = 40;
export function createAssignment(asg, group, actor, isAdmin, d, id, now) {
  if (!group) return { ok: false, status: 404, reason: "not_found" };
  if (group.owner !== actor && !isAdmin) return { ok: false, status: 403, reason: "forbidden" };
  if (group.archived) return { ok: false, status: 409, reason: "archived" };
  const title = str(d && d.title), text = str(d && d.text), due = Number(d && d.due) || 0;
  if (title.length < 3 || title.length > 80 || text.length > 500) return { ok: false, status: 400, reason: "invalid" };
  if (due && (due < now - 86400000 || due > now + 120 * 86400000)) return { ok: false, status: 400, reason: "invalid" };
  if (Object.values(asg).filter(a => a.gid === group.id && !a.deleted).length >= ASG_CAP) return { ok: false, status: 429, reason: "too_many" };
  asg[id] = { id, gid: group.id, title, text, due, createdAt: now, done: {} };
  return { ok: true, id };
}
export function listAssignments(asg, group, actor, isAdmin) {
  const role = roleOf(group, actor);
  if (!group) return { ok: false, status: 404, reason: "not_found" };
  if (role !== "owner" && role !== "member" && !isAdmin) return { ok: false, status: 403, reason: "not_member" };
  const boss = role === "owner" || isAdmin;
  const items = Object.values(asg).filter(a => a.gid === group.id && !a.deleted).sort((a, b) => (a.due || 9e15) - (b.due || 9e15) || b.createdAt - a.createdAt)
    .map(a => ({ id: a.id, title: a.title, text: a.text, due: a.due, done: !!a.done[actor], ...(boss ? { doneCount: Object.keys(a.done).length, doneNames: Object.keys(a.done).map(u => group.members[u] && group.members[u].nick).filter(Boolean), memberCount: Object.keys(group.members).length } : {}) }));
  return { ok: true, items, role: role === "none" ? "admin" : role };
}
export function markAssignment(asg, group, actor, id, on, now) {
  const a = asg[id];
  if (!a || a.deleted || !group || a.gid !== group.id) return { ok: false, status: 404, reason: "not_found" };
  if (roleOf(group, actor) !== "member") return { ok: false, status: 403, reason: "not_member" };
  if (on) a.done[actor] = a.done[actor] || now; else delete a.done[actor];
  return { ok: true };
}
export function deleteAssignment(asg, group, actor, isAdmin, id) {
  const a = asg[id];
  if (!a || a.deleted || !group || a.gid !== group.id) return { ok: false, status: 404, reason: "not_found" };
  if (group.owner !== actor && !isAdmin) return { ok: false, status: 403, reason: "forbidden" };
  a.deleted = true; return { ok: true };
}
