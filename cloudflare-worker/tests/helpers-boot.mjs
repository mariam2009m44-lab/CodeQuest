import fs from "node:fs";
import vm from "node:vm";
import { checkIntroConcept } from "../studio/concept.mjs";
import * as core from "../progress-core.js";
import * as academy from "../academy-core.js";
import * as parentCore from "../parent-core.js";
const rd = f => JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8"));
const index = rd("../curriculum-index.json"), key = rd("../lesson-answers.json"), practice = rd("../practice-index.json");
export const ORIGIN = "https://codequest-mu-six.vercel.app";
export function boot({ fetchImpl, jose } = {}) {
  let source = fs.readFileSync(new URL("../worker.js", import.meta.url), "utf8");
  source = source.replace(/^import .*;$/gm, "").replace("export default {", "globalThis.worker = {").replace(/export class (\w+)/g, "globalThis.$1 = class $1");
  const sb = { globalThis: null, URL, Response, console: { log() {}, warn() {}, error() {} }, AbortSignal, setTimeout, Date, JSON, Number, Promise, TextEncoder, TextDecoder, Request, Headers, crypto, ...core, ...academy, ...parentCore, checkIntroConcept, CURRICULUM_INDEX: index, LESSON_ANSWERS: key, PRACTICE_INDEX: practice, fetch: fetchImpl,
    createRemoteJWKSet() {},
    // Mock Firebase verification: token names map to claims. Anything else (expired, wrong audience, bad signature) throws like jose.
    async jwtVerify(token, _k, opts) {
      if (opts.audience !== "proj" || opts.issuer !== "https://securetoken.google.com/proj") throw new Error("claim");
      const t = { tokA: { sub: "uidA" }, tokB: { sub: "uidB" }, tokE: { sub: "uidE", email: "Pilot@Example.com", email_verified: true }, tokU: { sub: "uidU", email: "pilot@example.com", email_verified: false }, tokV: { sub: "uidV", email: "v@example.com", email_verified: true }, nosub: {}, colon: { sub: "svc:parent" }, longsub: { sub: "x".repeat(129) } }[token];
      if (!t) throw new Error("jwt invalid or expired");
      return { payload: t };
    } };
  if (jose) { sb.createRemoteJWKSet = jose.createRemoteJWKSet; sb.jwtVerify = jose.jwtVerify; }
  sb.globalThis = sb; vm.runInNewContext(source, sb);
  const stores = new Map();
  const ns = { idFromName: n => n, get: id => { if (!stores.has(id)) { const m = new Map(); stores.set(id, { m, o: new sb.StudentProgress({ storage: { async transaction(fn) { return fn({ get: async k => m.has(k) ? JSON.parse(JSON.stringify(m.get(k))) : undefined, put: async (k, v) => { m.set(k, JSON.parse(JSON.stringify(v))); } }); } } }) }); } const h = stores.get(id); return { fetch: (u, init) => h.o.fetch(new Request(u, init)) }; } };
  // Academy and parent services run as named instances of StudentProgress ("svc:academy", "svc:parent"); these views expose their stores to tests.
  const adirs = { get size() { return stores.has("svc:academy") ? 1 : 0; }, values: () => (stores.has("svc:academy") ? [stores.get("svc:academy")] : []).values(), clear: () => stores.delete("svc:academy") };
  const pls = { get size() { return stores.has("svc:parent") ? 1 : 0; }, get: () => stores.get("svc:parent") };
  const env = { FIREBASE_PROJECT_ID: "proj", ALLOWED_ORIGINS: ORIGIN, STUDENT_PROGRESS: ns, PROGRESS_WRITES: "on" };
  const call = (path, { token, body, method = "POST", origin = ORIGIN, raw, headers: extra } = {}) => sb.worker.fetch(new Request("https://w.test" + path, { method, headers: { "Content-Type": "application/json", ...(extra || {}), ...(origin ? { Origin: origin } : {}), ...(token ? { Authorization: token.startsWith("Bearer") || token.startsWith("Basic") ? token : "Bearer " + token } : {}) }, body: method === "GET" ? undefined : (raw ?? JSON.stringify(body ?? {})) }), env).then(async r => ({ status: r.status, h: r.headers, data: await r.json().catch(() => null) }));
  return { call, stores, adirs, pls, sb, env };
}
