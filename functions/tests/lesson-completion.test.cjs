const test = require("node:test");
const assert = require("node:assert/strict");
const { isValidLessonCompletionProof } = require("../lesson-completion");

function proof(language, extra = {}) {
  return {
    verificationVersion: 1,
    serverVerified: true,
    passed: true,
    uid: "student-test",
    lessonId: language + "_0_0",
    language,
    chapter: 0,
    lesson: 0,
    ...extra
  };
}
function valid(language, record) {
  return isValidLessonCompletionProof(
    "student-test",
    language + "_0_0",
    { language, chapter: 0, lesson: 0 },
    record
  );
}

test("Python quiz success alone cannot complete a practical lesson", () => {
  assert.equal(valid("python", proof("python", { quizVerified: true })), false);
});

test("Python challenge proof completes the challenge-only policy", () => {
  assert.equal(valid("python", proof("python", { challengeVerified: true })), true);
});

test("JavaScript and C++ quiz proofs remain sufficient", () => {
  for (const language of ["javascript", "cpp"]) {
    assert.equal(valid(language, proof(language, { quizVerified: true })), true);
  }
});

test("Java requires both the practical challenge and the quiz", () => {
  assert.equal(valid("java", proof("java", { challengeVerified: true })), false);
  assert.equal(valid("java", proof("java", { quizVerified: true })), false);
  assert.equal(valid("java", proof("java", {
    challengeVerified: true, quizVerified: true
  })), true);
});

test("proofs with mismatched UID, lesson identity, or version are rejected", () => {
  for (const invalid of [
    proof("python", { challengeVerified: true, uid: "other" }),
    proof("python", { challengeVerified: true, lesson: 1 }),
    proof("python", { challengeVerified: true, lessonId: "python_0_1" }),
    proof("python", { challengeVerified: true, verificationVersion: 2 })
  ]) {
    assert.equal(valid("python", invalid), false);
  }
});

test("legacy server quiz proofs remain compatible for quiz-only curricula", () => {
  for (const language of ["javascript", "cpp"]) {
    assert.equal(valid(language, proof(language)), true);
  }
});
