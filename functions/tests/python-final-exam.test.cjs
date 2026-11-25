const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadExamValidator() {
  const source = fs.readFileSync(path.join(__dirname, "..", "index.js"), "utf8");
  const start = source.indexOf("const PYTHON_FINAL_EXAM_ANSWER_KEY");
  const end = source.indexOf("exports.recordPythonFinalExam", start);
  assert.notEqual(start, -1, "server-side answer key must exist");
  assert.notEqual(end, -1, "server-side exam validator must exist");
  const snippet = source.slice(start, end) + "\nmodule.exports = { validatePythonFinalExamSubmission, answerKey: PYTHON_FINAL_EXAM_ANSWER_KEY };";
  const context = { module: { exports: {} }, Set, Number, Math, Object, Array };
  vm.runInNewContext(snippet, context, { filename: "python-final-exam-validator.js" });
  return context.module.exports;
}

const { validatePythonFinalExamSubmission, answerKey } = loadExamValidator();

test("accepts a valid 15-question submission at the 80% threshold", () => {
  const questionIds = Array.from({ length: 15 }, (_, index) => index);
  const selectedAnswers = questionIds.map(id => answerKey[id]);
  selectedAnswers[14] = (answerKey[14] + 1) % 4;
  const result = validatePythonFinalExamSubmission(questionIds, selectedAnswers);
  assert.equal(result.valid, true);
  assert.equal(result.score, 14);
  assert.equal(result.total, 15);
  assert.equal(result.percentage, 93);
  assert.equal(result.passed, true);
});

test("rejects a submission below the passing threshold", () => {
  const questionIds = Array.from({ length: 15 }, (_, index) => index);
  const selectedAnswers = questionIds.map(id => (answerKey[id] + 1) % 4);
  const result = validatePythonFinalExamSubmission(questionIds, selectedAnswers);
  assert.equal(result.valid, true);
  assert.equal(result.passed, false);
  assert.equal(result.percentage, 0);
});

test("rejects duplicate IDs and non-15-question submissions", () => {
  const questionIds = Array.from({ length: 15 }, (_, index) => index);
  const selectedAnswers = questionIds.map(id => answerKey[id]);
  const duplicateIds = [...questionIds];
  duplicateIds[14] = duplicateIds[0];
  assert.equal(validatePythonFinalExamSubmission(duplicateIds, selectedAnswers).valid, false);
  assert.equal(validatePythonFinalExamSubmission(questionIds.slice(0, 14), selectedAnswers.slice(0, 14)).valid, false);
});

test("rejects invalid question IDs and answer indexes", () => {
  const questionIds = Array.from({ length: 15 }, (_, index) => index);
  const selectedAnswers = questionIds.map(id => answerKey[id]);
  const invalidIds = [...questionIds];
  invalidIds[0] = 99;
  assert.equal(validatePythonFinalExamSubmission(invalidIds, selectedAnswers).valid, false);
  const invalidAnswers = [...selectedAnswers];
  invalidAnswers[0] = 4;
  assert.equal(validatePythonFinalExamSubmission(questionIds, invalidAnswers).valid, false);
});
