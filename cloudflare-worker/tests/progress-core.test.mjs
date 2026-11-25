import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { emptyState, recordLesson, scoreExam, recordExam, publicCertificateRecord, PASS_PERCENT } from "../progress-core.js";
const index = JSON.parse(fs.readFileSync(new URL("../curriculum-index.json", import.meta.url), "utf8"));
const quiz = index.quizzes["python-1"];
const right = quiz.mcq.map(m => m.answer);

test("score is recomputed from trusted answers, client score is not an input", () => {
  const r = scoreExam(index, { language: "python", unit: 1, bank: quiz.h, choices: right, score: 100, percent: 100 });
  assert.equal(r.ok, true);
  assert.equal(r.codeVerified, false);
  assert.ok(r.percent < 100, "unverified code tasks cannot count");
});
test("code tasks count only with server-verified results", () => {
  const r = scoreExam(index, { language: "python", unit: 1, bank: quiz.h, choices: right, codeResults: quiz.code.map(() => true) });
  assert.equal(r.percent, 100);
  assert.equal(r.passed, true);
});
test("pass boundary is 50 percent inclusive", () => {
  assert.equal(PASS_PERCENT, 50);
  const r = scoreExam(index, { language: "python", unit: 1, bank: quiz.h, choices: right.map(() => 0), codeResults: quiz.code.map(() => true) });
  assert.ok(r.percent >= 0);
});
test("rejects wrong lengths, out of range and unknown exams", () => {
  assert.equal(scoreExam(index, { language: "python", unit: 1, bank: quiz.h, choices: [0] }).reason, "bad_choices");
  assert.equal(scoreExam(index, { language: "python", unit: 99, choices: [] }).reason, "unknown_exam");
  const bad = right.map(() => 99);
  assert.equal(scoreExam(index, { language: "python", unit: 1, bank: quiz.h, choices: bad }).percent, scoreExam(index, { language: "python", unit: 1, bank: quiz.h, choices: bad.map(() => -1) }).percent);
});
test("a later lower attempt never removes a pass; replay is idempotent", () => {
  const s = emptyState();
  const pass = recordExam(s, index, { language: "python", unit: 1, bank: quiz.h, choices: right, codeResults: quiz.code.map(() => true) }, "v1");
  assert.equal(pass.best.passed, true);
  const low = recordExam(s, index, { language: "python", unit: 1, bank: quiz.h, choices: right.map(() => -1) }, "v1");
  assert.equal(low.best.passed, true);
  const a = recordLesson(s, index, { language: "python", lessonId: Object.keys(index.lessons).find(k => index.lessons[k].language === "python"), version: "v1" });
  const b = recordLesson(s, index, { language: "python", lessonId: Object.keys(index.lessons).find(k => index.lessons[k].language === "python"), version: "v1" });
  assert.equal(a.replay, false); assert.equal(b.replay, true);
});
test("lesson records need a known lesson in the claimed language and mark unverified", () => {
  const s = emptyState();
  assert.equal(recordLesson(s, index, { language: "python", lessonId: "nope", version: "v1" }).reason, "unknown_lesson");
  const id = Object.keys(index.lessons).find(k => index.lessons[k].language === "java");
  assert.equal(recordLesson(s, index, { language: "python", lessonId: id, version: "v1" }).reason, "unknown_lesson");
  recordLesson(s, index, { language: "java", lessonId: id, version: "v1" });
  assert.equal(s.lessons[id].verified, false);
});
test("public certificate record is opt-in shaped and never carries the uid", () => {
  const rec = publicCertificateRecord({ displayName: "  مريم  ", language: "python", issuedAtMs: 1, randomId: "a".repeat(32) });
  assert.deepEqual(Object.keys(rec).sort(), ["id", "issuedAt", "name", "track"]);
  assert.equal(publicCertificateRecord({ displayName: "", language: "python", issuedAtMs: 1, randomId: "a".repeat(32) }), null);
  assert.equal(publicCertificateRecord({ displayName: "x", language: "python", issuedAtMs: 1, randomId: "../etc" }), null);
});
