import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { lessonBankHash, quizBankHash } from "../bank-hash.js";
import { emptyState, gradeLessonTest, recordLessonTest, certificateEligibility, scoreExam } from "../progress-core.js";
const rd = f => JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8"));
const index = rd("../curriculum-index.json"), key = rd("../lesson-answers.json"), bank = rd("../../learning-studio/lesson-tests.json");
const id = "py-1-1";
test("answer key matches the public bank for all 119 lessons (476 questions)", () => {
  assert.equal(Object.keys(key).length, 119);
  let n = 0;
  for (const [k, v] of Object.entries(bank)) { assert.deepEqual(key[k].a, v.map(q => q.answer)); assert.equal(key[k].h, lessonBankHash(v)); n += v.length; }
  assert.equal(n, 476);
  assert.deepEqual(Object.keys(key).sort(), Object.keys(index.lessons).sort());
});
test("2 of 4 passes, 1 of 4 fails, unanswered blocks a pass, forged score ignored", () => {
  const a = key[id].a, bank = key[id].h, wrong = x => (x + 1) % 3;
  const mk = n => a.map((x, i) => i < n ? x : wrong(x));
  assert.equal(gradeLessonTest(index, key, { language: "python", lessonId: id, bank, picks: mk(2), score: 100 }).passed, true);
  assert.equal(gradeLessonTest(index, key, { language: "python", lessonId: id, bank, picks: mk(1) }).passed, false);
  assert.equal(gradeLessonTest(index, key, { language: "python", lessonId: id, bank, picks: [a[0], a[1], null, null] }).passed, false);
  assert.equal(gradeLessonTest(index, key, { language: "python", lessonId: id, bank, picks: [a[0], a[1], a[2], null] }).passed, false);
});
test("rejects bad input, wrong language, wrong length, out-of-range picks", () => {
  const g = p => gradeLessonTest(index, key, { bank: key[id].h, ...p });
  assert.equal(g({ language: "java", lessonId: id, picks: [0, 0, 0, 0] }).ok, false);
  assert.equal(g({ language: "python", lessonId: "nope", picks: [0, 0, 0, 0] }).ok, false);
  assert.equal(g({ language: "python", lessonId: id, bank, picks: [0, 0] }).ok, false);
  assert.equal(g({ language: "python", lessonId: id, bank, picks: [0, 0, 0, 7] }).ok, false);
  assert.equal(g({ language: "python", lessonId: id, bank, picks: "x" }).ok, false);
});
test("best result kept, a later fail never removes a pass", () => {
  const s = emptyState(), a = key[id].a, bank = key[id].h;
  assert.equal(recordLessonTest(s, index, key, { language: "python", lessonId: id, bank, picks: a }, "v1").best.passed, true);
  const r = recordLessonTest(s, index, key, { language: "python", lessonId: id, bank, picks: a.map(x => (x + 1) % 3) }, "v1");
  assert.equal(r.result.passed, false); assert.equal(r.best.passed, true); assert.equal(s.lessonTests[id].passed, true);
  assert.equal(recordLessonTest(s, index, key, { language: "python", lessonId: id, bank, picks: a }, "").ok, false);
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
test("picks are canonical option indexes, so any display shuffle grades the same", () => {
  const a = key[id].a, bank = key[id].h;
  for (let t = 0; t < 50; t++) {
    const order = [0, 1, 2].sort(() => Math.random() - 0.5); // display positions, never sent
    const clicked = a.map(x => order.indexOf(x)); // learner clicks the right option at some position
    const picks = clicked.map(pos => order[pos]); // client maps the position back to the original index
    assert.deepEqual(picks, a);
    assert.equal(gradeLessonTest(index, key, { language: "python", lessonId: id, bank, picks }).earned, a.length);
  }
});
test("server artifacts are in sync with the public banks (atomic release check)", () => {
  const quizzes = rd("../../learning-studio/quizzes.json");
  for (const [k, q] of Object.entries(quizzes)) assert.equal(index.quizzes[k].h, quizBankHash(q), k);
  assert.equal(fs.readFileSync(new URL("../bank-hash.js", import.meta.url), "utf8"), fs.readFileSync(new URL("../../learning-studio/bank-hash.mjs", import.meta.url), "utf8"));
});
test("stale or missing bank version is refused with refresh_needed, even when old picks would coincide, and nothing is stored", () => {
  const s = emptyState(), a = key[id].a;
  s.lessonTests = { [id]: { passed: true, percent: 100, version: "v1" } };
  for (const bank of [undefined, "", "0".repeat(14), key["py-1-2"].h]) {
    const r = recordLessonTest(s, index, key, { language: "python", lessonId: id, bank, picks: a }, "v1");
    assert.equal(r.ok, false); assert.equal(r.refresh, true);
  }
  assert.deepEqual(s.lessonTests[id], { passed: true, percent: 100, version: "v1" });
  const edited = JSON.parse(JSON.stringify(bank[id])); edited[0].options.reverse(); edited[0].answer = 2 - edited[0].answer;
  assert.notEqual(lessonBankHash(edited), key[id].h);
  const e = JSON.parse(JSON.stringify(bank[id])); e[0].options[0] += " "; assert.notEqual(lessonBankHash(e), key[id].h);
});
test("unit exam requires the matching quiz bank hash", () => {
  const q = index.quizzes["python-1"];
  assert.equal(scoreExam(index, { language: "python", unit: 1, choices: q.mcq.map(m => m.answer) }).reason, "refresh_needed");
  assert.equal(scoreExam(index, { language: "python", unit: 1, choices: q.mcq.map(m => m.answer), bank: q.h }).ok, true);
});
