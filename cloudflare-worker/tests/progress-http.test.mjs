import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { checkIntroConcept } from "../studio/concept.mjs";
import * as core from "../progress-core.js";
const rd = f => JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8"));
const index = rd("../curriculum-index.json"), key = rd("../lesson-answers.json"), practice = rd("../practice-index.json");
const ORIGIN = "https://codequest-mu-six.vercel.app";
function boot({ fetchImpl } = {}) {
  let source = fs.readFileSync(new URL("../worker.js", import.meta.url), "utf8");
  source = source.replace(/^import .*;$/gm, "").replace("export default {", "globalThis.worker = {").replace(/export class (\w+)/g, "globalThis.$1 = class $1");
  const sb = { globalThis: null, URL, Response, console: { log() {}, warn() {}, error() {} }, AbortSignal, setTimeout, Date, JSON, Number, Promise, TextEncoder, TextDecoder, Request, Headers, ...core, checkIntroConcept, CURRICULUM_INDEX: index, LESSON_ANSWERS: key, PRACTICE_INDEX: practice, fetch: fetchImpl,
    createRemoteJWKSet() {},
    // Mock Firebase verification: token names map to claims. Anything else (expired, wrong audience, bad signature) throws like jose.
    async jwtVerify(token, _k, opts) {
      if (opts.audience !== "proj" || opts.issuer !== "https://securetoken.google.com/proj") throw new Error("claim");
      const t = { tokA: { sub: "uidA" }, tokB: { sub: "uidB" }, nosub: {}, longsub: { sub: "x".repeat(129) } }[token];
      if (!t) throw new Error("jwt invalid or expired");
      return { payload: t };
    } };
  sb.globalThis = sb; vm.runInNewContext(source, sb);
  const stores = new Map();
  const ns = { idFromName: n => n, get: id => { if (!stores.has(id)) { const m = new Map(); stores.set(id, { m, o: new sb.StudentProgress({ storage: { async transaction(fn) { return fn({ get: async k => m.has(k) ? JSON.parse(JSON.stringify(m.get(k))) : undefined, put: async (k, v) => { m.set(k, JSON.parse(JSON.stringify(v))); } }); } } }) }); } const h = stores.get(id); return { fetch: (u, init) => h.o.fetch(new Request(u, init)) }; } };
  const env = { FIREBASE_PROJECT_ID: "proj", ALLOWED_ORIGINS: ORIGIN, STUDENT_PROGRESS: ns };
  const call = (path, { token, body, method = "POST", origin = ORIGIN, raw } = {}) => sb.worker.fetch(new Request("https://w.test" + path, { method, headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}), ...(token ? { Authorization: token.startsWith("Bearer") || token.startsWith("Basic") ? token : "Bearer " + token } : {}) }, body: method === "GET" ? undefined : (raw ?? JSON.stringify(body ?? {})) }), env).then(async r => ({ status: r.status, h: r.headers, data: await r.json().catch(() => null) }));
  return { call, stores, sb, env };
}
const id = "py-1-1";
const lt = (extra = {}) => ({ language: "python", lessonId: id, version: "v1", bank: key[id].h, picks: key[id].a, ...extra });

test("auth boundary fails closed: missing, non-bearer, expired/wrong-audience/bad token, no sub, oversized sub", async () => {
  const { call, stores } = boot();
  for (const token of [undefined, "Basic abc", "Bearer ", "expired", "nosub", "longsub"]) {
    const r = await call("/api/progress/lesson-test", { token, body: lt() });
    assert.equal(r.status, 401, String(token));
  }
  assert.equal(stores.size, 0, "no Durable Object was touched");
});
test("a forged uid/score in the body never selects the account; ownership comes only from the token", async () => {
  const { call } = boot();
  const a = await call("/api/progress/lesson-test", { token: "tokA", body: lt({ uid: "uidB", userId: "uidB", percent: 100, passed: true }) });
  assert.equal(a.status, 200); assert.equal(a.data.passed, true);
  const gA = await call("/api/progress/get", { token: "tokA" }), gB = await call("/api/progress/get", { token: "tokB" });
  assert.equal(gA.data.lessonTests[id].passed, true);
  assert.deepEqual(gB.data.lessonTests, {});
  assert.equal(JSON.stringify(gA.data).includes("uid"), false);
  const bad = await call("/api/progress/lesson-test", { token: "tokB", body: lt({ picks: [0, 0, 0, 0].map((_, i) => (key[id].a[i] + 1) % 3), passed: true, percent: 100 }) });
  assert.equal(bad.data.passed, false);
});
test("CORS: unlisted origins get no allow header; the listed origin does; preflight answers", async () => {
  const { call } = boot();
  const evil = await call("/api/progress/get", { token: "tokA", origin: "https://evil.example" });
  assert.equal(evil.h.get("Access-Control-Allow-Origin"), null);
  const ok = await call("/api/progress/get", { token: "tokA" });
  assert.equal(ok.h.get("Access-Control-Allow-Origin"), ORIGIN);
  const pre = await call("/api/progress/lesson-test", { method: "OPTIONS" });
  assert.ok(pre.status < 300);
});
test("wrong method, oversized body and malformed JSON fail closed", async () => {
  const { call } = boot();
  assert.equal((await call("/api/progress/lesson-test", { method: "GET", token: "tokA" })).status, 404);
  assert.equal((await call("/api/progress/lesson-test", { token: "tokA", raw: JSON.stringify({ pad: "x".repeat(5000) }) })).status, 413);
  assert.equal((await call("/api/progress/lesson-test", { token: "tokA", raw: "{nope" })).status, 400);
  assert.equal((await call("/api/progress/lesson-test", { token: "tokA", body: lt({ language: "java" }) })).status, 400);
});
test("stale bank over HTTP: 409, nothing overwritten, pending retry with the old bank stays refused", async () => {
  const { call } = boot();
  assert.equal((await call("/api/progress/lesson-test", { token: "tokA", body: lt() })).status, 200);
  for (let i = 0; i < 2; i++) { const r = await call("/api/progress/lesson-test", { token: "tokA", body: lt({ bank: "stale" }) }); assert.equal(r.status, 409); assert.equal(r.data.refreshNeeded, true); }
  assert.equal((await call("/api/progress/get", { token: "tokA" })).data.lessonTests[id].passed, true);
});
function executorFetch(plan) {
  const log = [];
  return { log, f: async (url, opts) => {
    log.push(url);
    if (opts && opts.method === "POST") return plan.submit ? plan.submit() : { ok: true, status: 201, json: async () => ({ token: "t" }) };
    return plan.poll();
  } };
}
test("code-task over HTTP: server-owned expected output, executor verdict only, fail closed on provider failure", async () => {
  const q = index.quizzes["python-1"], t = q.code[0].tests;
  let i = 0;
  const ex = executorFetch({ poll: () => ({ ok: true, status: 200, json: async () => ({ status: { id: 3 }, stdout: t[Math.min(i++, t.length - 1)].expected + "\n" }) }) });
  const { call } = boot({ fetchImpl: ex.f });
  const body = { language: "python", unit: 1, item: 0, bank: q.h, code: "print('x')", passed: true, expectedOutput: "anything", stdout: "forged" };
  const r = await call("/api/progress/code-task", { token: "tokA", body });
  assert.equal(r.status, 200); assert.equal(r.data.passed, true);
  assert.equal((await call("/api/progress/code-task", { token: "tokA", body: { ...body, bank: "old" } })).status, 409);
  assert.equal((await call("/api/progress/code-task", { token: "tokA", body: { ...body, code: "" } })).status, 400);
  assert.equal((await call("/api/progress/code-task", { token: "tokA", body: { ...body, item: 99 } })).status, 400);
  assert.equal((await call("/api/progress/code-task", { body })).status, 401);
  // provider down / rate limited: 503 retryable, and nothing is recorded for a fresh account
  const down = boot({ fetchImpl: executorFetch({ submit: () => ({ ok: false, status: 429, json: async () => ({}) }) }).f });
  const d = await down.call("/api/progress/code-task", { token: "tokB", body });
  assert.equal(d.status, 503); assert.equal(d.data.retryable, true);
  assert.deepEqual((await down.call("/api/progress/get", { token: "tokB" })).data.codeTasks, {});
});
test("executor: one bounded retry only when no verdict came back; a real verdict is never retried", async () => {
  const { sb } = boot();
  let posts = 0;
  const fetchFn = async (u, o) => { if (o && o.method === "POST") { posts++; throw new Error("net"); } return { ok: true, status: 200, json: async () => ({}) }; };
  const r = await sb.executeForVerification({}, "python", "print(1)", "", fetchFn);
  assert.equal(r.ok, false); assert.equal(posts, 2);
  let p2 = 0;
  const fin = async (u, o) => (o && o.method === "POST" ? (p2++, { ok: true, status: 201, json: async () => ({ token: "t" }) }) : { ok: true, status: 200, json: async () => ({ status: { id: 6 }, stdout: "" }) });
  const c = await sb.executeForVerification({}, "cpp", "bad", "", fin);
  assert.equal(c.reason, "status_6"); assert.equal(p2, 1);
});
test("practice-task over HTTP: wrong approach spends no executor run; correct approach is verified", async () => {
  const pid = "py-1-1", pr = practice[pid].practice;
  const ex = executorFetch({ poll: () => ({ ok: true, status: 200, json: async () => ({ status: { id: 3 }, stdout: pr.cases[0].stdout + "\n" }) }) });
  const { call } = boot({ fetchImpl: ex.f });
  const body = { language: "python", lessonId: pid, phase: "practice", bank: pr.h, code: 'print("Ready")' };
  const wrong = await call("/api/progress/practice-task", { token: "tokA", body: { ...body, code: 'print("Nope")' } });
  assert.equal(wrong.data.passed, false); assert.equal(ex.log.length, 0);
  const ok = await call("/api/progress/practice-task", { token: "tokA", body });
  assert.equal(ok.data.passed, true); assert.ok(ex.log.length >= 2);
  assert.equal((await call("/api/progress/practice-task", { token: "tokA", body: { ...body, bank: "old" } })).status, 409);
  assert.equal((await call("/api/progress/practice-task", { token: "tokA", body: { ...body, phase: "worked" } })).status, 400);
});
