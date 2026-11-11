const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadValidator() {
  const context = {
    exports: {},
    console,
    require(name) {
      if (name === "firebase-admin/app") return { initializeApp() {} };
      if (name === "firebase-admin/firestore") return {
        getFirestore: () => ({}),
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
      throw new Error(`Unexpected dependency: ${name}`);
    }
  };

  const file = path.join(__dirname, "..", "index.js");
  vm.runInNewContext(
    fs.readFileSync(file, "utf8") +
      "\nexports.testParentProgressValidator = isValidParentLessonProgressDocument;",
    context,
    { filename: file }
  );
  return context.exports.testParentProgressValidator;
}

const isValid = loadValidator();
function record(id, data) {
  return { id, data: () => data };
}

test("accepts valid canonical lesson records across all curricula", () => {
  for (const [id, data] of [
    ["python_0_0", { language: "python", chapter: 0, lesson: 0, completed: true }],
    ["javascript_7_1", { language: "javascript", chapter: 7, lesson: 1, completed: true }],
    ["cpp_0_4", { language: "cpp", chapter: 0, lesson: 4, completed: true }],
    ["java_7_1", { language: "java", chapter: 7, lesson: 1, completed: true }]
  ]) {
    assert.equal(isValid(record(id, data)), true, id);
  }
});

test("rejects Python exam markers and out-of-curriculum lesson positions", () => {
  const cases = [
    ["python_0_104", { language: "python", chapter: 0, lesson: 104, completed: true }],
    ["python_12_0", { language: "python", chapter: 12, lesson: 0, completed: true }],
    ["javascript_7_2", { language: "javascript", chapter: 7, lesson: 2, completed: true }],
    ["cpp_0_5", { language: "cpp", chapter: 0, lesson: 5, completed: true }],
    ["java_8_0", { language: "java", chapter: 8, lesson: 0, completed: true }]
  ];

  for (const [id, data] of cases) {
    assert.equal(isValid(record(id, data)), false, id);
  }
});

test("rejects duplicate, mismatched, and incomplete progress records", () => {
  assert.equal(isValid(record("duplicate_python_0_0", {
    language: "python", chapter: 0, lesson: 0, completed: true
  })), false);

  assert.equal(isValid(record("javascript_0_0", {
    language: "python", chapter: 0, lesson: 0, completed: true
  })), false);

  assert.equal(isValid(record("python_0_0", {
    language: "python", chapter: 0, lesson: 0, completed: false
  })), false);
});
