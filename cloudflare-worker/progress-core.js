// Server-side progress rules. Pure functions: no I/O, so they are unit tested.
// The client never sends a score. It sends choices (and, later, server-run code results);
// the server recomputes the score from the trusted curriculum index.
export const MCQ_POINTS = 1, CODE_POINTS = 2, PASS_PERCENT = 50;
export const MAX_CHOICES = 40;

export function emptyState() { return { lessons: {}, exams: {} }; }

export function recordLesson(state, index, { language, lessonId, version }) {
  const meta = index.lessons[lessonId];
  if (!meta || meta.language !== language) return { ok: false, reason: "unknown_lesson" };
  if (typeof version !== "string" || version.length === 0 || version.length > 64) return { ok: false, reason: "bad_version" };
  const key = lessonId;
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
