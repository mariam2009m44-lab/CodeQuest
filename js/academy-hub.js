import { auth, authPersistenceReady } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { academyWorker } from "./academy-api.js";
import { ACADEMY_DOWN_TEXT } from "./academy-errors.js";

const $ = id => document.getElementById(id);
const TRACKS = { python: "Python", javascript: "JavaScript", cpp: "C++", java: "Java", web: "الويب", ai: "الذكاء الاصطناعي" };
const REASONS = {
  profile_required: "أكمل ملف الطالب أولًا من صفحة التسجيل.", guardian_pending: "ملفك بانتظار تأكيد موافقة ولي الأمر من الإدارة.", trainer_only: "هذه الأداة للمدربين المعتمدين فقط.",
  link_not_allowed: "الرابط غير مدعوم. استخدم Google Meet أو Zoom أو Jitsi أو Teams أو Whereby بصيغة https.", invalid: "راجع البيانات المدخلة.", too_many_sessions: "وصلت للحد الأقصى من الجلسات النشطة.",
  too_many_groups: "وصلت للحد الأقصى من المجموعات.", nickname_required: "اكتب اسمًا مستعارًا من حرفين على الأقل.", already_member: "أنت عضو في هذه المجموعة.", already_pending: "طلبك قيد انتظار موافقة المدرب.",
  not_member: "هذه المجموعة للأعضاء فقط.", muted: "تم كتم الإرسال لك في هذه المجموعة.", slow_down: "انتظر ثانيتين بين الرسائل.", no_links_or_contacts: "لا يمكن إرسال روابط أو أرقام هاتف أو حسابات.",
  too_long: "النص أطول من المسموح.", empty: "اكتب رسالة أولًا.", announce_owner_only: "الإعلانات للمدرب فقط.", group_full: "المجموعة ممتلئة.", not_your_group: "هذه المجموعة ليست لك.", forbidden: "غير مسموح."
};
const state = { user: null, role: "none", sessions: [], groups: [], chatId: "", since: 0, codeId: "", codeV: 0, timers: [] };
const isTrainer = () => state.role === "trainer" || state.role === "admin";

function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function say(node, text, bad) { node.textContent = text || ""; node.classList.toggle("is-error", !!bad); }
async function api(path, body) {
  const r = await academyWorker(state.user, path, body || {});
  if (r.off) throw new Error(ACADEMY_DOWN_TEXT);
  if (r.unreachable) throw new Error("تعذر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.");
  if (!r.ok) throw new Error(REASONS[r.data.message] || "تعذر تنفيذ الطلب. حاول مرة أخرى.");
  return r.data;
}
function fmt(ts) { return new Date(ts).toLocaleString("ar-EG", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }); }
function setTab(name) {
  const s = name === "sessions";
  $("paneSessions").hidden = !s; $("paneGroups").hidden = s;
  $("tabSessions").classList.toggle("is-active", s); $("tabGroups").classList.toggle("is-active", !s);
  $("tabSessions").setAttribute("aria-selected", String(s)); $("tabGroups").setAttribute("aria-selected", String(!s));
  if (!s) loadGroups(); else loadSessions();
}
$("tabSessions").addEventListener("click", () => setTab("sessions"));
$("tabGroups").addEventListener("click", () => setTab("groups"));

// ---------- Sessions ----------
async function loadSessions() {
  const list = $("sessionList");
  try {
    const d = await api("sessions/list"); state.sessions = d.sessions || [];
    list.replaceChildren();
    if (!state.sessions.length) { list.append(el("div", "hub-empty", "لا توجد جلسات قادمة الآن. ستظهر هنا عندما ينشر المدرب موعدًا.")); return; }
    for (const s of state.sessions) {
      const card = el("article", "hub-item"); card.append(el("h3", "", s.title));
      const meta = el("div", "hub-meta"); meta.append(el("span", "hub-pill", TRACKS[s.track] || s.track), el("span", "", fmt(s.startsAt)), el("span", "", s.durationMin + " دقيقة"), el("span", "", "المدرب: " + (s.ownerName || "—")));
      card.append(meta); if (s.description) card.append(el("p", "", s.description));
      const act = el("div", "hub-actions");
      const join = el("a", "hub-btn", "انضم للجلسة"); join.href = s.linkUrl; join.target = "_blank"; join.rel = "noopener noreferrer"; join.style.display = "inline-flex"; join.style.alignItems = "center"; join.style.textDecoration = "none";
      const code = el("button", "hub-ghost", s.mine || state.role === "admin" ? "كود الجلسة" : "عرض كود المدرب"); code.type = "button"; code.addEventListener("click", () => openCode(s));
      act.append(join, code);
      if (s.mine || state.role === "admin") { const c = el("button", "hub-ghost hub-danger", "إلغاء الجلسة"); c.type = "button"; c.addEventListener("click", async () => { if (!confirm("إلغاء هذه الجلسة؟")) return; try { await api("sessions/cancel", { id: s.id }); loadSessions(); } catch (e) { alert(e.message); } }); act.append(c); }
      card.append(act); list.append(card);
    }
  } catch (e) { list.replaceChildren(el("div", "hub-empty", e.message)); }
}
$("sessionForm").addEventListener("submit", async ev => {
  ev.preventDefault(); const f = ev.target, fb = $("sessionFeedback"), b = f.querySelector("button");
  b.disabled = true; say(fb, "");
  try {
    const startsAt = new Date(f.elements.startsAt.value).getTime();
    await api("sessions/create", { title: f.elements.title.value, description: f.elements.description.value, track: f.elements.track.value, durationMin: Number(f.elements.durationMin.value), startsAt, linkUrl: f.elements.linkUrl.value.trim(), groupId: f.elements.groupId.value });
    f.reset(); say(fb, "تم نشر الجلسة."); loadSessions();
  } catch (e) { say(fb, e.message, true); } finally { b.disabled = false; }
});
function stopCode() { clearInterval(state.codeTimer); state.codeId = ""; }
function openCode(s) {
  stopCode(); state.codeId = s.id; state.codeV = 0;
  const own = s.mine || state.role === "admin";
  $("codePanel").hidden = false; $("codeTitle").textContent = "كود: " + s.title; $("codeView").textContent = "";
  $("codeEditor").hidden = !own; $("codePublish").hidden = !own; $("codeLang").hidden = !own; $("codeView").hidden = own;
  $("codeHint").textContent = own ? "اكتب الكود هنا واضغط نشر. يرى الطلاب النسخة المنشورة فقط، للقراءة." : "هذا ما ينشره المدرب أثناء الشرح. يتحدث تلقائيًا، ويمكنك نسخه وتجربته في محرر CodeQuest.";
  say($("codeFeedback"), ""); $("codePanel").scrollIntoView({ behavior: "smooth", block: "nearest" });
  const poll = async () => {
    if (document.hidden || !state.codeId) return;
    try { const d = await api("sessions/code-get", { id: s.id, since: state.codeV }); if (d.changed) { state.codeV = d.v; if (own && !$("codeEditor").value) $("codeEditor").value = d.code || ""; $("codeView").textContent = d.code || ""; } else if (d.v) state.codeV = d.v; } catch {}
  };
  poll(); state.codeTimer = setInterval(poll, 4000);
}
$("codeClose").addEventListener("click", () => { stopCode(); $("codePanel").hidden = true; });
$("codePublish").addEventListener("click", async () => {
  const b = $("codePublish"); b.disabled = true;
  try { await api("sessions/code-put", { id: state.codeId, code: $("codeEditor").value, lang: $("codeLang").value }); say($("codeFeedback"), "تم النشر."); } catch (e) { say($("codeFeedback"), e.message, true); } finally { b.disabled = false; }
});

// ---------- Groups ----------
async function loadGroups() {
  const list = $("groupList");
  try {
    const d = await api("groups/list"); state.groups = d.groups || [];
    const sel = $("sessionGroup"); sel.length = 1;
    state.groups.filter(g => g.role === "owner" || state.role === "admin").forEach(g => sel.add(new Option(g.name, g.id)));
    list.replaceChildren();
    if (!state.groups.length) { list.append(el("div", "hub-empty", isTrainer() ? "لم تنشئ مجموعات بعد. أنشئ أول مجموعة لطلابك." : "لا توجد مجموعات الآن. ستظهر هنا مجموعات المدربين.")); return; }
    for (const g of state.groups) {
      const card = el("article", "hub-item"); card.append(el("h3", "", g.name));
      const meta = el("div", "hub-meta"); meta.append(el("span", "hub-pill", TRACKS[g.track] || g.track), el("span", "", "المدرب: " + (g.ownerName || "—")), el("span", "", g.members + " عضو")); if (g.archived) meta.append(el("span", "hub-pill", "مؤرشفة"));
      card.append(meta); if (g.description) card.append(el("p", "", g.description));
      const act = el("div", "hub-actions");
      if (g.role === "owner" || g.role === "member" || state.role === "admin") { const o = el("button", "hub-btn", "فتح المحادثة"); o.type = "button"; o.addEventListener("click", () => openChat(g)); act.append(o); }
      else if (g.role === "pending") act.append(el("span", "hub-pill", "طلبك بانتظار موافقة المدرب"));
      else if (state.role === "student") {
        const j = el("button", "hub-btn", "اطلب الانضمام"); j.type = "button";
        j.addEventListener("click", async () => { const nick = prompt("اكتب اسمًا مستعارًا يظهر للمجموعة (بدون اسمك الحقيقي):"); if (!nick) return; try { await api("groups/join", { gid: g.id, nick }); loadGroups(); } catch (e) { alert(e.message); } });
        act.append(j);
      }
      card.append(act); list.append(card);
    }
  } catch (e) { list.replaceChildren(el("div", "hub-empty", e.message)); }
}
$("groupForm").addEventListener("submit", async ev => {
  ev.preventDefault(); const f = ev.target, fb = $("groupFeedback"), b = f.querySelector("button"); b.disabled = true; say(fb, "");
  try { await api("groups/create", { name: f.elements.name.value, description: f.elements.description.value, track: f.elements.track.value }); f.reset(); say(fb, "تم إنشاء المجموعة."); loadGroups(); } catch (e) { say(fb, e.message, true); } finally { b.disabled = false; }
});
function stopChat() { clearInterval(state.chatTimer); state.chatId = ""; }
async function openChat(g) {
  stopChat(); state.chatId = g.id; state.since = 0; $("chat").hidden = false; $("groupList").hidden = true; $("groupCreate").hidden = true;
  $("chatTitle").textContent = g.name; $("chatMeta").textContent = "المدرب: " + (g.ownerName || "—"); $("chatMessages").replaceChildren(); say($("chatFeedback"), "");
  const poll = async () => { if (document.hidden || state.chatId !== g.id) return; await refreshChat(); };
  await refreshChat(true); state.chatTimer = setInterval(poll, 5000);
}
async function refreshChat(first) {
  const box = $("chatMessages");
  try {
    const d = await api("groups/read", { gid: state.chatId, since: state.since });
    const owner = d.role === "owner" || d.role === "admin";
    $("annLabel").hidden = !owner; $("manage").hidden = !owner;
    const near = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    for (const m of d.items) {
      state.since = Math.max(state.since, m.at);
      const row = el("div", "hub-msg " + (m.kind === "ann" ? "ann" : m.mine ? "mine" : "other"));
      row.dataset.id = m.id;
      row.append(el("b", "", (m.kind === "ann" ? "إعلان · " : "") + m.nick + (m.role === "trainer" ? " (المدرب)" : m.role === "admin" ? "" : "")));
      row.append(el("span", "", m.text)); row.append(el("small", "", new Date(m.at).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" })));
      if (!m.mine && d.role === "member") { const r = el("button", "", "إبلاغ"); r.type = "button"; r.addEventListener("click", async () => { try { await api("groups/report", { gid: state.chatId, mid: m.id }); r.textContent = "تم الإبلاغ"; r.disabled = true; } catch (e) { alert(e.message); } }); row.querySelector("small").append(r); }
      if (owner || m.mine) { const x = el("button", "", "حذف"); x.type = "button"; x.addEventListener("click", async () => { try { await api("groups/delete-msg", { gid: state.chatId, mid: m.id }); row.remove(); } catch (e) { alert(e.message); } }); row.querySelector("small").append(x); }
      box.append(row);
    }
    if (first || near) box.scrollTop = box.scrollHeight;
    if (owner) renderManage(d);
  } catch (e) { say($("chatFeedback"), e.message, true); }
}
function renderManage(d) {
  const p = $("pendingList"), m = $("memberList"); p.replaceChildren(); m.replaceChildren();
  if (!d.pending.length) p.append(el("p", "hub-hint", "لا توجد طلبات انضمام."));
  for (const x of d.pending) {
    const row = el("div", "hub-person"); row.append(el("span", "", x.nick));
    const a = el("div", "hub-actions"); a.style.margin = 0;
    for (const [lab, dec] of [["قبول", "approve"], ["رفض", "reject"]]) { const b = el("button", dec === "approve" ? "hub-btn" : "hub-ghost", lab); b.type = "button"; b.addEventListener("click", async () => { try { await api("groups/review", { gid: state.chatId, target: x.uid, decision: dec }); refreshChat(); } catch (e) { alert(e.message); } }); a.append(b); }
    row.append(a); p.append(row);
  }
  if (!d.members.length) m.append(el("p", "hub-hint", "لا يوجد أعضاء بعد."));
  for (const x of d.members) {
    const row = el("div", "hub-person"); row.append(el("span", "", x.nick + (x.muted ? " (مكتوم)" : "")));
    const a = el("div", "hub-actions"); a.style.margin = 0;
    const mu = el("button", "hub-ghost", x.muted ? "إلغاء الكتم" : "كتم"); mu.type = "button"; mu.addEventListener("click", async () => { try { await api("groups/mute", { gid: state.chatId, target: x.uid, on: !x.muted }); refreshChat(); } catch (e) { alert(e.message); } });
    const rm = el("button", "hub-ghost hub-danger", "إزالة"); rm.type = "button"; rm.addEventListener("click", async () => { if (!confirm("إزالة " + x.nick + " من المجموعة؟")) return; try { await api("groups/remove", { gid: state.chatId, target: x.uid }); refreshChat(); } catch (e) { alert(e.message); } });
    a.append(mu, rm); row.append(a); m.append(row);
  }
}
$("chatForm").addEventListener("submit", async ev => {
  ev.preventDefault(); const input = $("chatInput"), b = ev.target.querySelector("button"); b.disabled = true;
  try { await api("groups/post", { gid: state.chatId, text: input.value, kind: $("annCheck").checked ? "ann" : "msg" }); input.value = ""; $("annCheck").checked = false; say($("chatFeedback"), ""); await refreshChat(true); }
  catch (e) { say($("chatFeedback"), e.message, true); } finally { b.disabled = false; input.focus(); }
});
$("chatClose").addEventListener("click", () => { stopChat(); $("chat").hidden = true; $("groupList").hidden = false; $("groupCreate").hidden = !isTrainer(); loadGroups(); });
$("archiveBtn").addEventListener("click", async () => { if (!confirm("أرشفة المجموعة؟ لن يتمكن الأعضاء من المراسلة.")) return; try { await api("groups/archive", { gid: state.chatId }); $("chatClose").click(); } catch (e) { alert(e.message); } });

// ---------- Boot ----------
await authPersistenceReady;
onAuthStateChanged(auth, async user => {
  state.user = user; const st = $("hubState");
  if (!user) { st.textContent = "سجّل الدخول لمشاهدة الجلسات والمجموعات. "; const a = el("a", "", "تسجيل الدخول"); a.href = "login.html?next=academy-hub.html"; st.append(a); $("hubBody").hidden = true; return; }
  try {
    const d = await api("my-role"); state.role = d.role;
    const reg = () => { st.textContent = ""; const a = el("a", "", "صفحة التسجيل"); a.href = "academy-registration.html"; return a; };
    if (state.role === "student_pending") { st.textContent = "ملفك محفوظ وبانتظار تأكيد موافقة ولي الأمر من الإدارة. بعدها تفتح الجلسات والمجموعات."; $("hubBody").hidden = true; return; }
    if (state.role === "none" || String(state.role).startsWith("applicant_")) {
      const a = reg(); st.append(state.role === "applicant_pending" ? "طلبك كمدرب قيد المراجعة. يمكنك أيضًا إكمال ملف الطالب من " : "أكمل التسجيل أولًا كطالب أو مدرب من ", a, "."); $("hubBody").hidden = true; return;
    }
    st.textContent = state.role === "admin" ? "أنت في وضع الإدارة." : state.role === "trainer" ? "أهلًا بك أيها المدرب المعتمد." : "ملفك مفعّل. اختر جلسة أو مجموعة.";
    $("hubBody").hidden = false; $("sessionCreate").hidden = !isTrainer(); $("groupCreate").hidden = !isTrainer();
    loadSessions(); loadGroups();
  } catch (e) { st.textContent = e.message; $("hubBody").hidden = true; }
});
