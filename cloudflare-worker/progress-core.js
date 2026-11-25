// Server-side progress rules. Pure functions: no I/O, so they are unit tested.
// The client never sends a score. It sends choices (and, later, server-run code results);
// the server recomputes the score from the trusted curriculum index.
export const MCQ_POINTS = 1, CODE_POINTS = 2, PASS_PERCENT = 50;
export const MAX_CHOICES = 40;

export function emptyState() { return { lessons: {}, exams: {}, resume: {} }; }

export const MAX_DRAFT = 20000, DRAFT_RETENTION_MS = 30 * 24 * 3600 * 1000;
export const RESUME_PHASES = ["prediction", "worked", "practice", "explanation", "transfer", "complete"];

// Private resume checkpoint. Never used for scoring, never in public records.
// Newer client checkpoint (savedAt) wins, so an older device cannot overwrite a newer one.
export function saveResume(state, index, { language, lessonId, phase, draft, savedAt }, nowMs) {
  const meta = index.lessons[lessonId];
  if (!meta || meta.language !== language) return { ok: false, reason: "unknown_lesson" };
  if (!RESUME_PHASES.includes(phase)) return { ok: false, reason: "bad_phase" };
  if (draft !== undefined && draft !== null && (typeof draft !== "string" || draft.length > MAX_DRAFT)) return { ok: false, reason: "bad_draft" };
  if (!Number.isInteger(savedAt) || savedAt <= 0 || savedAt > nowMs + 5 * 60 * 1000) return { ok: false, reason: "bad_time" };
  state.resume = state.resume || {};
  const cur = state.resume[language];
  if (cur && cur.savedAt >= savedAt) return { ok: true, stale: true, resume: publicResume(cur, nowMs) };
  // A completed lesson keeps no draft.
  const done = state.lessons[lessonId] && phase === "complete";
  state.resume[language] = { lessonId, phase, draft: done || draft == null ? "" : draft, savedAt, storedAt: nowMs };
  return { ok: true, stale: false, resume: publicResume(state.resume[language], nowMs) };
}

export function publicResume(r, nowMs) {
  const expired = nowMs - r.storedAt > DRAFT_RETENTION_MS;
  return { lessonId: r.lessonId, phase: r.phase, draft: expired ? "" : r.draft, savedAt: r.savedAt };
}

// Drops expired drafts. Returns number removed.
export function purgeExpired(state, nowMs) {
  let n = 0;
  for (const [lang, r] of Object.entries(state.resume || {})) if (nowMs - r.storedAt > DRAFT_RETENTION_MS) { r.draft = ""; n++; }
  return n;
}

export function resumeView(state, nowMs) {
  const out = {};
  for (const [lang, r] of Object.entries(state.resume || {})) out[lang] = publicResume(r, nowMs);
  return out;
}

export function recordLesson(state, index, { language, lessonId, version }) {
  const meta = index.lessons[lessonId];
  if (!meta || meta.language !== language) return { ok: false, reason: "unknown_lesson" };
  if (typeof version !== "string" || version.length === 0 || version.length > 64) return { ok: false, reason: "bad_version" };
  const key = lessonId;
  const r = state.resume && state.resume[language];
  if (r && r.lessonId === lessonId) { r.draft = ""; r.phase = "complete"; }
  // Replay is idempotent: the first accepted record for a lesson and version wins.
  if (state.lessons[key] && state.lessons[key].version === version) return { ok: true, replay: true, state };
  // A bare lesson record is self-reported (the browser ran the steps). It is stored for resume only.
  state.lessons[key] = { version, verified: false, at: 0 };
  return { ok: true, replay: false, state };
}

// choices: array of option indexes (or null) in the quiz's MCQ order.
// codeResults: array of booleans, only from server-side execution; absent means not verified.
export function scoreExam(index, { language, unit, choices, codeResults }) {
  const quiz = index.quizzes[`${language}-${unit}`];
  if (!quiz) return { ok: false, reason: "unknown_exam" };
  if (!Array.isArray(choices) || choices.length !== quiz.mcq.length || choices.length > MAX_CHOICES) return { ok: false, reason: "bad_choices" };
  let earned = 0, total = 0;
  const missed = new Set();
  quiz.mcq.forEach((item, i) => {
    total += MCQ_POINTS;
    const c = choices[i];
    if (!Number.isInteger(c) || c < 0 || c >= item.n) { missed.add(item.lesson); return; }
    if (c === item.answer) earned += MCQ_POINTS; else missed.add(item.lesson);
  });
  const codeVerified = Array.isArray(codeResults) && codeResults.length === quiz.code.length;
  quiz.code.forEach((item, i) => {
    total += CODE_POINTS;
    if (codeVerified && codeResults[i] === true) earned += CODE_POINTS; else missed.add(item.lesson);
  });
  const percent = total ? Math.round(earned * 100 / total) : 0;
  return { ok: true, earned, total, percent, passed: percent >= PASS_PERCENT, codeVerified, missedLessons: [...missed] };
}

export function recordExam(state, index, input, version) {
  if (typeof version !== "string" || version.length === 0 || version.length > 64) return { ok: false, reason: "bad_version" };
  const scored = scoreExam(index, input);
  if (!scored.ok) return scored;
  const key = `${input.language}-${input.unit}`;
  const prev = state.exams[key];
  // Keep the best verified result; a lower later attempt never removes a pass.
  const keep = prev && prev.percent >= scored.percent ? prev : { percent: scored.percent, passed: scored.passed, codeVerified: scored.codeVerified, version };
  state.exams[key] = keep;
  return { ok: true, result: scored, best: keep };
}

// Public identity for a certificate: opt-in only, and never derived from the uid.
export function publicCertificateRecord({ displayName, language, issuedAtMs, randomId }) {
  const name = typeof displayName === "string" ? displayName.trim().slice(0, 60) : "";
  if (!name || !/^[a-f0-9]{32}$/.test(randomId)) return null;
  return { id: randomId, name, track: language, issuedAt: issuedAtMs };
}
