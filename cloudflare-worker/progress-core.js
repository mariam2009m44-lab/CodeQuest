// Server-side progress rules. Pure functions: no I/O, so they are unit tested.
// The client never sends a score. It sends choices (and, later, server-run code results);
// the server recomputes the score from the trusted curriculum index.
export const MCQ_POINTS = 1, CODE_POINTS = 2, PASS_PERCENT = 50;
export const MAX_CHOICES = 40;

export function emptyState() { return { lessons: {}, exams: {}, resume: {} }; }

export const MAX_DRAFT = 20000, DRAFT_RETENTION_MS = 30 * 24 * 3600 * 1000;
export const RESUME_PHASES = ["prediction", "worked", "practice", "explanation", "transfer", "complete"];

// Private resume checkpoint. Never used for scoring, never in public records.
// Conflict handling does not trust device clocks: every accepted write gets a server revision.
// A write built on the latest revision (baseRev) is accepted as is. A write built on an older
// revision is a conflict and is ordered by its time after correcting for the device's clock
// offset (server now minus the device's own sentAt). Skew above 30 days is rejected.
export const MAX_SKEW_MS = 30 * 24 * 3600 * 1000;
export function saveResume(state, index, { language, lessonId, phase, draft, savedAt, sentAt, baseRev }, nowMs) {
  const meta = index.lessons[lessonId];
  if (!meta || meta.language !== language) return { ok: false, reason: "unknown_lesson" };
  if (!RESUME_PHASES.includes(phase)) return { ok: false, reason: "bad_phase" };
  if (draft !== undefined && draft !== null && (typeof draft !== "string" || draft.length > MAX_DRAFT)) return { ok: false, reason: "bad_draft" };
  if (!Number.isInteger(savedAt) || !Number.isInteger(sentAt) || savedAt <= 0 || sentAt <= 0) return { ok: false, reason: "bad_time" };
  if (savedAt > sentAt + 5 * 60 * 1000) return { ok: false, reason: "bad_time" };
  const skew = nowMs - sentAt;
  if (Math.abs(skew) > MAX_SKEW_MS) return { ok: false, reason: "bad_time" };
  if (baseRev !== undefined && baseRev !== null && (!Number.isInteger(baseRev) || baseRev < 0)) return { ok: false, reason: "bad_rev" };
  state.resume = state.resume || {};
  const adj = Math.min(savedAt + skew, nowMs);
  const cur = state.resume[language];
  const sequential = !cur || baseRev === cur.rev;
  if (!sequential && adj <= cur.adj) return { ok: true, stale: true, resume: publicResume(cur, nowMs) };
  const done = state.lessons[lessonId] && phase === "complete";
  state.resume[language] = { lessonId, phase, draft: done || draft == null ? "" : draft, adj, rev: (cur?.rev ?? 0) + 1, storedAt: nowMs };
  return { ok: true, stale: false, resume: publicResume(state.resume[language], nowMs) };
}

export function publicResume(r, nowMs) {
  const expired = nowMs - r.storedAt > DRAFT_RETENTION_MS;
  return { lessonId: r.lessonId, phase: r.phase, draft: expired ? "" : r.draft, savedAt: r.adj, rev: r.rev };
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

// ---- Server grading of per-lesson tests (anti-tamper, not secrecy) ----
// The question bank is public (learning-studio/lesson-tests.json), so the answer key here only stops a forged score.
// key: { lessonId: [correctOptionIndex, ...] }. picks are the ORIGINAL option indexes the learner chose (null = unanswered).
export function gradeLessonTest(index, key, { language, lessonId, picks }) {
  const meta = index.lessons[lessonId];
  if (!meta || meta.language !== language) return { ok: false, reason: "unknown_lesson" };
  const answers = key[lessonId];
  if (!Array.isArray(answers) || answers.length === 0) return { ok: false, reason: "no_test" };
  if (!Array.isArray(picks) || picks.length !== answers.length) return { ok: false, reason: "bad_picks" };
  let earned = 0, answered = 0;
  const missed = [];
  answers.forEach((a, i) => {
    const p = picks[i];
    if (p !== null && !(Number.isInteger(p) && p >= 0 && p <= 2)) { missed.push(i); return; }
    if (p !== null) answered += 1;
    if (p === a) earned += 1; else missed.push(i);
  });
  if (picks.some(p => p !== null && !(Number.isInteger(p) && p >= 0 && p <= 2))) return { ok: false, reason: "bad_picks" };
  const total = answers.length;
  // Exact integer rule: 50 percent inclusive, only when every question was answered.
  const passed = answered === total && earned * 100 >= PASS_PERCENT * total;
  return { ok: true, earned, total, percent: Math.round(earned * 100 / total), passed, missed };
}

export function recordLessonTest(state, index, key, input, version) {
  if (typeof version !== "string" || version.length === 0 || version.length > 64) return { ok: false, reason: "bad_version" };
  const g = gradeLessonTest(index, key, input);
  if (!g.ok) return g;
  state.lessonTests = state.lessonTests || {};
  const prev = state.lessonTests[input.lessonId];
  // Best result wins; a later lower attempt never removes a pass.
  const keep = prev && (prev.passed || prev.percent > g.percent) ? prev : { percent: g.percent, passed: g.passed, version };
  state.lessonTests[input.lessonId] = keep;
  return { ok: true, result: g, best: keep };
}

// Code tasks are still self-reported by the browser. Until server-side execution is wired, issuance stays blocked.
export const CODE_TASK_VERIFICATION_WIRED = false;
// Python is the only track with a final comprehensive exam in the current curriculum (python-exam.html).
export const FINAL_EXAM_TRACKS = ["python"];

export function certificateEligibility(state, index, language) {
  const blockers = [];
  const lessonIds = Object.keys(index.lessons).filter(id => index.lessons[id].language === language);
  if (lessonIds.length === 0) return { eligible: false, blockers: ["unknown_track"] };
  const lt = state.lessonTests || {};
  const missingTests = lessonIds.filter(id => !(lt[id] && lt[id].passed));
  if (missingTests.length) blockers.push({ code: "lesson_tests", remaining: missingTests.length, of: lessonIds.length });
  const unitKeys = Object.keys(index.quizzes).filter(k => k.startsWith(language + "-"));
  const missingUnits = unitKeys.filter(k => !(state.exams[k] && state.exams[k].passed));
  if (missingUnits.length) blockers.push({ code: "unit_exams", remaining: missingUnits.length, of: unitKeys.length });
  if (FINAL_EXAM_TRACKS.includes(language)) {
    const f = state.finals && state.finals[language];
    if (!(f && f.passed)) blockers.push({ code: "final_exam" });
  }
  if (!CODE_TASK_VERIFICATION_WIRED) blockers.push({ code: "code_tasks_not_server_verified" });
  return { eligible: blockers.length === 0, blockers };
}
