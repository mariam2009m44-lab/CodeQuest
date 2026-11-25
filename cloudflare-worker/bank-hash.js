// Identity of a question bank, shared byte-for-byte by the Worker and the browser (copy in learning-studio/bank-hash.mjs).
// The hash covers question text, code, option text and order, and the answer index, so any change to a question changes it.
export function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}
export const lessonBankHash = items => cyrb53(JSON.stringify(items.map(it => [it.q, it.code ?? "", it.run ?? "", it.options, it.answer])));
export const quizBankHash = quiz => cyrb53(JSON.stringify([
  quiz.mcq.map(m => [m.lesson, m.q, m.options, m.answer]),
  quiz.code.map(c => [c.lesson, c.task, c.starter ?? "", (c.tests || []).map(t => [t.stdin, t.expected])])
]));
