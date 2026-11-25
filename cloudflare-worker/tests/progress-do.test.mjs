import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { emptyState, recordLesson, recordExam, recordLessonTest, certificateEligibility, codeTaskTests, recordCodeTask, saveResume, purgeExpired, resumeView } from "../progress-core.js";
const index = JSON.parse(fs.readFileSync(new URL("../curriculum-index.json", import.meta.url), "utf8"));
function load() {
  let source = fs.readFileSync(new URL("../worker.js", import.meta.url), "utf8");
  source = source.replace(/^import .*;$/gm, "").replace("export default {", "globalThis.worker = {").replace(/export class (\w+)/g, "globalThis.$1 = class $1");
  const sandbox = { globalThis: null, AbortSignal, setTimeout, codeTaskTests, recordCodeTask, recordLessonTest, certificateEligibility, LESSON_ANSWERS: JSON.parse(fs.readFileSync(new URL("../lesson-answers.json", import.meta.url), "utf8")), URL, Response, console, emptyState, recordLesson, recordExam, saveResume, purgeExpired, resumeView, CURRICULUM_INDEX: index, createRemoteJWKSet() {}, jwtVerify() {}, Date, JSON, Number, Promise, TextEncoder, Request, Headers, fetch: undefined };
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
  const a = await call(o, "exam", { language: "python", unit: 1, bank: quiz.h, version: "v1", choices: quiz.mcq.map(m => m.answer), percent: 100, passed: true });
  assert.equal(a.status, 200);
  assert.equal(a.data.codeVerified, false);
  assert.ok(a.data.percent < 100);
  const g = await call(o, "get", {});
  assert.deepEqual(Object.keys(g.data).sort(), ["codeTasks", "exams", "lessonTests", "lessons", "resume", "success"]);
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
test("Durable Object grades a lesson test server-side and reports eligibility blockers", async () => {
  const { StudentProgress } = load();
  const key = JSON.parse(fs.readFileSync(new URL("../lesson-answers.json", import.meta.url), "utf8"));
  const o = new StudentProgress(fakeState());
  const bad = await call(o, "lessontest", { language: "python", lessonId: "py-1-1", version: "v1", bank: key["py-1-1"].h, picks: [0, 0, 0, 0], percent: 100, passed: true });
  assert.equal(bad.status, 200);
  const good = await call(o, "lessontest", { language: "python", lessonId: "py-1-1", version: "v1", bank: key["py-1-1"].h, picks: key["py-1-1"].a });
  assert.equal(good.data.passed, true);
  const g = await call(o, "get", {});
  assert.equal(g.data.lessonTests["py-1-1"].passed, true);
  const e = await call(o, "eligibility", { language: "python" });
  assert.equal(e.data.eligible, false);
  assert.equal(JSON.stringify(e.data).includes("uid"), false);
});
test("Durable Object answers 409 refresh-needed for a stale bank and keeps the stored pass", async () => {
  const { StudentProgress } = load();
  const key = JSON.parse(fs.readFileSync(new URL("../lesson-answers.json", import.meta.url), "utf8"));
  const o = new StudentProgress(fakeState());
  assert.equal((await call(o, "lessontest", { language: "python", lessonId: "py-1-1", version: "v1", bank: key["py-1-1"].h, picks: key["py-1-1"].a })).data.passed, true);
  const stale = await call(o, "lessontest", { language: "python", lessonId: "py-1-1", version: "v1", bank: "old", picks: key["py-1-1"].a });
  assert.equal(stale.status, 409); assert.equal(stale.data.refreshNeeded, true);
  assert.equal((await call(o, "exam", { language: "python", unit: 1, version: "v1", bank: "old", choices: [0, 0, 0] })).status, 409);
  assert.equal((await call(o, "get", {})).data.lessonTests["py-1-1"].passed, true);
});

test("executeForVerification is fail-closed: unreachable, rejected, timeout or non-accepted never count as ok", async () => {
  const { executeForVerification } = load();
  const ok = (data, status = 200) => ({ ok: status < 400, status, json: async () => data });
  assert.equal((await executeForVerification({}, "python", "print(1)", "", async () => { throw new Error("net"); })).ok, false);
  assert.equal((await executeForVerification({}, "python", "print(1)", "", async () => ok({}, 429))).reason, "submit_429");
  assert.equal((await executeForVerification({}, "ruby", "x", "")).reason, "bad_input");
  assert.equal((await executeForVerification({}, "python", "   ", "")).reason, "bad_input");
  let n = 0;
  const f = async (u) => (n++ === 0 ? ok({ token: "t" }) : ok({ status: { id: 3 }, stdout: "9\nGo\n" }));
  const good = await executeForVerification({}, "python", "print(9)", "", f);
  assert.equal(good.ok, true); assert.equal(good.stdout, "9\nGo\n");
  let m = 0;
  const bad = await executeForVerification({}, "python", "x", "", async () => (m++ === 0 ? ok({ token: "t" }) : ok({ status: { id: 6 }, stdout: "" })));
  assert.equal(bad.ok, false); assert.equal(bad.reason, "status_6");
});
test("Durable Object records a code task only from server results, enforces bank + daily run budget", async () => {
  const { StudentProgress } = load();
  const q = index.quizzes["python-1"];
  const o = new StudentProgress(fakeState());
  const base = { language: "python", unit: 1, item: 0, bank: q.h, version: "v1" };
  const wrong = await call(o, "codetask", { ...base, results: [{ ok: true, stdout: "nope" }] });
  assert.equal(wrong.data.passed, false);
  const right = await call(o, "codetask", { ...base, results: q.code[0].tests.map(t => ({ ok: true, stdout: t.expected + "\n" })) });
  assert.equal(right.data.passed, true);
  const later = await call(o, "codetask", { ...base, results: [{ ok: false, stdout: "" }] });
  assert.equal(later.data.best.passed, true);
  assert.equal((await call(o, "codetask", { ...base, bank: "old", results: [] })).status, 409);
  assert.equal((await call(o, "codetask", { ...base, item: 9, results: [] })).status, 400);
  assert.equal((await call(o, "codebegin", { n: 10 })).status, 200);
  assert.equal((await call(o, "codebegin", { n: 10 })).status, 200);
  assert.equal((await call(o, "codebegin", { n: 1 })).status, 429);
  assert.equal((await call(o, "codebegin", { n: 0 })).status, 400);
});
