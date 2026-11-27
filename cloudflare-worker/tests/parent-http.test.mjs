import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, SVC } from "./helpers-boot.mjs";
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
  const orig = w.env.STUDENT_PROGRESS.get; w.env.STUDENT_PROGRESS.get = id => { const s = orig(id); if (id !== "uidA") return s; return { fetch: async (u, i) => { const r = await s.fetch(u, i); await w.call(P + "unlink", { token: "tokA", body: { parent: "uidB" } }); return r; } }; };
  const d = await w.call(P + "dashboard", { token: "tokB", body: { child: "uidA" } });
  assert.equal(d.status, 403); assert.equal(JSON.stringify(d.data).includes("lessonTestsPassed"), false);
});
test("progress read failure shows available:false, not zeros", async () => {
  const w = on(boot());
  const code = (await w.call(P + "create", { token: "tokA", body: { consent: true } })).data.code; await w.call(P + "claim", { token: "tokB", body: { code } });
  { const o2 = w.env.STUDENT_PROGRESS.get; w.env.STUDENT_PROGRESS.get = id => id === "uidA" ? { fetch: async () => { throw new Error("down"); } } : o2(id); }
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
test("no uid can reach the service instances: colon uids still work normally, over-long uids are refused, progress routes ignore body-supplied actions, and nobody reads academy/parent storage through progress", async () => {
  const w = on(boot()); w.env.ACADEMY_ADMIN_UIDS = "uidE"; w.env.ACADEMY_APPLICATIONS = "on";
  const app = { fullName: "سارة أحمد", bio: "مدربة برمجة بخبرة سبع سنوات في تعليم الأطفال", specialties: ["python"], links: [], contact: "x" };
  await w.call("/api/academy/instructor-application", { token: "tokE", body: app });
  const code = (await w.call(P + "create", { token: "tokA", body: { consent: true } })).data.code; await w.call(P + "claim", { token: "tokB", body: { code } });
  // a legitimate uid that contains ":" is accepted and gets its own empty progress store
  const c = await w.call("/api/progress/get", { token: "colon" }); assert.equal(c.status, 200); assert.deepEqual(Object.keys(c.data.lessons), []);
  // a uid equal to the OLD short service names reads only its own empty store
  assert.deepEqual(Object.keys((await w.call("/api/progress/get", { token: "colon" })).data.lessons), []);
  // a 129-char uid is refused everywhere
  for (const r of ["/api/progress/get", "/api/academy/my-status", P + "children"]) assert.equal((await w.call(r, { token: "long129" })).status, 401, r);
  // body-supplied action/path/host fields never change the internal route
  const evil = await w.call("/api/progress/get", { token: "tokA", body: { action: "list", status: "pending", path: "/list", url: "https://academy.internal/list", host: "academy.internal" } });
  assert.equal(evil.status, 200); assert.equal(JSON.stringify(evil.data).includes("fullName"), false); assert.equal(JSON.stringify(evil.data).includes("apps"), false);
  const dashEvil = await w.call("/api/progress/get", { token: "tokB", body: { child: "uidA" } }); assert.equal(JSON.stringify(dashEvil.data).includes("uidA"), false);
  // unknown progress actions are 404, not forwarded
  for (const a of ["list", "review", "authorize", "claim", "children"]) assert.equal((await w.call("/api/progress/" + a, { token: "tokA", body: {} })).status, 404, a);
  // service data lives only under the service names; user stores never contain it
  for (const [k, v] of w.stores) if (k !== SVC.academy && k !== SVC.parent) assert.equal([...v.m.keys()].some(x => x === "dir" || x === "links"), false, k);
  // the service names are 140+ chars, longer than any accepted uid, so no authenticated user can ever equal them
  assert.equal((await w.call("/api/academy/admin/applications", { token: "svcAcademy", body: {} })).status, 401);
});
test("entering your own code in the same account says so (400 self_link), does not burn the code or count as a failed guess", async () => {
  const w = on(boot());
  const code = (await w.call(P + "create", { token: "tokA", body: { consent: true } })).data.code;
  for (let i = 0; i < 12; i++) { const r = await w.call(P + "claim", { token: "tokA", body: { code } }); assert.equal(r.status, 400); assert.equal(r.data.message, "self_link"); }
  assert.equal((await w.call(P + "claim", { token: "tokB", body: { code } })).status, 200, "the code still works for another account");
});
