import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers-boot.mjs";
const on = w => { w.env.PARENT_LINKS_ENABLED = "on"; return w; };
const P = "/api/parent/";
test("default OFF: every parent route is 503 after auth, anonymous 401, nothing stored", async () => {
  const w = boot();
  for (const r of ["create", "claim", "children", "parents", "unlink", "dashboard"]) { assert.equal((await w.call(P + r, { token: "tokA", body: { consent: true } })).status, 503, r); assert.equal((await w.call(P + r, { body: {} })).status, 401, r); }
  assert.equal(w.pls.size, 0);
});
test("create needs explicit consent; the code is returned once, stored only as a hash", async () => {
  const w = on(boot());
  assert.equal((await w.call(P + "create", { token: "tokA", body: {} })).status, 400);
  const c = await w.call(P + "create", { token: "tokA", body: { consent: true } });
  assert.equal(c.status, 200); assert.match(c.data.code, /^[A-Z2-9]{12}$/);
  const stored = JSON.stringify([...w.pls.get("links").m.values()]);
  assert.ok(!stored.includes(c.data.code), "raw code is never stored");
});
test("claim -> dashboard shows only the exact disclosed fields; revocation is enforced on the next read; strangers and other children are refused", async () => {
  const w = on(boot());
  const code = (await w.call(P + "create", { token: "tokA", body: { consent: true } })).data.code;
  assert.equal((await w.call(P + "claim", { token: "tokB", body: { code: code.toLowerCase().replace(/^(....)/, "$1-") } })).status, 200, "case and dash tolerant");
  assert.equal((await w.call(P + "claim", { token: "tokV", body: { code } })).status, 404, "single use");
  const d = await w.call(P + "dashboard", { token: "tokB", body: { child: "uidA" } });
  assert.equal(d.status, 200); assert.deepEqual(d.data, { success: true, available: false, syncState: "unknown" }, "empty authoritative store is unknown, not 0/0");
  w.env.PROGRESS_WRITES = "off"; const sp = w.env.STUDENT_PROGRESS.get("uidA"); await sp.fetch("https://progress.internal/lesson", { method: "POST", body: "{}" });
  w.env.PROGRESS_WRITES = "on";
  const st = w.stores.get("uidA"); st.m.set("state", { lessons: {}, exams: { "python-1": { percent: 80, passed: true } }, lessonTests: { l1: { percent: 50, passed: true }, l2: { percent: 40, passed: false } } });
  const d2 = await w.call(P + "dashboard", { token: "tokB", body: { child: "uidA" } });
  assert.deepEqual(d2.data, { success: true, available: true, syncState: "assessed", lessonTestsPassed: 1, unitExamsPassed: 1 }, "exact disclosed fields");
  assert.equal(d2.h.get("cache-control"), "no-store");
  w.env.PROGRESS_WRITES = "off"; assert.deepEqual((await w.call(P + "dashboard", { token: "tokB", body: { child: "uidA" } })).data, { success: true, available: false, syncState: "unknown" }, "writes off: unknown even with records"); w.env.PROGRESS_WRITES = "on";
  assert.equal((await w.call(P + "dashboard", { token: "tokV", body: { child: "uidA" } })).status, 403, "unlinked stranger");
  assert.equal((await w.call(P + "dashboard", { token: "tokB", body: { child: "uidE" } })).status, 403, "other child");
  assert.equal((await w.call(P + "unlink", { token: "tokV", body: { child: "uidA", parent: "uidB" } })).status, 403);
  assert.equal((await w.call(P + "unlink", { token: "tokA", body: { parent: "uidB" } })).status, 200);
  const after = await w.call(P + "dashboard", { token: "tokB", body: { child: "uidA" } });
  assert.equal(after.status, 403); assert.deepEqual(after.data, { success: false, message: "forbidden" }); assert.equal(after.h.get("cache-control"), "no-store");
});
test("revocation DURING a read returns nothing (authorization is rechecked after the progress read)", async () => {
  const w = on(boot());
  const code = (await w.call(P + "create", { token: "tokA", body: { consent: true } })).data.code; await w.call(P + "claim", { token: "tokB", body: { code } });
  w.env.STUDENT_PROGRESS.get("uidA"); w.stores.get("uidA").m.set("state", { lessons: {}, exams: { "python-1": { percent: 80, passed: true } } });
  const orig = w.env.STUDENT_PROGRESS.get; w.env.STUDENT_PROGRESS.get = id => { const s = orig(id); return { fetch: async (u, i) => { const r = await s.fetch(u, i); await w.call(P + "unlink", { token: "tokA", body: { parent: "uidB" } }); return r; } }; };
  const d = await w.call(P + "dashboard", { token: "tokB", body: { child: "uidA" } });
  assert.equal(d.status, 403); assert.equal(JSON.stringify(d.data).includes("lessonTestsPassed"), false);
});
test("progress read failure shows available:false, not zeros", async () => {
  const w = on(boot());
  const code = (await w.call(P + "create", { token: "tokA", body: { consent: true } })).data.code; await w.call(P + "claim", { token: "tokB", body: { code } });
  w.env.STUDENT_PROGRESS.get = () => ({ fetch: async () => { throw new Error("down"); } });
  const d = await w.call(P + "dashboard", { token: "tokB", body: { child: "uidA" } });
  assert.deepEqual(d.data, { success: true, available: false, syncState: "read_failed" });
});
test("brute force: wrong codes are bounded per account, then even the right code is refused; children/parents lists are scoped", async () => {
  const w = on(boot());
  const code = (await w.call(P + "create", { token: "tokA", body: { consent: true } })).data.code;
  for (let i = 0; i < 10; i++) assert.equal((await w.call(P + "claim", { token: "tokB", body: { code: "A".repeat(11) + String(i % 8 + 2) } })).status, 404);
  assert.equal((await w.call(P + "claim", { token: "tokB", body: { code } })).status, 429);
  assert.equal((await w.call(P + "claim", { token: "tokV", body: { code } })).status, 200);
  assert.deepEqual((await w.call(P + "children", { token: "tokV" })).data.children, [{ uid: "uidA" }]);
  assert.deepEqual((await w.call(P + "children", { token: "tokB" })).data.children, []);
  assert.equal((await w.call(P + "parents", { token: "tokA" })).data.parents.length, 1);
});
