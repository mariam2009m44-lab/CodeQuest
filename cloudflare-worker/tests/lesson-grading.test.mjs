import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { emptyState, gradeLessonTest, recordLessonTest, certificateEligibility } from "../progress-core.js";
const rd = f => JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8"));
const index = rd("../curriculum-index.json"), key = rd("../lesson-answers.json"), bank = rd("../../learning-studio/lesson-tests.json");
const id = "py-1-1";
test("answer key matches the public bank for all 119 lessons (476 questions)", () => {
  assert.equal(Object.keys(key).length, 119);
  let n = 0;
  for (const [k, v] of Object.entries(bank)) { assert.deepEqual(key[k], v.map(q => q.answer)); n += v.length; }
  assert.equal(n, 476);
  assert.deepEqual(Object.keys(key).sort(), Object.keys(index.lessons).sort());
});
test("2 of 4 passes, 1 of 4 fails, unanswered blocks a pass, forged score ignored", () => {
  const a = key[id], wrong = x => (x + 1) % 3;
  const mk = n => a.map((x, i) => i < n ? x : wrong(x));
  assert.equal(gradeLessonTest(index, key, { language: "python", lessonId: id, picks: mk(2), score: 100 }).passed, true);
  assert.equal(gradeLessonTest(index, key, { language: "python", lessonId: id, picks: mk(1) }).passed, false);
  assert.equal(gradeLessonTest(index, key, { language: "python", lessonId: id, picks: [a[0], a[1], null, null] }).passed, false);
  assert.equal(gradeLessonTest(index, key, { language: "python", lessonId: id, picks: [a[0], a[1], a[2], null] }).passed, false);
});
test("rejects bad input, wrong language, wrong length, out-of-range picks", () => {
  const g = p => gradeLessonTest(index, key, p);
  assert.equal(g({ language: "java", lessonId: id, picks: [0, 0, 0, 0] }).ok, false);
  assert.equal(g({ language: "python", lessonId: "nope", picks: [0, 0, 0, 0] }).ok, false);
  assert.equal(g({ language: "python", lessonId: id, picks: [0, 0] }).ok, false);
  assert.equal(g({ language: "python", lessonId: id, picks: [0, 0, 0, 7] }).ok, false);
  assert.equal(g({ language: "python", lessonId: id, picks: "x" }).ok, false);
});
test("best result kept, a later fail never removes a pass", () => {
  const s = emptyState(), a = key[id];
  assert.equal(recordLessonTest(s, index, key, { language: "python", lessonId: id, picks: a }, "v1").best.passed, true);
  const r = recordLessonTest(s, index, key, { language: "python", lessonId: id, picks: a.map(x => (x + 1) % 3) }, "v1");
  assert.equal(r.result.passed, false); assert.equal(r.best.passed, true); assert.equal(s.lessonTests[id].passed, true);
  assert.equal(recordLessonTest(s, index, key, { language: "python", lessonId: id, picks: a }, "").ok, false);
});
test("eligibility needs every lesson test, unit exam, python final, and server-verified code tasks", () => {
  const s = emptyState();
  let e = certificateEligibility(s, index, "java");
  assert.equal(e.eligible, false);
  assert.ok(e.blockers.some(b => b.code === "lesson_tests" && b.of === 22));
  assert.ok(e.blockers.some(b => b.code === "unit_exams" && b.of === 8));
  assert.equal(e.blockers.some(b => b.code === "final_exam"), false);
  assert.ok(certificateEligibility(s, index, "python").blockers.some(b => b.code === "final_exam"));
  for (const k of Object.keys(key)) s.lessonTests = { ...(s.lessonTests || {}), [k]: { passed: true, percent: 100 } };
  for (const q of Object.keys(index.quizzes)) s.exams[q] = { passed: true, percent: 100 };
  s.finals = { python: { passed: true } };
  e = certificateEligibility(s, index, "python");
  assert.equal(e.eligible, false);
  assert.deepEqual(e.blockers.map(b => b.code), ["code_tasks_not_server_verified"]);
  assert.equal(certificateEligibility(s, index, "ruby").eligible, false);
});
