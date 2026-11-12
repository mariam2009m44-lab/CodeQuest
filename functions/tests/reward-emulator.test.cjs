const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { initializeApp, deleteApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const host = process.env.FIRESTORE_EMULATOR_HOST;

test("معاملة المكافأة مع طلبات متزامنة داخل المحاكي", {
  skip: !host
}, async () => {
  // لا يسمح هذا الاختبار بالاتصال بمشروع إنتاجي.
  assert.match(host, /^(127\.0\.0\.1|localhost):\d+$/);
  const app = initializeApp({ projectId: "demo-codequest-audit" }, "reward-test");
  const db = getFirestore(app);
  const uid = `reward-test-${process.pid}-${Date.now()}`;
  const lessonId = "python_0_0";
  const userRef = db.collection("users").doc(uid);
  const resultRef = userRef.collection("quizResults").doc(`lesson_${lessonId}`);
  const rewardRef = userRef.collection("gameRewards").doc(`lesson_${lessonId}`);
  const context = {
    exports: {}, console,
    require(name) {
      if (name === "./lesson-completion") return require("../lesson-completion");
      if (name === "crypto") return require("node:crypto");
      if (name === "firebase-admin/app") return { initializeApp() {} };
      if (name === "firebase-admin/firestore") return {
        // توحيد سياق Promise بين vm ومكتبة Firestore في أداة الاختبار.
        getFirestore: () => ({
          collection: name => db.collection(name),
          runTransaction: callback => db.runTransaction(async tx => await callback(tx))
        }),
        FieldValue
      };
      if (name === "firebase-functions/v2/https") return {
        onCall: (_options, handler) => handler,
        HttpsError: class extends Error {}
      };
      if (name === "firebase-functions/params") return {
        defineString: (_name, options) => ({ value: () => options.default })
      };
      if (name === "firebase-functions/v2/firestore") return {
        onDocumentWritten: (_options, handler) => handler
      };
      throw new Error(`اعتماد غير متوقع: ${name}`);
    }
  };
  const file = path.join(__dirname, "..", "index.js");
  vm.runInNewContext(fs.readFileSync(file, "utf8")
    + "\nexports.testAward = awardCompletedLesson;", context);
  const award = () => context.exports.testAward(uid, lessonId, {
    language: "python", chapter: 0, lesson: 0, completed: true
  });
  try {
    await userRef.set({ xp: 90, stars: 9, completedLessons: 9 });
    assert.equal((await award()).reason, "unverified-result");
    assert.equal((await rewardRef.get()).exists, false);
    await resultRef.set({
      verificationVersion: 1,
      serverVerified: true,
      passed: true,
      uid, lessonId, language: "python", chapter: 0, lesson: 0
    });
    const results = await Promise.all(Array.from({ length: 10 }, award));
    assert.equal(results.filter(result => result.awarded).length, 1);
    assert.equal(results.filter(result => result.reason === "already-awarded").length, 9);
    const profile = (await userRef.get()).data();
    assert.equal(profile.xp, 100);
    assert.equal(profile.stars, 10);
    assert.equal(profile.completedLessons, 10);
    assert.equal(profile.level, 2);
    assert.equal((await rewardRef.get()).exists, true);
  } finally {
    await db.recursiveDelete(userRef);
    await db.terminate();
    await deleteApp(app);
  }
});
