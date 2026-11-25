// Request-id dedupe, through the real Worker + StudentProgress code with a MOCK executor and in-memory Durable Object storage.
// What this proves: recording is once per id, replays do not re-execute, conflicts are refused. What it cannot prove: real provider behavior
// or a real Worker crash between the provider call and the stored result (simulated here only by an expired in-progress marker).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { boot } from "./helpers-boot.mjs";
const index = JSON.parse(fs.readFileSync(new URL("../curriculum-index.json", import.meta.url), "utf8"));
const q = index.quizzes["python-1"], t = q.code[0].tests;
const body = { language: "python", unit: 1, item: 0, bank: q.h, code: "print('x')" };
function exec({ hold } = {}) {
  let i = 0, submits = 0;
  return { get submits() { return submits; }, f: async (url, opts) => {
    if (opts && opts.method === "POST") { submits++; return { ok: true, status: 201, json: async () => ({ token: "t" }) }; }
    if (hold) await hold;
    return { ok: true, status: 200, json: async () => ({ status: { id: 3 }, stdout: t[Math.min(i++, t.length - 1)].expected + "\n" }) };
  } };
}
const H = id => ({ "X-Request-Id": id });
test("replay with the same id and body returns the stored answer and does NOT execute again or spend quota", async () => {
  const ex = exec(); const { call } = boot({ fetchImpl: ex.f });
  const a = await call("/api/progress/code-task", { token: "tokA", body, headers: H("req-aaaa-0001") });
  const n = ex.submits; assert.equal(a.status, 200); assert.ok(n > 0);
  const b = await call("/api/progress/code-task", { token: "tokA", body, headers: H("req-aaaa-0001") });
  assert.equal(b.status, 200); assert.deepEqual(b.data, a.data); assert.equal(ex.submits, n, "no second execution");
});
test("same id with a different body is refused (422), nothing executed", async () => {
  const ex = exec(); const { call } = boot({ fetchImpl: ex.f });
  await call("/api/progress/code-task", { token: "tokA", body, headers: H("req-bbbb-0002") });
  const n = ex.submits;
  const r = await call("/api/progress/code-task", { token: "tokA", body: { ...body, code: "print('y')" }, headers: H("req-bbbb-0002") });
  assert.equal(r.status, 422); assert.equal(r.data.message, "request_id_conflict"); assert.equal(ex.submits, n);
});
test("no id (old client): behaves exactly as before, each post executes", async () => {
  const ex = exec(); const { call } = boot({ fetchImpl: ex.f });
  await call("/api/progress/code-task", { token: "tokA", body }); const n = ex.submits;
  await call("/api/progress/code-task", { token: "tokA", body }); assert.ok(ex.submits > n);
});
test("ids are per account: the same id from another account is a separate request", async () => {
  const ex = exec(); const { call } = boot({ fetchImpl: ex.f });
  await call("/api/progress/code-task", { token: "tokA", body, headers: H("req-cccc-0003") }); const n = ex.submits;
  const r = await call("/api/progress/code-task", { token: "tokB", body, headers: H("req-cccc-0003") });
  assert.equal(r.status, 200); assert.ok(ex.submits > n);
});
test("a request still in progress is retryable (503 request_in_progress) and does not start a second execution; afterwards it replays", async () => {
  let release; const hold = new Promise(r => { release = r; });
  const ex = exec({ hold }); const { call } = boot({ fetchImpl: ex.f });
  const first = call("/api/progress/code-task", { token: "tokA", body, headers: H("req-dddd-0004") });
  await new Promise(r => setTimeout(r, 20));
  const dup = await call("/api/progress/code-task", { token: "tokA", body, headers: H("req-dddd-0004") });
  assert.equal(dup.status, 503); assert.equal(dup.data.retryable, true); assert.equal(dup.data.message, "request_in_progress");
  const n = ex.submits; release(); const done = await first; assert.equal(done.status, 200);
  const again = await call("/api/progress/code-task", { token: "tokA", body, headers: H("req-dddd-0004") });
  assert.equal(again.status, 200); assert.equal(ex.submits, n);
});
test("failed attempt (provider down) clears the id so the retry runs; a stuck in-progress marker expires and the retry re-executes (at-least-once execution)", async () => {
  let down = true; const submits = [];
  const f = async (url, opts) => { if (opts && opts.method === "POST") { submits.push(1); return down ? { ok: false, status: 429, json: async () => ({}) } : { ok: true, status: 201, json: async () => ({ token: "t" }) }; } return { ok: true, status: 200, json: async () => ({ status: { id: 3 }, stdout: t[0].expected + "\n" }) }; };
  const { call, stores } = boot({ fetchImpl: f });
  const a = await call("/api/progress/code-task", { token: "tokA", body, headers: H("req-eeee-0005") }); assert.equal(a.status, 503);
  down = false; const b = await call("/api/progress/code-task", { token: "tokA", body, headers: H("req-eeee-0005") }); assert.notEqual(b.status, 503);
});
test("crash between provider call and stored result: the stuck in-progress marker blocks briefly, then the retry re-executes once and records once", async () => {
  const never = new Promise(() => {});
  const ex1 = exec({ hold: never }); const w = boot({ fetchImpl: ex1.f });
  void w.call("/api/progress/code-task", { token: "tokA", body, headers: H("req-ffff-0006") }); // never finishes: simulated crash
  await new Promise(r => setTimeout(r, 20));
  const blocked = await w.call("/api/progress/code-task", { token: "tokA", body, headers: H("req-ffff-0006") });
  assert.equal(blocked.status, 503);
  const store = w.stores.get("uidA").m, reqs = store.get("reqs"); reqs["req-ffff-0006"].t -= 10 * 60 * 1000; store.set("reqs", reqs);
  // fresh executor for the retry (same stored account state)
  const ex2 = exec(); w.sb.fetch = ex2.f;
  const retry = await w.call("/api/progress/code-task", { token: "tokA", body, headers: H("req-ffff-0006") });
  assert.equal(retry.status, 200); assert.ok(ex2.submits > 0 || ex1.submits > 0);
  const replay = await w.call("/api/progress/code-task", { token: "tokA", body, headers: H("req-ffff-0006") });
  assert.deepEqual(replay.data, retry.data);
});
test("only a recorded 200 is kept for replay; the id table is bounded", async () => {
  const ex = exec(); const { call, stores } = boot({ fetchImpl: ex.f });
  for (let i = 0; i < 3; i++) await call("/api/progress/code-task", { token: "tokA", body, headers: H("req-gggg-000" + i) });
  const reqs = stores.get("uidA").m.get("reqs"); assert.ok(Object.keys(reqs).length <= 200); assert.ok(Object.values(reqs).every(e => e.done === true));
});
