import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import * as core from "../progress-core.js";
const index = JSON.parse(fs.readFileSync(new URL("../curriculum-index.json", import.meta.url), "utf8"));
const ids = lang => Object.keys(index.lessons).filter(k => index.lessons[k].language === lang);
const NOW = 1_800_000_000_000;
const base = (lang, i = 0) => ({ language: lang, lessonId: ids(lang)[i], phase: "practice", draft: "print(1)", savedAt: NOW });
test("newer checkpoint wins, older device cannot overwrite", () => {
  const s = core.emptyState();
  assert.equal(core.saveResume(s, index, { ...base("python"), savedAt: NOW }, NOW).stale, false);
  const old = core.saveResume(s, index, { ...base("python", 1), draft: "OLD", savedAt: NOW - 1000 }, NOW);
  assert.equal(old.stale, true);
  assert.equal(old.resume.draft, "print(1)");
  assert.equal(core.saveResume(s, index, { ...base("python", 1), draft: "NEW", savedAt: NOW + 1 }, NOW + 5).stale, false);
  assert.equal(s.resume.python.draft, "NEW");
});
test("languages are separate", () => {
  const s = core.emptyState();
  core.saveResume(s, index, base("python"), NOW);
  core.saveResume(s, index, { ...base("javascript"), draft: "let a" }, NOW);
  assert.equal(s.resume.python.draft, "print(1)");
  assert.equal(s.resume.javascript.draft, "let a");
});
test("validation: lesson of another language, huge draft, bad phase, future time", () => {
  const s = core.emptyState();
  assert.equal(core.saveResume(s, index, { ...base("python"), lessonId: ids("javascript")[0] }, NOW).reason, "unknown_lesson");
  assert.equal(core.saveResume(s, index, { ...base("python"), draft: "x".repeat(20001) }, NOW).reason, "bad_draft");
  assert.equal(core.saveResume(s, index, { ...base("python"), phase: "hax" }, NOW).reason, "bad_phase");
  assert.equal(core.saveResume(s, index, { ...base("python"), savedAt: NOW + 3600_000 }, NOW).reason, "bad_time");
  assert.equal(core.saveResume(s, index, { ...base("python"), draft: 5 }, NOW).reason, "bad_draft");
  assert.deepEqual(s.resume, {});
});
test("completing the lesson deletes the draft (actual state)", () => {
  const s = core.emptyState();
  core.saveResume(s, index, base("python"), NOW);
  assert.equal(s.resume.python.draft, "print(1)");
  core.recordLesson(s, index, { language: "python", lessonId: ids("python")[0], version: "v1" });
  assert.equal(s.resume.python.draft, "");
  assert.equal(JSON.stringify(s).includes("print(1)"), false);
});
test("drafts expire after 30 days: hidden on read and physically purged", () => {
  const s = core.emptyState();
  core.saveResume(s, index, base("python"), NOW);
  const later = NOW + 31 * 24 * 3600 * 1000;
  assert.equal(core.resumeView(s, later).python.draft, "");
  assert.equal(core.resumeView(s, later).python.lessonId, ids("python")[0]);
  assert.equal(core.purgeExpired(s, later), 1);
  assert.equal(JSON.stringify(s).includes("print(1)"), false);
});
test("Durable Object resume: save, get, stale, 429 cap reports retryable, never touches exam scoring", async () => {
  let source = fs.readFileSync(new URL("../worker.js", import.meta.url), "utf8");
  source = source.replace(/^import .*;$/gm, "").replace("export default {", "globalThis.worker = {").replace(/export class (\w+)/g, "globalThis.$1 = class $1");
  const sb = { globalThis: null, URL, Response, console, ...core, CURRICULUM_INDEX: index, createRemoteJWKSet() {}, jwtVerify() {}, Date, JSON, Number, Promise, TextEncoder, Request, Headers };
  sb.globalThis = sb; vm.runInNewContext(source, sb);
  const m = new Map();
  const st = { storage: { async transaction(fn) { return fn({ get: async k => m.has(k) ? JSON.parse(JSON.stringify(m.get(k))) : undefined, put: async (k, v) => { m.set(k, JSON.parse(JSON.stringify(v))); } }); } } };
  const o = new sb.StudentProgress(st);
  const call = (a, b) => o.fetch(new Request(`https://p.internal/${a}`, { method: "POST", body: JSON.stringify(b) })).then(async r => ({ status: r.status, data: await r.json() }));
  const t = Date.now();
  const r1 = await call("resume", { ...base("python"), savedAt: t });
  assert.equal(r1.status, 200);
  const g = await call("get", {});
  assert.equal(g.data.resume.python.draft, "print(1)");
  assert.equal(JSON.stringify(g.data).includes("uid"), false);
  assert.equal((await call("resume", { ...base("python"), draft: "OLD", savedAt: t - 5000 })).data.stale, true);
  assert.equal(JSON.stringify(m.get("state").exams), "{}");
  let last;
  for (let i = 1; i < 620; i++) last = await call("resume", { ...base("python"), draft: "d" + i, savedAt: t + i });
  assert.equal(last.status, 429);
  assert.equal(last.data.retryable, true);
  // the last accepted draft is intact, nothing silently replaced
  assert.equal((await call("get", {})).data.resume.python.draft, "d599");
  // resume quota does not consume the lesson/exam quota
  assert.equal((await call("lesson", { language: "python", lessonId: ids("python")[0], version: "v1" })).status, 200);
});
