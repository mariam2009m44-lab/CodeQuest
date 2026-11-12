const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} = require("@firebase/rules-unit-testing");
const {
  doc,
  getDoc,
  setDoc,
  Timestamp
} = require("firebase/firestore");

const projectId = "demo-codequest-audit";
const rules = fs.readFileSync(path.join(__dirname, "..", "..", "firestore.rules"), "utf8");
let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({ projectId, firestore: { rules } });
});

test.after(async () => {
  await testEnv?.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearFirestore();
});

async function seedProof(uid, language, fields = {}) {
  const lessonId = language + "_0_0";
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "users", uid, "quizResults", "lesson_" + lessonId), {
      verificationVersion: 1,
      serverVerified: true,
      passed: true,
      uid,
      lessonId,
      language,
      chapter: 0,
      lesson: 0,
      ...fields
    });
  });
}

function progressData(language) {
  return {
    language,
    chapter: 0,
    lesson: 0,
    completed: true,
    updatedAt: Timestamp.now()
  };
}

test("Firestore rules deny unauthenticated and cross-account progress reads", async () => {
  const owner = testEnv.authenticatedContext("student-one").firestore();
  await assertFails(getDoc(doc(owner, "users", "student-one", "lessonProgress", "python_0_0")));
  const anonymous = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(anonymous, "users", "student-one", "lessonProgress", "python_0_0")));
  const other = testEnv.authenticatedContext("student-two").firestore();
  await assertFails(getDoc(doc(other, "users", "student-one", "lessonProgress", "python_0_0")));
});

test("Python quiz proof alone cannot authorize a practical lesson completion", async () => {
  await seedProof("student-one", "python", { quizVerified: true });
  const db = testEnv.authenticatedContext("student-one").firestore();
  await assertFails(setDoc(
    doc(db, "users", "student-one", "lessonProgress", "python_0_0"),
    progressData("python")
  ));
});

test("Python challenge proof authorizes completion without requiring a quiz", async () => {
  await seedProof("student-one", "python", { challengeVerified: true });
  const db = testEnv.authenticatedContext("student-one").firestore();
  await assertSucceeds(setDoc(
    doc(db, "users", "student-one", "lessonProgress", "python_0_0"),
    progressData("python")
  ));
});

test("Java requires both practical challenge and quiz proofs", async () => {
  await seedProof("student-one", "java", { challengeVerified: true });
  const db = testEnv.authenticatedContext("student-one").firestore();
  await assertFails(setDoc(
    doc(db, "users", "student-one", "lessonProgress", "java_0_0"),
    progressData("java")
  ));
  await seedProof("student-one", "java", {
    challengeVerified: true,
    quizVerified: true
  });
  await assertSucceeds(setDoc(
    doc(db, "users", "student-one", "lessonProgress", "java_0_0"),
    progressData("java")
  ));
});

test("JavaScript and C++ remain quiz-completed curricula", async () => {
  for (const language of ["javascript", "cpp"]) {
    await seedProof("student-one", language, { quizVerified: true });
    const db = testEnv.authenticatedContext("student-one").firestore();
    await assertSucceeds(setDoc(
      doc(db, "users", "student-one", "lessonProgress", language + "_0_0"),
      progressData(language)
    ));
  }
});

test("clients cannot create or alter the server-owned completedAt timestamp", async () => {
  const db = testEnv.authenticatedContext("student-one").firestore();
  await seedProof("student-one", "python", { challengeVerified: true });
  const ref = doc(db, "users", "student-one", "lessonProgress", "python_0_0");
  await assertFails(setDoc(ref, {
    ...progressData("python"),
    completedAt: Timestamp.now()
  }));
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), "users", "student-one", "lessonProgress", "python_0_0"), {
      ...progressData("python"),
      completedAt: Timestamp.fromMillis(1000)
    });
  });
  await assertSucceeds(setDoc(ref, { updatedAt: Timestamp.now() }, { merge: true }));
  await assertFails(setDoc(ref, { completedAt: Timestamp.now() }, { merge: true }));
});
