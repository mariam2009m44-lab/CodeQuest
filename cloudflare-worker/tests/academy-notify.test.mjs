import test from "node:test";
import assert from "node:assert/strict";
import { sendAdminNotice, readLastNotice, NOTICE_DAILY_CAP } from "../academy-notify.js";
const kv = () => { const m = new Map(); return { m, get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); }, delete: async k => { m.delete(k); } }; };
const env = (o = {}) => ({ ACADEMY_EMAIL_NOTICE: "on", RESEND_API_KEY: "k", ADMIN_NOTICE_EMAIL: "owner@example.test", QUIZ_ANSWERS: kv(), ...o });
test("off without flag or secrets: no network call", async () => {
  let calls = 0; const f = async () => { calls++; return { ok: true }; };
  for (const e of [env({ ACADEMY_EMAIL_NOTICE: undefined }), env({ RESEND_API_KEY: undefined }), env({ ADMIN_NOTICE_EMAIL: undefined })]) assert.equal((await sendAdminNotice(e, "trainer", "u", f)).sent, false);
  assert.equal(calls, 0);
});
test("notice carries no personal data and goes only to the admin address", async () => {
  let body; const f = async (u, o) => { body = JSON.parse(o.body); return { ok: true }; };
  const r = await sendAdminNotice(env(), "trainer", "uid-secret-1", f);
  assert.equal(r.sent, true); assert.deepEqual(body.to, ["owner@example.test"]);
  assert.ok(!JSON.stringify(body).includes("uid-secret-1")); assert.ok(body.text.includes("academy-admin.html"));
});
test("student mails once, edits do not mail again", async () => {
  let calls = 0; const f = async () => { calls++; return { ok: true }; }; const e = env();
  await sendAdminNotice(e, "student", "s1", f); const again = await sendAdminNotice(e, "student", "s1", f);
  assert.equal(calls, 1); assert.equal(again.reason, "seen");
});
test("daily cap stops sending", async () => {
  let calls = 0; const f = async () => { calls++; return { ok: true }; }; const e = env();
  e.QUIZ_ANSWERS.m.set("notice:cap:" + new Date().toISOString().slice(0, 10), String(NOTICE_DAILY_CAP));
  assert.equal((await sendAdminNotice(e, "trainer", "u", f)).reason, "cap"); assert.equal(calls, 0);
});
test("provider failure or throw never throws to the caller", async () => {
  assert.equal((await sendAdminNotice(env(), "trainer", "u", async () => ({ ok: false, status: 403 }))).sent, false);
  assert.equal((await sendAdminNotice(env(), "trainer", "u", async () => { throw new Error("x"); })).reason, "error");
});
test("last result is recorded: provider rejection shows its status, missing secret is named", async () => {
  const e = env(); await sendAdminNotice(e, "trainer", "u", async () => ({ ok: false, status: 403 }));
  const last = JSON.parse(e.QUIZ_ANSWERS.m.get("notice:last")); assert.equal(last.reason, "http_403"); assert.ok(!JSON.stringify(last).includes("owner@example.test"));
  const e2 = env({ RESEND_API_KEY: undefined }); await sendAdminNotice(e2, "trainer", "u", async () => ({ ok: true }));
  assert.equal(JSON.parse(e2.QUIZ_ANSWERS.m.get("notice:last")).reason, "missing_key");
});
test("a refused student notice does not block the retry", async () => {
  const e = env(); let n = 0;
  const bad = async () => { n++; return { ok: false, status: 403 }; }, good = async () => { n++; return { ok: true, status: 200 }; };
  assert.equal((await sendAdminNotice(e, "student", "u1", bad)).sent, false);
  assert.equal((await sendAdminNotice(e, "student", "u1", good)).sent, true);
  assert.equal((await sendAdminNotice(e, "student", "u1", good)).reason, "seen"); assert.equal(n, 2);
});

test("live check reports presence of the flag and both secrets, never values", async () => {
  const a = await readLastNotice(env()); assert.deepEqual(a.live, { flag: true, key: true, email: true });
  const b = await readLastNotice(env({ RESEND_API_KEY: "" })); assert.equal(b.live.key, false); assert.equal(b.live.email, true);
  assert.ok(!JSON.stringify(a).includes("owner@example.test"));
});
