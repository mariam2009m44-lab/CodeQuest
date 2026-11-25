// Trainer applications on the free Worker path. Mock Firebase token verification (not real Firebase claims).
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers-boot.mjs";
const app = { fullName: "سارة أحمد", specialties: ["python"], bio: "مدرسة برمجة للأطفال لديها خبرة سنتين في التدريس.", portfolioUrl: "https://example.com/p" };
const on = () => { const w = boot({}); w.env.ACADEMY_APPLICATIONS = "on"; w.env.ACADEMY_ADMIN_EMAILS = "pilot@example.com"; return w; };
test("default OFF: every academy route is 503 after auth, anonymous is 401, nothing stored", async () => {
  const w = boot({});
  for (const r of ["instructor-application", "my-status", "admin/applications", "admin/review"]) {
    assert.equal((await w.call("/api/academy/" + r, { token: "tokA", body: app })).status, 503, r);
    assert.equal((await w.call("/api/academy/" + r, { body: app })).status, 401, r);
  }
  assert.equal(w.adirs.size, 0);
});
test("submit validates like the Firebase callable and stores one pending record per account", async () => {
  const w = on();
  for (const bad of [{}, { ...app, fullName: "ab" }, { ...app, specialties: ["ruby"] }, { ...app, bio: "short" }, { ...app, portfolioUrl: "http://x.com" }, { ...app, ageGroups: ["5"] }]) assert.equal((await w.call("/api/academy/instructor-application", { token: "tokA", body: bad })).status, 400);
  const ok = await w.call("/api/academy/instructor-application", { token: "tokA", body: app }); assert.equal(ok.status, 200); assert.equal(ok.data.status, "pending");
  assert.equal((await w.call("/api/academy/instructor-application", { token: "tokA", body: { ...app, fullName: "سارة محمد" } })).status, 200);
  const st = await w.call("/api/academy/my-status", { token: "tokA", body: {} }); assert.equal(st.data.status, "pending");
  assert.equal(st.data.application.fullName, "سارة محمد", "owner gets their own application back"); assert.equal(st.data.application.uid, undefined);
  assert.equal((await w.call("/api/academy/my-status", { token: "tokB", body: {} })).data.exists, false);
  const dir = [...w.adirs.values()][0].m.get("dir"); assert.equal(Object.keys(dir.apps).length, 1); assert.equal(dir.apps.uidA.fullName, "سارة محمد");
});
test("admin list/review: verified allowlisted email or exact uid only; an unverified same email and everyone else get 403", async () => {
  const w = on(); await w.call("/api/academy/instructor-application", { token: "tokA", body: app }); await w.call("/api/academy/instructor-application", { token: "tokV", body: app });
  for (const t of ["tokA", "tokB", "tokU"]) { assert.equal((await w.call("/api/academy/admin/applications", { token: t, body: {} })).status, 403, t); assert.equal((await w.call("/api/academy/admin/review", { token: t, body: { uid: "uidA", decision: "approved" } })).status, 403, t); }
  const l = await w.call("/api/academy/admin/applications", { token: "tokE", body: {} }); assert.equal(l.status, 200); assert.equal(l.data.applications.length, 2);
  assert.equal((await w.call("/api/academy/admin/review", { token: "tokE", body: { uid: "uidA", decision: "bogus" } })).status, 400);
  assert.equal((await w.call("/api/academy/admin/review", { token: "tokE", body: { uid: "nope", decision: "approved" } })).status, 404);
  assert.equal((await w.call("/api/academy/admin/review", { token: "tokE", body: { uid: "uidA", decision: "approved" } })).data.message, "email_not_verified", "unverified email cannot be approved");
  assert.equal((await w.call("/api/academy/admin/review", { token: "tokE", body: { uid: "uidA", decision: "rejected" } })).status, 200);
  assert.equal((await w.call("/api/academy/admin/review", { token: "tokE", body: { uid: "uidA", decision: "approved" } })).data.message, "not_pending");
  assert.equal((await w.call("/api/academy/admin/review", { token: "tokE", body: { uid: "uidV", decision: "approved" } })).status, 200);
  assert.equal((await w.call("/api/academy/my-status", { token: "tokV", body: {} })).data.status, "approved");
  assert.equal((await w.call("/api/academy/instructor-application", { token: "tokV", body: app })).status, 409, "approved accounts cannot be overwritten");
  w.env.ACADEMY_ADMIN_EMAILS = ""; w.env.ACADEMY_ADMIN_UIDS = "uidB"; assert.equal((await w.call("/api/academy/admin/applications", { token: "tokB", body: {} })).status, 200); assert.equal((await w.call("/api/academy/admin/applications", { token: "tokE", body: {} })).status, 403);
});
test("a verified admin cannot review their own application", async () => {
  const w = on(); await w.call("/api/academy/instructor-application", { token: "tokE", body: app });
  assert.equal((await w.call("/api/academy/admin/review", { token: "tokE", body: { uid: "uidE", decision: "approved" } })).status, 403);
});
test("daily submit cap and wrong-origin refusal", async () => {
  const w = on(); let last; for (let i = 0; i < 6; i++) last = await w.call("/api/academy/instructor-application", { token: "tokA", body: app });
  assert.equal(last.status, 429);
  assert.equal((await w.call("/api/academy/my-status", { token: "tokA", body: {}, origin: "https://evil.example" })).status, 403);
});
