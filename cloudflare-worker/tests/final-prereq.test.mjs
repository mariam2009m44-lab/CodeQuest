// The Python final records only after every Python unit exam is passed in the server state (mock tokens, in-memory DO).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boot } from "./helpers-boot.mjs";
const def = JSON.parse(readFileSync(new URL("../python-final.json", import.meta.url), "utf8"));
const ids = Object.keys(def.questions).slice(0, def.size || 15);
const answers = ids.map(id => ({ id, pick: def.questions[id].a }));
const unitKeys = Array.from({ length: 12 }, (_, i) => "python-" + (i + 1));
test("final exam: refused with 409 prerequisites_missing until all 12 unit exams are passed; nothing recorded", async () => {
  const w = boot({});
  await w.call("/api/progress/get", { token: "tokA", body: {} });
  const refused = await w.call("/api/progress/final-exam", { token: "tokA", body: { language: "python", answers } });
  assert.equal(refused.status, 409); assert.equal(refused.data.message, "prerequisites_missing"); assert.equal(refused.data.remaining, 12);
  const st = w.stores.get("uidA").m.get("state"); assert.equal(st.finals && st.finals.python, undefined);
  // 11 of 12 passed, one failed-but-recorded: still refused
  const state = w.stores.get("uidA").m.get("state"); state.exams = {}; unitKeys.slice(0, 11).forEach(k => { state.exams[k] = { percent: 90, passed: true }; }); state.exams["python-12"] = { percent: 20, passed: false }; w.stores.get("uidA").m.set("state", state);
  const still = await w.call("/api/progress/final-exam", { token: "tokA", body: { language: "python", answers } });
  assert.equal(still.status, 409); assert.equal(still.data.remaining, 1);
  state.exams["python-12"] = { percent: 50, passed: true }; w.stores.get("uidA").m.set("state", state);
  const ok = await w.call("/api/progress/final-exam", { token: "tokA", body: { language: "python", answers } });
  assert.equal(ok.status, 200); assert.equal(ok.data.passed, true); assert.equal(ok.data.earned, answers.length);
  // another account has its own state: still refused
  assert.equal((await w.call("/api/progress/final-exam", { token: "tokB", body: { language: "python", answers } })).status, 409);
});
