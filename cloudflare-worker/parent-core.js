// Pure parent-link logic (no I/O, not wired to any route yet). Codes are stored only as hashes. Every read must call canRead at read time.
// Thresholds are PROVISIONAL, not user-approved policy.
export const CODE_TTL_MS = 30 * 60 * 1000;
export const MAX_ACTIVE_CODES = 3;
export const MAX_FAILED_CLAIMS_PER_HOUR = 10;
export const MAX_PARENTS_PER_CHILD = 4;
export const MAX_CHILDREN_PER_PARENT = 10;
export function emptyLinks() { return { codes: {}, links: {}, fails: {} }; }
const key = (child, parent) => child + "\u0000" + parent;
// Expired and used codes stay for 24 h as small markers, so a late or repeated entry gets a specific answer instead of "wrong code".
function prune(s, now) { for (const h of Object.keys(s.codes)) { const c = s.codes[h]; const ended = c.claimed ? (c.claimedAt || c.exp) : c.exp; if (ended <= now && now - ended > 86400000) delete s.codes[h]; } }
export function createCode(s, child, hash, now) {
  prune(s, now);
  const active = Object.values(s.codes).filter(c => c.child === child && !c.claimed && c.exp > now);
  if (active.length >= MAX_ACTIVE_CODES) return { ok: false, status: 429, reason: "too_many_active_codes" };
  s.codes[hash] = { child, exp: now + CODE_TTL_MS, claimed: false };
  return { ok: true, expiresAt: now + CODE_TTL_MS };
}
// Atomic when run inside one storage transaction: the code flips to claimed and the link is written in the same step.
export function claimCode(s, parent, hash, now) {
  const hour = Math.floor(now / 3600000); const f = s.fails[parent] && s.fails[parent].h === hour ? s.fails[parent] : { h: hour, n: 0 };
  if (f.n >= MAX_FAILED_CLAIMS_PER_HOUR) return { ok: false, status: 429, reason: "too_many_attempts" };
  const c = s.codes[hash];
  const fail = reason => { f.n += 1; s.fails[parent] = f; return { ok: false, status: 404, reason, failed: true }; };
  if (!c) return fail("code_invalid");
  if (c.claimed) return fail("code_used");
  if (c.exp <= now) return fail("code_expired");
  // Own code entered in the same account: say so (the code is the caller's own, so nothing is revealed) and do not count it as a failed guess.
  if (c.child === parent) return { ok: false, status: 400, reason: "self_link" };
  const parents = Object.keys(s.links).filter(k => k.startsWith(c.child + "\u0000")).length;
  const children = Object.keys(s.links).filter(k => k.endsWith("\u0000" + parent)).length;
  if (!s.links[key(c.child, parent)] && (parents >= MAX_PARENTS_PER_CHILD || children >= MAX_CHILDREN_PER_PARENT)) return { ok: false, status: 409, reason: "link_limit" };
  c.claimed = true; c.claimedAt = now; s.links[key(c.child, parent)] = { at: now };
  return { ok: true, child: c.child };
}
// Authorization at read time. Call it again after reading the child's data and drop the data if it is no longer linked.
export function canRead(s, parent, child) { return Boolean(s.links[key(child, parent)]); }
export function childrenOf(s, parent) { return Object.keys(s.links).filter(k => k.endsWith("\u0000" + parent)).map(k => k.split("\u0000")[0]); }
export function parentsOf(s, child) { return Object.keys(s.links).filter(k => k.startsWith(child + "\u0000")).map(k => ({ parentUid: k.split("\u0000")[1], at: s.links[k].at })); }
// Either side may unlink; effective immediately for every later canRead.
export function unlink(s, actor, child, parent) {
  if (actor !== child && actor !== parent) return { ok: false, status: 403, reason: "forbidden" };
  if (!s.links[key(child, parent)]) return { ok: false, status: 404, reason: "not_linked" };
  delete s.links[key(child, parent)];
  for (const h of Object.keys(s.codes)) if (s.codes[h].child === child && !s.codes[h].claimed) delete s.codes[h];
  return { ok: true };
}
