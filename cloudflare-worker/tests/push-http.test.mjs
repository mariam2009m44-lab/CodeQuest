import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./helpers-boot.mjs";
import { isDue, localParts, validSubscription, validEndpoint } from "../push-core.js";
const kv = () => { const m = new Map(); return { m, get: async (k, t) => m.has(k) ? (t === "json" ? JSON.parse(m.get(k)) : m.get(k)) : null, put: async (k, v) => { m.set(k, v); }, delete: async k => { m.delete(k); }, list: async ({ prefix }) => ({ keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })) }) }; };
const EP = "https://fcm.googleapis.com/fcm/send/abc123";
test("pure: time zone aware due check, once per local day, never late at night", () => {
  const sub = { endpoint: EP, time: "18:00", tz: "Africa/Cairo", sent: "" };
  const at = iso => Date.parse(iso);
  assert.equal(isDue(sub, at("2026-11-27T15:59:00Z")), false, "17:59 Cairo (UTC+2) is before 18:00");
  assert.equal(isDue(sub, at("2026-11-27T16:00:00Z")), true, "18:00 Cairo");
  assert.equal(isDue(sub, at("2026-11-27T17:59:00Z")), true, "19:59 still inside the 2 h window");
  assert.equal(isDue(sub, at("2026-11-27T18:30:00Z")), false, "20:30 too late, skipped");
  assert.equal(isDue({ ...sub, sent: localParts(at("2026-11-27T16:00:00Z"), "Africa/Cairo").date }, at("2026-11-27T16:10:00Z")), false, "already sent today");
});
test("pure: only real push services over https are accepted; bad time or zone rejected", () => {
  assert.equal(validEndpoint(EP), true);
  assert.equal(validEndpoint("http://fcm.googleapis.com/x"), false);
  assert.equal(validEndpoint("https://evil.example/x"), false);
  assert.equal(validEndpoint("https://fcm.googleapis.com.evil.example/x"), false);
  assert.equal(validSubscription({ endpoint: EP, time: "25:00", tz: "Africa/Cairo" }), null);
  assert.equal(validSubscription({ endpoint: EP, time: "18:00", tz: "Not/AZone" }), null);
  assert.deepEqual(validSubscription({ endpoint: EP, time: "18:00", tz: "Africa/Cairo", extra: 1 }), { endpoint: EP, time: "18:00", tz: "Africa/Cairo" });
});
test("routes: key is public, subscribe/unsubscribe need sign-in, subscription stores no account data", async () => {
  const w = boot(); w.env.QUIZ_ANSWERS = kv();
  const k = await w.call("/api/push/key", { method: "GET" });
  assert.equal(k.status, 200); assert.ok(k.data.publicKey.length >= 80, "uncompressed P-256 key");
  assert.equal((await w.call("/api/push/key", { method: "GET" })).data.publicKey, k.data.publicKey, "stable key");
  assert.equal((await w.call("/api/push/subscribe", { body: { endpoint: EP, time: "18:00", tz: "Africa/Cairo" } })).status, 401);
  assert.equal((await w.call("/api/push/subscribe", { token: "tokA", body: { endpoint: "https://evil.example/x", time: "18:00", tz: "Africa/Cairo" } })).status, 400);
  assert.equal((await w.call("/api/push/subscribe", { token: "tokA", body: { endpoint: EP, time: "18:00", tz: "Africa/Cairo" } })).status, 200);
  const stored = [...w.env.QUIZ_ANSWERS.m.entries()].filter(([n]) => n.startsWith("push:sub:"));
  assert.equal(stored.length, 1); assert.ok(!stored[0][1].includes("uidA"), "no account id stored");
  assert.equal((await w.call("/api/push/unsubscribe", { token: "tokA", body: { endpoint: EP } })).status, 200);
  assert.equal([...w.env.QUIZ_ANSWERS.m.keys()].filter(n => n.startsWith("push:sub:")).length, 0);
});
test("cron: sends one empty VAPID-signed push per due device, marks it sent, drops dead endpoints", async () => {
  const calls = []; const status = { v: 201 };
  const w = boot({ fetchImpl: async (url, init) => { calls.push({ url, init }); return { status: status.v }; } }); w.env.QUIZ_ANSWERS = kv();
  await w.call("/api/push/subscribe", { token: "tokA", body: { endpoint: EP, time: "18:00", tz: "Africa/Cairo" } });
  const run = async iso => { const real = Date.now; Date.now = () => Date.parse(iso); try { await w.sb.worker.scheduled({}, w.env, { waitUntil: p => p }); await new Promise(r => setTimeout(r, 50)); } finally { Date.now = real; } };
  await run("2026-11-27T15:00:00Z"); assert.equal(calls.length, 0, "not due yet");
  await run("2026-11-27T16:05:00Z"); assert.equal(calls.length, 1);
  assert.match(calls[0].init.headers.Authorization, /^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=[\w-]+$/); assert.equal(calls[0].init.body, undefined, "no payload");
  { const [, jwt, pub] = /^vapid t=([^,]+), k=(.+)$/.exec(calls[0].init.headers.Authorization); const [h, c, s] = jwt.split(".");
    const u = x => Uint8Array.from(atob(x.replace(/-/g, "+").replace(/_/g, "/")), ch => ch.charCodeAt(0));
    const key = await crypto.subtle.importKey("raw", u(pub), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    assert.equal(await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, u(s), new TextEncoder().encode(h + "." + c)), true, "JWT signature verifies with the public key");
    assert.equal(JSON.parse(new TextDecoder().decode(u(c))).aud, "https://fcm.googleapis.com"); }
  await run("2026-11-27T16:20:00Z"); assert.equal(calls.length, 1, "once per day");
  status.v = 410; await run("2026-11-28T16:05:00Z"); assert.equal(calls.length, 2);
  assert.equal([...w.env.QUIZ_ANSWERS.m.keys()].filter(n => n.startsWith("push:sub:")).length, 0, "410 removes the device");
});
