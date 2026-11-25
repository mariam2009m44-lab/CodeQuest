import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { emptyState, recordLesson, recordExam } from "../progress-core.js";
const index = JSON.parse(fs.readFileSync(new URL("../curriculum-index.json", import.meta.url), "utf8"));
function load() {
  let source = fs.readFileSync(new URL("../worker.js", import.meta.url), "utf8");
  source = source.replace(/^import .*;$/gm, "").replace("export default {", "globalThis.worker = {").replace(/export class (\w+)/g, "globalThis.$1 = class $1");
  const sandbox = { globalThis: null, URL, Response, console, emptyState, recordLesson, recordExam, CURRICULUM_INDEX: index, createRemoteJWKSet() {}, jwtVerify() {}, Date, JSON, Number, Promise, TextEncoder, Request, Headers, fetch: undefined };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox);
  return sandbox;
}
function fakeState() {
  const m = new Map();
  return { storage: { async transaction(fn) { return fn({ get: async k => m.has(k) ? JSON.parse(JSON.stringify(m.get(k))) : undefined, put: async (k, v) => { m.set(k, JSON.parse(JSON.stringify(v))); } }); } }, m };
}
const call = (o, action, body) => o.fetch(new Request(`https://progress.internal/${action}`, { method: "POST", body: JSON.stringify(body) })).then(async r => ({ status: r.status, data: await r.json() }));
const quiz = index.quizzes["python-1"];
test("Durable Object stores best exam, never trusts a client score, and returns no uid", async () => {
  const { StudentProgress } = load();
  const st = fakeState(); const o = new StudentProgress(st);
  const a = await call(o, "exam", { language: "python", unit: 1, version: "v1", choices: quiz.mcq.map(m => m.answer), percent: 100, passed: true });
  assert.equal(a.status, 200);
  assert.equal(a.data.codeVerified, false);
  assert.ok(a.data.percent < 100);
  const g = await call(o, "get", {});
  assert.deepEqual(Object.keys(g.data).sort(), ["exams", "lessons", "success"]);
  assert.equal(JSON.stringify(g.data).includes("uid"), false);
});
test("Durable Object rejects bad input and enforces the daily write cap", async () => {
  const { StudentProgress } = load();
  const st = fakeState(); const o = new StudentProgress(st);
  assert.equal((await call(o, "lesson", { language: "python", lessonId: "x", version: "v1" })).status, 400);
  const id = Object.keys(index.lessons).find(k => index.lessons[k].language === "python");
  let last;
  for (let i = 0; i < 301; i++) last = await call(o, "lesson", { language: "python", lessonId: id, version: "v" + i });
  assert.equal(last.status, 429);
  assert.equal((await call(o, "nope", {})).status, 404);
});
