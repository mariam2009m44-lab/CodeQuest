// Regenerates the server artifacts from the PUBLIC question banks. Run after any bank edit; CI test checks they are in sync.
import fs from "node:fs";
import { lessonBankHash, quizBankHash } from "../bank-hash.js";
const rd = f => JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8"));
const lessons = rd("../../learning-studio/lesson-tests.json"), quizzes = rd("../../learning-studio/quizzes.json"), index = rd("../curriculum-index.json");
const key = {};
for (const [id, items] of Object.entries(lessons)) key[id] = { h: lessonBankHash(items), a: items.map(q => q.answer) };
for (const [k, q] of Object.entries(quizzes)) { if (!index.quizzes[k]) throw new Error("quiz missing in index: " + k); index.quizzes[k].h = quizBankHash(q); }
fs.writeFileSync(new URL("../lesson-answers.json", import.meta.url), JSON.stringify(key));
fs.writeFileSync(new URL("../curriculum-index.json", import.meta.url), JSON.stringify(index));
console.log("lessons", Object.keys(key).length, "quizzes", Object.keys(quizzes).length);
