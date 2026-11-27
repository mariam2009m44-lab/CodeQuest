import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, ORIGIN } from "./helpers-boot.mjs";

const ID = "0123456789abcdef0123456789abcdef";
// FIXTURE: a certificate record written straight into a test learner's store.
function seed(b, uid, track, recordId, issuedAt) {
  const m = b.stores.get(uid).m, st = m.get("state") || {};
  st.certs = { ...(st.certs || {}), [track]: { recordId, issuedAt, lessonsTotal: 3, unitExamsTotal: 2 } };
  m.set("state", st);
}
test("verify: unknown, malformed and empty ids give a clean 404 with no detail", async () => {
  const b = boot();
  for (const q of ["", "?id=abc", "?id=" + "Z".repeat(32), "?id=" + ID, "?id=" + ID + "00"]) {
    const r = await b.call("/api/certificates/verify" + q, { method: "GET" });
    assert.equal(r.status, 404, q); assert.deepEqual(r.data, { success: false, valid: false, message: "not_found" });
  }
});
test("verify: needs an allowed origin and no sign-in; a registered number answers track and date only", async () => {
  const b = boot();
  await b.call("/api/certificates", { method: "GET", token: "tokA" }); // creates the learner store
  seed(b, "uidA", "python", ID, "2026-11-27T08:00:00.000Z");
  assert.equal((await b.call("/api/certificates/verify?id=" + ID, { method: "GET" })).status, 404, "not registered until the learner's own server record is read");
  const own = await b.call("/api/certificates", { method: "GET", token: "tokA" });
  assert.equal(own.status, 200);
  const r = await b.call("/api/certificates/verify?id=" + ID, { method: "GET" });
  assert.equal(r.status, 200);
  assert.deepEqual(r.data, { success: true, valid: true, track: "python", trackName: "Python", issuedAt: "2026-11-27T08:00:00.000Z" });
  const text = JSON.stringify(r.data); assert.equal(text.includes("uidA"), false);
  const bad = await b.call("/api/certificates/verify?id=" + ID, { method: "GET", origin: "https://evil.example" });
  assert.equal(bad.status, 403);
});
test("verify: a second learner cannot overwrite a registered number", async () => {
  const b = boot();
  await b.call("/api/certificates", { method: "GET", token: "tokA" }); await b.call("/api/certificates", { method: "GET", token: "tokB" });
  seed(b, "uidA", "python", ID, "2026-11-27T08:00:00.000Z"); seed(b, "uidB", "java", ID, "2026-12-01T08:00:00.000Z");
  await b.call("/api/certificates", { method: "GET", token: "tokA" }); await b.call("/api/certificates", { method: "GET", token: "tokB" });
  assert.equal((await b.call("/api/certificates/verify?id=" + ID, { method: "GET" })).data.track, "python");
});
