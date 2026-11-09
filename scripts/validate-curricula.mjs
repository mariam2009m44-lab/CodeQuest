import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

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

// Validate the active Python route as well as the separate JSON curriculum.
// Chapter files only construct data objects; their challenge callbacks are not executed here.
const activePythonWindow = { CHAPTERS: {} };
for (let chapterId = 1; chapterId <= 12; chapterId += 1) {
  const filename = `js/chapters/ch${chapterId}.js`;
  try {
    const source = fs.readFileSync(path.resolve(filename), "utf8");
    vm.runInNewContext(source, { window: activePythonWindow }, {
      filename,
      timeout: 1000
    });
  } catch (error) {
    fail(`${filename}: cannot load chapter data (${error.message})`);
  }
}

let activePythonLessons = 0;
let activePythonExams = 0;
for (let chapterId = 1; chapterId <= 12; chapterId += 1) {
  const chapter = activePythonWindow.CHAPTERS[chapterId];
  if (!chapter || !Array.isArray(chapter.lessons) || chapter.lessons.length === 0) {
    fail(`Active Python chapter ${chapterId}: no lessons found`);
    continue;
  }

  chapter.lessons.forEach((lesson, lessonIndex) => {
    const label = `Active Python chapter ${chapterId}, lesson ${lessonIndex + 1}`;
    if (!lesson || typeof lesson.title !== "string" || !lesson.title.trim()) {
      fail(`${label}: missing title`);
    }
    if (!Array.isArray(lesson?.steps) || lesson.steps.length === 0) {
      fail(`${label}: missing lesson steps`);
      return;
    }

    const types = lesson.steps.map(step => String(step?.type || "text").toLowerCase());
    const challenges = lesson.steps.filter(step =>
      ["challenge", "code", "coding"].includes(String(step?.type || "").toLowerCase())
    );
    const quizzes = lesson.steps.filter(step =>
      ["quiz", "question"].includes(String(step?.type || "").toLowerCase())
    );

    if (!challenges.length) fail(`${label}: needs at least one coding challenge`);
    for (const challenge of challenges) {
      if (
        typeof challenge.expected !== "string" ||
        typeof challenge.defaultCode !== "string" ||
        typeof challenge.check !== "function"
      ) {
        fail(`${label}: challenge is missing expected output, starter code, or checker`);
      }
    }

    for (const quiz of quizzes) {
      if (
        typeof quiz.question !== "string" ||
        !Array.isArray(quiz.options) ||
        quiz.options.length < 2 ||
        !Number.isInteger(quiz.correct) ||
        quiz.correct < 0 ||
        quiz.correct >= quiz.options.length
      ) {
        fail(`${label}: invalid quiz step`);
      }
    }

    for (const type of types) {
      if (!["cody", "choice", "challenge", "code", "coding", "quiz", "question", "game", "example", "text"].includes(type)) {
        fail(`${label}: unsupported step type "${type}"`);
      }
    }

    if (types.includes("game")) {
      const gameStep = lesson.steps.find(step => String(step?.type || "").toLowerCase() === "game");
      if (typeof gameStep?.text !== "string" || !gameStep.text.trim()) {
        fail(`${label}: game step needs explanatory text`);
      }
    }

    if (lessonIndex === chapter.lessons.length - 1) activePythonExams += 1;
    else activePythonLessons += 1;
  });
}

summary.push({
  language: "python-active",
  chapters: 12,
  lessons: activePythonLessons,
  chapterExams: activePythonExams
});

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
