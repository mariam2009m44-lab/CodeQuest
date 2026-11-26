import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { lessonBankHash, quizBankHash } from "../bank-hash.js";
import { practicePlan, recordPractice } from "../progress-core.js";
import { checkIntroConcept } from "../studio/concept.mjs";
import { emptyState, gradeLessonTest, recordLessonTest, certificateEligibility, scoreExam } from "../progress-core.js";
const rd = f => JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8"));
const practice = rd("../practice-index.json"), index = rd("../curriculum-index.json"), key = rd("../lesson-answers.json"), bank = rd("../../learning-studio/lesson-tests.json");
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
test("eligibility (owner rule 10:33 PM Nov 26): every unit exam passed, plus the python final for python; lesson tests, code tasks and practice are NOT required", () => {
  const s = emptyState();
  let e = certificateEligibility(s, index, "java");
  assert.equal(e.eligible, false);
  assert.deepEqual(e.blockers.map(b => b.code), ["unit_exams"]);
  assert.ok(e.blockers.some(b => b.code === "unit_exams" && b.of === 8 && b.remaining === 8));
  assert.ok(certificateEligibility(s, index, "python").blockers.some(b => b.code === "final_exam"));
  for (const q of Object.keys(index.quizzes).filter(k => k.startsWith("python-"))) s.exams[q] = { passed: true, percent: 50 };
  e = certificateEligibility(s, index, "python", practice);
  assert.deepEqual(e.blockers.map(b => b.code), ["final_exam"]);
  s.finals = { python: { passed: true } };
  e = certificateEligibility(s, index, "python", practice);
  assert.equal(e.eligible, true, "no lesson tests, no code tasks, no practice recorded");
  for (const q of Object.keys(index.quizzes).filter(k => k.startsWith("java-")).slice(0, 7)) s.exams[q] = { passed: true };
  e = certificateEligibility(s, index, "java");
  assert.equal(e.eligible, false); assert.equal(e.blockers[0].remaining, 1);
  s.exams["java-8"] = { passed: false, percent: 40 };
  assert.equal(certificateEligibility(s, index, "java").eligible, false, "a failed exam does not count");
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

test("practice: server-owned cases, bank hash, concept gate and execution both required; a pass is never overwritten", () => {
  const id = "py-1-1", base = { language: "python", lessonId: id, phase: "practice", bank: practice[id].practice.h };
  const c = practice[id].practice.cases;
  const good = c.map(x => ({ ok: true, stdout: x.stdout + "\n" }));
  const s = emptyState();
  assert.equal(recordPractice(s, practice, { ...base, conceptApproved: true, results: good }, "v1").passed, true);
  const s2 = emptyState();
  assert.equal(recordPractice(s2, practice, { ...base, conceptApproved: false, results: good }, "v1").passed, false);
  assert.equal(recordPractice(s2, practice, { ...base, conceptApproved: true, results: [{ ok: true, stdout: "wrong" }] }, "v1").passed, false);
  assert.equal(recordPractice(s2, practice, { ...base, conceptApproved: true, results: [{ ok: false, stdout: c[0].stdout }] }, "v1").passed, false);
  assert.equal(recordPractice(s, practice, { ...base, conceptApproved: false, results: [] }, "v1").best.passed, true);
  assert.equal(recordPractice(s, practice, { ...base, bank: "old", conceptApproved: true, results: good }, "v1").refresh, true);
  assert.equal(practicePlan(practice, { ...base, language: "java" }).ok, false);
  assert.equal(practicePlan(practice, { ...base, phase: "worked" }).ok, false);
});
test("every reference solution passes the concept gate (so a correct learner path is not blocked by the server)", () => {
  const units = rd("../../learning-studio/units.json"); let n = 0;
  for (const un of units) for (const ls of un.lessons) for (const ph of ["practice", "transfer"]) {
    const st = ls.steps.find(x => x.type === ph);
    const r = checkIntroConcept({ lesson: { id: ls.id, steps: [{ type: ph, referenceSolution: st.referenceSolution, conceptRubric: "" }] }, phase: ph, code: st.referenceSolution, language: un.language });
    assert.equal(r.approved, true, ls.id + " " + ph); n += 1;
  }
  assert.equal(n, 238);
});
test("worker copies of the studio concept checker match the public ones byte for byte", () => {
  for (const f of ["concept.mjs", "intro-runner.mjs"]) assert.equal(fs.readFileSync(new URL("../studio/" + f, import.meta.url), "utf8"), fs.readFileSync(new URL("../../learning-studio/" + f, import.meta.url), "utf8"), f);
  const units = rd("../../learning-studio/units.json"), p = rd("../practice-index.json");
  assert.equal(Object.keys(p).length, units.reduce((n, u) => n + u.lessons.length, 0));
});
test("python final exam: 15 answers, 8 passes and 7 fails, distinct known ids only, stale id means refresh", async () => {
  const { scoreFinalExam, recordFinalExam } = await import("../progress-core.js");
  const def = rd("../python-final.json"), ids = Object.keys(def.questions);
  assert.equal(def.size, 15); assert.equal(ids.length, 31);
  const mk = n => ids.slice(0, 15).map((id, i) => ({ id, pick: i < n ? def.questions[id].a : (def.questions[id].a + 1) % def.questions[id].n }));
  assert.equal(scoreFinalExam(def, { language: "python", answers: mk(8) }).passed, true);
  assert.equal(scoreFinalExam(def, { language: "python", answers: mk(7) }).passed, false);
  assert.equal(scoreFinalExam(def, { language: "python", answers: mk(15), score: 0 }).earned, 15);
  const dup = mk(15); dup[1] = dup[0]; assert.equal(scoreFinalExam(def, { language: "python", answers: dup }).reason, "bad_answers");
  assert.equal(scoreFinalExam(def, { language: "python", answers: mk(15).slice(0, 14) }).reason, "bad_answers");
  const stale = mk(15); stale[2] = { id: "0".repeat(14), pick: 0 }; assert.equal(scoreFinalExam(def, { language: "python", answers: stale }).refresh, true);
  const oor = mk(15); oor[0].pick = 9; assert.equal(scoreFinalExam(def, { language: "python", answers: oor }).reason, "bad_answers");
  assert.equal(scoreFinalExam(def, { language: "java", answers: mk(15) }).ok, false);
  const s = emptyState();
  recordFinalExam(s, def, { language: "python", answers: mk(15) }, "v1");
  recordFinalExam(s, def, { language: "python", answers: mk(0) }, "v1");
  assert.equal(s.finals.python.passed, true);
});
test("python final pool equals the page it was built from (no drift)", () => {
  const html = fs.readFileSync(new URL("../../python-exam.html", import.meta.url), "utf8");
  assert.match(html, /const PASS_PERCENTAGE = 50;/); assert.match(html, /const EXAM_SIZE = 15;/);
  assert.equal((html.match(/\n        a: \d+,/g) || []).length, 31);
});
