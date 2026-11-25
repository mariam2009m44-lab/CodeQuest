import { test } from "node:test";
import assert from "node:assert/strict";
import * as p from "../parent-core.js";
const T = 1_000_000_000_000;
test("code is single use, expires after 30 minutes, and the child cannot claim their own code", () => {
  const s = p.emptyLinks(); p.createCode(s, "kid", "h1", T);
  assert.equal(p.claimCode(s, "kid", "h1", T + 1).ok, false);
  assert.equal(p.claimCode(s, "mom", "h1", T + p.CODE_TTL_MS).ok, false, "expired at exactly 30 min");
  assert.equal(p.claimCode(s, "mom", "h1", T + 1000).ok, true);
  assert.equal(p.claimCode(s, "dad", "h1", T + 2000).ok, false, "second claim of the same code fails");
  assert.deepEqual(p.childrenOf(s, "dad"), []);
});
test("revocation: unlink by either side stops every later read; strangers cannot unlink; no cross-child reads", () => {
  const s = p.emptyLinks(); p.createCode(s, "kidA", "a", T); p.createCode(s, "kidB", "b", T);
  p.claimCode(s, "mom", "a", T + 1); p.claimCode(s, "dad", "b", T + 1);
  assert.equal(p.canRead(s, "mom", "kidA"), true); assert.equal(p.canRead(s, "mom", "kidB"), false, "linked to A only");
  assert.equal(p.unlink(s, "dad", "kidA", "mom").status, 403, "unrelated account cannot unlink");
  assert.equal(p.unlink(s, "kidA", "kidA", "mom").ok, true); assert.equal(p.canRead(s, "mom", "kidA"), false);
  assert.equal(p.unlink(s, "mom", "kidA", "mom").status, 404);
  p.createCode(s, "kidA", "a2", T + 5); p.claimCode(s, "mom", "a2", T + 6); assert.equal(p.canRead(s, "mom", "kidA"), true);
  assert.equal(p.unlink(s, "mom", "kidA", "mom").ok, true); assert.equal(p.canRead(s, "mom", "kidA"), false, "parent-side unlink also works");
});
test("unlinking also kills unclaimed codes of that child", () => {
  const s = p.emptyLinks(); p.createCode(s, "kid", "x", T); p.createCode(s, "kid", "y", T); p.claimCode(s, "mom", "x", T + 1);
  p.unlink(s, "kid", "kid", "mom"); assert.equal(p.claimCode(s, "dad", "y", T + 2).ok, false);
});
test("brute force is bounded per parent per hour and resets next hour; limits on active codes and links", () => {
  const s = p.emptyLinks(); for (let i = 0; i < p.MAX_FAILED_CLAIMS_PER_HOUR; i++) assert.equal(p.claimCode(s, "bot", "g" + i, T).status, 404);
  assert.equal(p.claimCode(s, "bot", "g", T).status, 429);
  p.createCode(s, "kid", "real", T); assert.equal(p.claimCode(s, "bot", "real", T + 1).status, 429, "even the right code is refused while locked");
  p.createCode(s, "kid", "real2", T + 3600000); assert.equal(p.claimCode(s, "bot", "real2", T + 3600001).ok, true, "lock resets next hour");
  const t = p.emptyLinks(); for (let i = 0; i < p.MAX_ACTIVE_CODES; i++) assert.equal(p.createCode(t, "k", "c" + i, T).ok, true); assert.equal(p.createCode(t, "k", "cx", T).status, 429);
});
test("no raw code or uid appears in the stored state keys beyond the hash", () => {
  const s = p.emptyLinks(); p.createCode(s, "kid", "HASHONLY", T); assert.deepEqual(Object.keys(s.codes), ["HASHONLY"]);
});
