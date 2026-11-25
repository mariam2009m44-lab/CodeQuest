// REAL jose signature, issuer, audience, expiry and algorithm checks through the Worker's unchanged verifyFirebaseUser.
// Only the key SOURCE differs: a local JWKS built from a generated test key replaces Google's remote JWKS. No Firebase token, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as jose from "jose";
import { boot } from "./helpers-boot.mjs";
const key = JSON.parse(fs.readFileSync(new URL("../lesson-answers.json", import.meta.url), "utf8"));
const id = "py-1-1";
const body = { language: "python", lessonId: id, version: "v1", bank: key[id].h, picks: key[id].a };
const ISS = "https://securetoken.google.com/proj";
const { publicKey, privateKey } = await jose.generateKeyPair("RS256", { extractable: true });
const other = await jose.generateKeyPair("RS256", { extractable: true });
const jwk = { ...(await jose.exportJWK(publicKey)), kid: "k1", alg: "RS256", use: "sig" };
const localSet = jose.createLocalJWKSet({ keys: [jwk] });
const real = { createRemoteJWKSet: () => localSet, jwtVerify: jose.jwtVerify };
const sign = async ({ sub = "realUid", iss = ISS, aud = "proj", exp = "1h", pk = privateKey, alg = "RS256", kid = "k1" } = {}) => {
  let j = new jose.SignJWT(sub === null ? {} : { sub }).setProtectedHeader({ alg, kid }).setIssuer(iss).setAudience(aud).setIssuedAt();
  j = typeof exp === "number" ? j.setExpirationTime(exp) : j.setExpirationTime(exp);
  return j.sign(pk);
};
const status = async token => { const { call } = boot({ jose: real }); return (await call("/api/progress/lesson-test", { token, body })).status; };
test("valid RS256 token with right issuer/audience: accepted, uid comes from sub", async () => {
  const { call, stores } = boot({ jose: real });
  const r = await call("/api/progress/lesson-test", { token: await sign(), body });
  assert.equal(r.status, 200);
  assert.ok(stores.has("realUid"), "state lives under the token's sub");
});
test("expired token rejected", async () => assert.equal(await status(await sign({ exp: Math.floor(Date.now() / 1000) - 120 })), 401));
test("wrong audience and wrong issuer rejected", async () => { assert.equal(await status(await sign({ aud: "other" })), 401); assert.equal(await status(await sign({ iss: "https://securetoken.google.com/other" })), 401); });
test("token signed by a different key rejected (bad signature)", async () => assert.equal(await status(await sign({ pk: other.privateKey })), 401));
test("unknown kid rejected", async () => assert.equal(await status(await sign({ kid: "nope" })), 401));
test("alg confusion: HS256 token signed with the public key text, and alg none, are rejected", async () => {
  const hs = await new jose.SignJWT({ sub: "evil" }).setProtectedHeader({ alg: "HS256", kid: "k1" }).setIssuer(ISS).setAudience("proj").setExpirationTime("1h").sign(new TextEncoder().encode(JSON.stringify(jwk)));
  assert.equal(await status(hs), 401);
  const none = [Buffer.from('{"alg":"none"}').toString("base64url"), Buffer.from(JSON.stringify({ sub: "evil", iss: ISS, aud: "proj", exp: 9999999999 })).toString("base64url"), ""].join(".");
  assert.equal(await status(none), 401);
});
test("missing sub rejected", async () => assert.equal(await status(await sign({ sub: null })), 401));
