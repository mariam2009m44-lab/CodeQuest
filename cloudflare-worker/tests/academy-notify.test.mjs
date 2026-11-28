import test from "node:test";
import assert from "node:assert/strict";
import { sendAdminNotice, NOTICE_DAILY_CAP } from "../academy-notify.js";
const kv = () => { const m = new Map(); return { m, get: async k => m.get(k) ?? null, put: async (k, v) => { m.set(k, v); } }; };
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
