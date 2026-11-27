// Daily-reminder Web Push, no payload (so no message encryption). The notification text lives in the page's service worker.
// Stored per device: push endpoint, local reminder time, IANA time zone and the last local date a reminder was sent. No name, email or uid.
export const MAX_PER_RUN = 40;
export const LATE_WINDOW_MIN = 120;
const HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];
export const b64u = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = text => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
export function validTimeZone(tz) { try { new Intl.DateTimeFormat("en", { timeZone: tz }); return typeof tz === "string" && tz.length <= 64; } catch { return false; } }
export function validEndpoint(endpoint) {
  if (typeof endpoint !== "string" || endpoint.length > 600) return false;
  try { const u = new URL(endpoint); return u.protocol === "https:" && !u.username && HOSTS.some(rx => rx.test(u.hostname)); } catch { return false; }
}
export function validSubscription(b) {
  if (!b || typeof b !== "object") return null;
  const time = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(b.time)) ? String(b.time) : null;
  if (!validEndpoint(b.endpoint) || !time || !validTimeZone(b.tz)) return null;
  return { endpoint: b.endpoint, time, tz: b.tz };
}
export function localParts(nowMs, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(nowMs)).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}
// Due once per local day, from the chosen time until LATE_WINDOW_MIN later (a missed cron run still delivers; a late-night push never does).
export function isDue(sub, nowMs) {
  const [h, m] = sub.time.split(":").map(Number); const l = localParts(nowMs, sub.tz); const diff = l.minutes - (h * 60 + m);
  return sub.sent !== l.date && diff >= 0 && diff <= LATE_WINDOW_MIN;
}
export async function generateVapid() {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  return { publicKey: b64u(await crypto.subtle.exportKey("raw", pair.publicKey)), privateJwk: await crypto.subtle.exportKey("jwk", pair.privateKey) };
}
export async function vapidHeader(endpoint, vapid, nowMs, subject = "mailto:noreply@codequest.invalid") {
  const enc = o => b64u(new TextEncoder().encode(JSON.stringify(o)));
  const input = enc({ typ: "JWT", alg: "ES256" }) + "." + enc({ aud: new URL(endpoint).origin, exp: Math.floor(nowMs / 1000) + 12 * 3600, sub: subject });
  const key = await crypto.subtle.importKey("jwk", vapid.privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(input));
  return `vapid t=${input}.${b64u(sig)}, k=${vapid.publicKey}`;
}
export { fromB64u };
