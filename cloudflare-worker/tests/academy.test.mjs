// Trainer applications on the free Worker path. Mock Firebase token verification (not real Firebase claims).
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers-boot.mjs";
const app = { fullName: "سارة أحمد", specialties: ["python"], bio: "مدرسة برمجة للأطفال لديها خبرة سنتين في التدريس.", portfolioUrl: "https://example.com/p" };
const on = () => { const w = boot({}); w.env.ACADEMY_APPLICATIONS = "on"; w.env.ACADEMY_ADMIN_UIDS = "uidE"; return w; };
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
test("admin list/review: exact uid only; a verified token with the same email as an old email allowlist, unverified email, approved applicants and everyone else get 403", async () => {
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
  w.env.ACADEMY_ADMIN_UIDS = "uidB"; assert.equal((await w.call("/api/academy/admin/applications", { token: "tokB", body: {} })).status, 200); assert.equal((await w.call("/api/academy/admin/applications", { token: "tokE", body: {} })).status, 403);
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
import * as core from "../academy-core.js";
const val = core.validateApplication(app).value;
test("core: global daily intake cap is bounded and resets next UTC day (provisional threshold)", () => {
  const dir = core.emptyDirectory(); const t = Date.UTC(2026, 10, 25, 12);
  for (let i = 0; i < core.GLOBAL_DAILY_INTAKE; i++) assert.equal(core.submitApplication(dir, "u" + i, "e@x.com", true, val, t).ok, true);
  const over = core.submitApplication(dir, "late", "e@x.com", true, val, t); assert.equal(over.status, 503); assert.equal(over.reason, "intake_full_today"); assert.equal(dir.apps.late, undefined);
  assert.equal(core.submitApplication(dir, "late", "e@x.com", true, val, t + 86400000).ok, true);
  assert.equal(Object.keys(dir.apps).length, core.GLOBAL_DAILY_INTAKE + 1, "nothing was deleted");
});
test("core: admin list is paginated with a stable cursor, limit is capped, no overlap, no gaps", () => {
  const dir = core.emptyDirectory(); for (let i = 0; i < 7; i++) core.submitApplication(dir, "u" + i, "e@x.com", true, val, 1000 + (i % 3));
  const seen = []; let cursor = ""; let pages = 0;
  for (;;) { const l = core.listApplications(dir, "", cursor, 3); seen.push(...l.items.map(a => a.uid)); pages++; if (!l.hasMore) break; cursor = l.items[l.items.length - 1].cursorId; }
  assert.equal(pages, 3); assert.equal(new Set(seen).size, 7);
  assert.equal(core.listApplications(dir, "", "", 100000).items.length, 7); assert.equal(core.listApplications(dir, "", "bogus", 3).items.length, 0);
});
test("HTTP: replaying the same submission is idempotent (one record), cross-user private fields never leak, admin routes deny non-admin including pagination params", async () => {
  const w = on(); for (let i = 0; i < 3; i++) await w.call("/api/academy/instructor-application", { token: "tokA", body: app });
  assert.equal(Object.keys([...w.adirs.values()][0].m.get("dir").apps).length, 1);
  const other = await w.call("/api/academy/my-status", { token: "tokB", body: {} }); assert.equal(JSON.stringify(other.data).includes("سارة"), false);
  assert.equal(JSON.stringify(other.data).includes("uidA"), false);
  const denied = await w.call("/api/academy/admin/applications", { token: "tokB", body: { limit: 100, cursor: "x" } }); assert.equal(denied.status, 403); assert.equal(JSON.stringify(denied.data).includes("سارة"), false);
  const page = await w.call("/api/academy/admin/applications", { token: "tokE", body: { limit: 1 } }); assert.equal(page.data.applications.length, 1); assert.equal(page.data.hasMore, false);
});
test("owner-only: an email allowlist is ignored, an approved applicant is not admin, a near-miss uid is refused", async () => {
  const w = on(); delete w.env.ACADEMY_ADMIN_UIDS; w.env.ACADEMY_ADMIN_EMAILS = "pilot@example.com,v@example.com";
  for (const t of ["tokE", "tokV", "tokA"]) assert.equal((await w.call("/api/academy/admin/applications", { token: t, body: {} })).status, 403, "no uid configured: nobody is admin, emails grant nothing");
  w.env.ACADEMY_ADMIN_UIDS = "uidE"; await w.call("/api/academy/instructor-application", { token: "tokV", body: app });
  assert.equal((await w.call("/api/academy/admin/review", { token: "tokE", body: { uid: "uidV", decision: "approved" } })).status, 200);
  assert.equal((await w.call("/api/academy/admin/applications", { token: "tokV", body: {} })).status, 403, "approved applicant is not admin");
  w.env.ACADEMY_ADMIN_UIDS = "uidEE"; assert.equal((await w.call("/api/academy/admin/applications", { token: "tokE", body: {} })).status, 403, "exact match only");
  w.env.ACADEMY_ADMIN_UIDS = "uide"; assert.equal((await w.call("/api/academy/admin/applications", { token: "tokE", body: {} })).status, 403, "case-sensitive");
});
test("admin-only mode: only the exact admin uid can read the list; submit, status and review are off for everyone; no writes", async () => {
  const w = boot({}); w.env.ACADEMY_APPLICATIONS = "admin-only"; w.env.ACADEMY_ADMIN_UIDS = "uidE";
  assert.equal((await w.call("/api/academy/admin/applications", { body: {} })).status, 401);
  assert.equal((await w.call("/api/academy/admin/applications", { token: "tokA", body: {} })).status, 403);
  const pr = await w.call("/api/academy/admin/applications", { token: "tokE", body: {} }); assert.equal(pr.status, 200); assert.deepEqual(pr.data, { success: true, probeOnly: true, adminVerified: true });
  for (const t of ["tokA", "tokE"]) for (const r of ["instructor-application", "my-status", "admin/review"]) assert.equal((await w.call("/api/academy/" + r, { token: t, body: app })).status, 503, t + r);
  for (const h of w.stores.values()) assert.equal(h.m.size, 0, "no record written");
});
test("admin-only mode with a pre-existing record: the probe still returns no applicant data", async () => {
  const w = on(); assert.equal((await w.call("/api/academy/instructor-application", { token: "tokA", body: app })).status, 200);
  w.env.ACADEMY_APPLICATIONS = "admin-only";
  const r = await w.call("/api/academy/admin/applications", { token: "tokE", body: {} });
  assert.equal(r.status, 200); assert.deepEqual(r.data, { success: true, probeOnly: true, adminVerified: true });
  assert.equal(JSON.stringify(r.data).includes("سارة"), false);
});
