"use strict";

// Completion requirements reflect the existing lesson flows:
// Python lessons are practical challenges; Java lessons require both checks;
// JavaScript and C++ lessons are completed by their server-verified quiz.
const COMPLETION_POLICY = Object.freeze({
  python: Object.freeze({ challengeRequired: true, quizRequired: false }),
  javascript: Object.freeze({ challengeRequired: false, quizRequired: true }),
  cpp: Object.freeze({ challengeRequired: false, quizRequired: true }),
  java: Object.freeze({ challengeRequired: true, quizRequired: true })
});

function isValidLessonCompletionProof(uid, lessonId, lesson, proof) {
  if (!proof || typeof proof !== "object" || !lesson) return false;

  const policy = COMPLETION_POLICY[lesson.language];
  if (!policy) return false;

  const baseValid =
    proof.verificationVersion === 1 &&
    proof.serverVerified === true &&
    proof.passed === true &&
    proof.uid === uid &&
    proof.lessonId === lessonId &&
    proof.language === lesson.language &&
    proof.chapter === lesson.chapter &&
    proof.lesson === lesson.lesson;

  if (!baseValid) return false;

  const challengeVerified = proof.challengeVerified === true;
  // Older quiz-only JS/C++ proofs were server-written before quizVerified
  // was introduced. Preserve those valid records without trusting client data.
  const quizVerified = proof.quizVerified === true ||
    (!policy.challengeRequired && proof.passed === true);

  return (!policy.challengeRequired || challengeVerified) &&
    (!policy.quizRequired || quizVerified);
}

module.exports = { COMPLETION_POLICY, isValidLessonCompletionProof };
