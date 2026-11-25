// Release switch: with PROGRESS_WRITES unset, every write route is refused after auth, reads still work, unauthenticated calls still answer 401.
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers-boot.mjs";
const writes = ["lesson", "resume", "lesson-test", "final-exam", "code-task", "practice-task", "exam"];
test("default OFF: writes 503 progress_writes_off (retryable), nothing stored, reads work, no token is still 401", async () => {
  const w = boot({}); delete w.env.PROGRESS_WRITES;
  for (const r of writes) {
    const res = await w.call("/api/progress/" + r, { token: "tokA", body: {} });
    assert.equal(res.status, 503, r); assert.equal(res.data.message, "progress_writes_off"); assert.equal(res.data.retryable, true);
    const anon = await w.call("/api/progress/" + r, { body: {} }); assert.equal(anon.status, 401, r + " anon");
  }
  const g = await w.call("/api/progress/get", { token: "tokA", body: {} }); assert.equal(g.status, 200);
  assert.equal(w.stores.get("uidA").m.has("state") && JSON.stringify(w.stores.get("uidA").m.get("state")).includes("passed"), false);
});
test("PROGRESS_WRITES=on restores normal behaviour", async () => {
  const w = boot({}); const res = await w.call("/api/progress/lesson-test", { token: "tokA", body: {} });
  assert.notEqual(res.data && res.data.message, "progress_writes_off");
});
test("pilot allowlist: lesson-test only, only for listed accounts; every other write stays off; reads work", async () => {
  const w = boot({}); delete w.env.PROGRESS_WRITES; w.env.PROGRESS_PILOT_UIDS = " uidX , uidA ";
  const lt = await w.call("/api/progress/lesson-test", { token: "tokA", body: {} });
  assert.notEqual(lt.data && lt.data.message, "progress_writes_off", "pilot account reaches the real handler");
  const other = await w.call("/api/progress/lesson-test", { token: "tokB", body: {} });
  assert.equal(other.status, 503); assert.equal(other.data.message, "progress_writes_off");
  for (const r of ["lesson", "resume", "final-exam", "code-task", "practice-task", "exam"]) {
    const x = await w.call("/api/progress/" + r, { token: "tokA", body: {} });
    assert.equal(x.status, 503, r + " stays off for the pilot account"); assert.equal(x.data.message, "progress_writes_off");
  }
  const iss = await w.call("/api/certificates/issue", { token: "tokA", body: {} }); assert.equal(iss.status, 503);
  assert.equal((await w.call("/api/progress/get", { token: "tokB", body: {} })).status, 200);
  w.env.PROGRESS_PILOT_UIDS = ""; const none = await w.call("/api/progress/lesson-test", { token: "tokA", body: {} }); assert.equal(none.status, 503);
});
