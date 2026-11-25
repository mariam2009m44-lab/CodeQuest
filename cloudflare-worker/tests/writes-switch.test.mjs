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
