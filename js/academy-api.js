// Academy calls on the free Worker path. When the server switch is off (503 academy_off / academy_unavailable) or the Worker is unreachable, callers fall back to the Firebase callables.
const WORKER = "https://codequest.mariam2009m44.workers.dev";
export async function academyWorker(user, path, body) {
  try {
    const token = await user.getIdToken();
    const res = await fetch(WORKER + "/api/academy/" + path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify(body || {}) });
    const data = await res.json().catch(() => ({}));
    const off = res.status === 503 && (data.message === "academy_off" || data.message === "academy_unavailable");
    return { ok: res.ok, status: res.status, data, off, unreachable: false };
  } catch { return { ok: false, status: 0, data: {}, off: false, unreachable: true }; }
}
