import fs from "node:fs";
import path from "node:path";

const curriculumFiles = [
  ["python", "json/python_curriculum.json"],
  ["javascript", "json/js_curriculum.json"],
  ["cpp", "json/cpp_curriculum.json"]
];

const failures = [];
const summary = [];

function fail(message) {
  failures.push(message);
}

for (const [language, filename] of curriculumFiles) {
  const absolutePath = path.resolve(filename);
  let data;

  try {
    data = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    fail(`${filename}: cannot read valid JSON (${error.message})`);
    continue;
  }

  if (!data || !Array.isArray(data.chapters) || data.chapters.length === 0) {
    fail(`${filename}: chapters must be a non-empty array`);
    continue;
  }

  const seenIds = new Set();
  let lessonCount = 0;

  data.chapters.forEach((chapter, chapterIndex) => {
    const chapterLabel = `${language} chapter ${chapterIndex + 1}`;

    if (!chapter || typeof chapter.title !== "string" || !chapter.title.trim()) {
      fail(`${filename}: ${chapterLabel} has no title`);
    }

    if (!Array.isArray(chapter?.lessons) || chapter.lessons.length === 0) {
      fail(`${filename}: ${chapterLabel} has no lessons`);
      return;
    }

    chapter.lessons.forEach((lesson, lessonIndex) => {
      lessonCount += 1;
      const label = `${language} chapter ${chapterIndex + 1}, lesson ${lessonIndex + 1}`;

      if (!lesson || typeof lesson !== "object" || Array.isArray(lesson)) {
        fail(`${filename}: ${label} is not an object`);
        return;
      }

      if (typeof lesson.id !== "string" || !lesson.id.trim()) {
        fail(`${filename}: ${label} needs a stable string ID`);
      } else if (seenIds.has(lesson.id)) {
        fail(`${filename}: duplicate lesson ID "${lesson.id}"`);
      } else {
        seenIds.add(lesson.id);
      }

      for (const field of ["title", "objective", "cody_intro", "task"]) {
        if (typeof lesson[field] !== "string" || !lesson[field].trim()) {
          fail(`${filename}: ${label} is missing ${field}`);
        }
      }

      if (
        !Array.isArray(lesson.hints) ||
        lesson.hints.length === 0 ||
        !lesson.hints.every(hint => typeof hint === "string" && hint.trim())
      ) {
        fail(`${filename}: ${label} needs one or more non-empty hints`);
      }

      const starter = lesson.starter_code ?? lesson.code_example ?? lesson.code;
      if (typeof starter !== "string" || !starter.trim()) {
        fail(`${filename}: ${label} needs starter code or a worked example`);
      }

      const quiz = lesson.quiz;
      if (
        !quiz ||
        typeof quiz.question !== "string" ||
        !quiz.question.trim() ||
        !Array.isArray(quiz.options) ||
        quiz.options.length < 2 ||
        !quiz.options.every(option => typeof option === "string" && option.trim()) ||
        !Number.isInteger(quiz.correct_index) ||
        quiz.correct_index < 0 ||
        quiz.correct_index >= quiz.options.length
      ) {
        fail(`${filename}: ${label} has an invalid quiz`);
      }
    });
  });

  summary.push({ language, chapters: data.chapters.length, lessons: lessonCount });
}

if (failures.length) {
  console.error("Curriculum validation failed:");
  for (const failure of failures) console.error(" - " + failure);
  process.exitCode = 1;
} else {
  console.log("Curriculum validation passed:");
  for (const item of summary) {
    console.log(` - ${item.language}: ${item.chapters} chapters, ${item.lessons} lessons`);
  }
}
