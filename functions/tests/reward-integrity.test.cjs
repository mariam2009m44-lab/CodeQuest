const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const lessonId = "python_0_0";
const progress = {
  language: "python", chapter: 0, lesson: 0, completed: true
};
const profile = { xp: 90, stars: 9, completedLessons: 9 };
const proof = {
  verificationVersion: 1,
  serverVerified: true,
  passed: true,
  uid: "student",
  lessonId,
  language: "python",
  chapter: 0,
  lesson: 0
};

// عزل خدمات السحابة لاختبار منطق الدالة الفعلي دون نشرها.
function createHarness({ result, user = profile, reward } = {}) {
  const records = new Map();
  const userPath = "users/student";
  const rewardPath = `${userPath}/gameRewards/lesson_${lessonId}`;
  if (user) records.set(userPath, { ...user });
  if (result) records.set(`${userPath}/quizResults/lesson_${lessonId}`, result);
  if (reward) records.set(rewardPath, reward);
  const writes = [];
  const ref = value => ({
    path: value,
    collection: name => ({ doc: id => ref(`${value}/${name}/${id}`) })
  });
  const db = {
    collection: name => ({ doc: id => ref(`${name}/${id}`) }),
    runTransaction: async callback => {
      const pending = [];
      const transaction = {
        get: async reference => {
          assert.equal(pending.length, 0, "يجب إجراء القراءات قبل الكتابات");
          const data = records.get(reference.path);
          return { exists: records.has(reference.path), data: () => data };
        },
        update: (reference, data) => pending.push(["update", reference.path, data]),
        create: (reference, data) => {
          assert.equal(records.has(reference.path), false, "سجل المكافأة موجود");
          pending.push(["create", reference.path, data]);
        }
      };
      const value = await callback(transaction);
      for (const [operation, key, data] of pending) {
        records.set(key, operation === "update"
          ? { ...records.get(key), ...data } : data);
        writes.push([operation, key, data]);
      }
      return value;
    }
  };
  const context = {
    exports: {}, console,
    require(name) {
      if (name === "./lesson-completion") return require("../lesson-completion");
      if (name === "crypto") return require("node:crypto");
      if (name === "firebase-admin/app") return { initializeApp() {} };
      if (name === "firebase-admin/firestore") return {
        getFirestore: () => db,
        FieldValue: { serverTimestamp: () => "SERVER_TIMESTAMP" }
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
  vm.runInNewContext(
    fs.readFileSync(file, "utf8")
      + "\nexports.testAward = awardCompletedLesson;",
    context,
    { filename: file }
  );
  return {
    award: () => context.exports.testAward("student", lessonId, progress),
    records, writes, rewardPath, userPath
  };
}

test("لا تمنح حالة الإكمال وحدها أي مكافأة", async () => {
  const harness = createHarness();
  const result = await harness.award();
  assert.equal(result.awarded, false);
  assert.equal(result.reason, "unverified-result");
  assert.equal(harness.writes.length, 0);
});

for (const [field, invalid] of Object.entries({
  verificationVersion: 2,
  serverVerified: false,
  passed: false,
  uid: "another-student",
  lessonId: "python_0_1",
  language: "javascript",
  chapter: 1,
  lesson: 1
})) {
  test(`رفض إثبات غير مطابق في الحقل ${field}`, async () => {
    const harness = createHarness({ result: { ...proof, [field]: invalid } });
    assert.equal((await harness.award()).awarded, false);
    assert.equal(harness.writes.length, 0);
  });
}

test("منح المكافأة الموثقة مرة واحدة وتحديث المستوى", async () => {
  const harness = createHarness({ result: proof });
  assert.equal((await harness.award()).awarded, true);
  const user = harness.records.get(harness.userPath);
  assert.equal(user.xp, 100);
  assert.equal(user.stars, 10);
  assert.equal(user.level, 2);
  assert.equal(user.completedLessons, 10);
  assert.equal(harness.records.has(harness.rewardPath), true);
  assert.equal(harness.writes.length, 2);
  assert.equal((await harness.award()).reason, "already-awarded");
  assert.equal(harness.writes.length, 2);
});

test("لا تتغير المكافآت القديمة ولا يعاد منحها", async () => {
  const harness = createHarness({ reward: { xp: 10, stars: 1 } });
  assert.equal((await harness.award()).reason, "already-awarded");
  assert.equal(harness.writes.length, 0);
});

test("غياب ملف الحساب لا يؤدي إلى كتابة جزئية", async () => {
  const harness = createHarness({ result: proof, user: null });
  await assert.rejects(harness.award());
  assert.equal(harness.writes.length, 0);
});
