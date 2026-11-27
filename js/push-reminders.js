// Real daily reminder (Web Push) on top of the in-page timer. The Worker keeps only: push endpoint, chosen local time, time zone.
const WORKER = "https://codequest.mariam2009m44.workers.dev";
export const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const toKey = text => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
async function call(user, path, method, body) {
  const headers = { "Content-Type": "application/json" };
  if (user) headers.Authorization = "Bearer " + await user.getIdToken();
  const res = await fetch(WORKER + path, { method, cache: "no-store", headers, body: body ? JSON.stringify(body) : undefined });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}
export async function enablePush(user, time) {
  if (!pushSupported()) return { ok: false, reason: "unsupported" };
  if (Notification.permission !== "granted") return { ok: false, reason: "permission" };
  try {
    await navigator.serviceWorker.register("./sw.js");
    const reg = await navigator.serviceWorker.ready;
    const key = await call(null, "/api/push/key", "GET");
    if (!key.ok || !key.data.publicKey) return { ok: false, reason: "server" };
    const wanted = toKey(key.data.publicKey);
    let sub = await reg.pushManager.getSubscription();
    const current = sub?.options?.applicationServerKey && new Uint8Array(sub.options.applicationServerKey);
    if (sub && current && (current.length !== wanted.length || current.some((b, i) => b !== wanted[i]))) { await sub.unsubscribe(); sub = null; }
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: wanted });
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const saved = await call(user, "/api/push/subscribe", "POST", { endpoint: sub.endpoint, time, tz });
    return saved.ok ? { ok: true } : { ok: false, reason: saved.status === 401 ? "signin" : "server" };
  } catch (error) {
    return { ok: false, reason: "error" };
  }
}
export async function disablePush(user) {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await call(user, "/api/push/unsubscribe", "POST", { endpoint: sub.endpoint }).catch(() => {});
    await sub.unsubscribe();
  } catch {}
}

// Current state for the settings page: permission, service worker, device registration with the Worker (local only: asks the browser).
export async function pushStatus() {
  const out = { supported: pushSupported(), permission: "Notification" in window ? Notification.permission : "unsupported", worker: false, subscribed: false };
  if (!out.supported) return out;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    out.worker = Boolean(reg?.active || reg?.waiting || reg?.installing);
    out.subscribed = Boolean(await reg?.pushManager.getSubscription());
  } catch {}
  return out;
}
// A registration that can show notifications (Android Chrome refuses `new Notification`): register if needed and wait up to 5 s for it to be active.
export async function notificationRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    await navigator.serviceWorker.register("./sw.js");
    return await Promise.race([navigator.serviceWorker.ready, new Promise(resolve => setTimeout(() => resolve(null), 5000))]);
  } catch { return null; }
}
