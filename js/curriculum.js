
const CURRICULUM_FILES = Object.freeze({
  python: "./json/python_curriculum.json",
  javascript: "./json/js_curriculum.json",
  cpp: "./json/cpp_curriculum.json"
});

export const curriculum = Object.create(null);

function validateQuiz(quiz, location) {
  if (quiz == null) return null;

  const questions = Array.isArray(quiz) ? quiz : [quiz];

  for (const [index, question] of questions.entries()) {
    const label = questions.length > 1
      ? `${location}، السؤال ${index + 1}`
      : location;

    if (
      !question ||
      typeof question !== "object" ||
      typeof question.question !== "string" ||
      !question.question.trim() ||
      !Array.isArray(question.options) ||
      question.options.length < 2 ||
      !question.options.every(option => typeof option === "string") ||
      !Number.isInteger(question.correct_index) ||
      question.correct_index < 0 ||
      question.correct_index >= question.options.length
    ) {
      throw new Error(`بيانات الاختبار غير صحيحة: ${label}`);
    }
  }

  return quiz;
}

function validateLesson(lesson, language, chapterIndex, lessonIndex) {
  const location =
    `${language}، الفصل ${chapterIndex + 1}، الدرس ${lessonIndex + 1}`;

  if (!lesson || typeof lesson !== "object" || Array.isArray(lesson)) {
    throw new Error(`بيانات الدرس غير صحيحة: ${location}`);
  }

  if (typeof lesson.title !== "string" || !lesson.title.trim()) {
    throw new Error(`عنوان الدرس مفقود: ${location}`);
  }

  if (
    lesson.hints !== undefined &&
    (!Array.isArray(lesson.hints) ||
      !lesson.hints.every(hint => typeof hint === "string"))
  ) {
    throw new Error(`التلميحات غير صحيحة: ${location}`);
  }

  const quiz = validateQuiz(lesson.quiz, location);

  return {
    ...lesson,
    id: lesson.id || `${language}-${chapterIndex}-${lessonIndex}`,
    objective: lesson.objective || "",
    cody_intro: lesson.cody_intro || "",
    task: lesson.task || "",
    hints: lesson.hints || [],
    code_example: lesson.code_example ?? lesson.code ?? "",
    desc:
      lesson.objective ||
      lesson.description ||
      lesson.cody_intro ||
      "",
    description:
      lesson.description ||
      lesson.objective ||
      "",
    quiz
  };
}

function validateCurriculum(data, expectedLanguage) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`بيانات منهج ${expectedLanguage} غير صحيحة.`);
  }

  if (data.language && data.language !== expectedLanguage) {
    throw new Error(`لغة المنهج لا تطابق الملف: ${expectedLanguage}.`);
  }

  if (!Array.isArray(data.chapters) || data.chapters.length === 0) {
    throw new Error(`منهج ${expectedLanguage} لا يحتوي على فصول.`);
  }

  const chapters = data.chapters.map((chapter, chapterIndex) => {
    if (
      !chapter ||
      typeof chapter !== "object" ||
      !Array.isArray(chapter.lessons) ||
      chapter.lessons.length === 0
    ) {
      throw new Error(
        `الفصل ${chapterIndex + 1} في منهج ${expectedLanguage} غير صحيح أو فارغ.`
      );
    }

    return {
      ...chapter,
      id: chapter.id || `${expectedLanguage}-chapter-${chapterIndex}`,
      title: chapter.title || `الفصل ${chapterIndex + 1}`,
      lessons: chapter.lessons.map((lesson, lessonIndex) =>
        validateLesson(
          lesson,
          expectedLanguage,
          chapterIndex,
          lessonIndex
        )
      )
    };
  });

  return {
    ...data,
    language: expectedLanguage,
    title: data.title || `مسار ${expectedLanguage}`,
    chapters
  };
}

async function loadCurriculum(language, file) {
  const response = await fetch(file, { cache: "no-cache" });

  if (!response.ok) {
    throw new Error(
      `تعذر تحميل منهج ${language}. رمز الاستجابة: ${response.status}`
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(`ملف منهج ${language} ليس JSON صالحًا.`);
  }

  return validateCurriculum(data, language);
}

const results = await Promise.allSettled(
  Object.entries(CURRICULUM_FILES).map(async ([language, file]) => ({
    language,
    data: await loadCurriculum(language, file)
  }))
);

const errors = [];

for (let index = 0; index < results.length; index++) {
  const result = results[index];

  if (result.status === "fulfilled") {
    curriculum[result.value.language] = result.value.data.chapters;
  } else {
    const language = Object.keys(CURRICULUM_FILES)[index];

    errors.push(
      `${language}: ${result.reason?.message || "خطأ غير معروف"}`
    );

    console.error(`فشل تحميل منهج ${language}:`, result.reason);
  }
}

if (errors.length > 0) {
  throw new Error(
    "تعذر تحميل ملفات المناهج:\n" + errors.join("\n")
  );
}

export function readSelection(search = location.search) {
  const parameters = new URLSearchParams(search);
  const language = parameters.get("lang") || "python";

  if (!Object.hasOwn(curriculum, language)) {
    throw new Error("مسار البرمجة المطلوب غير موجود.");
  }

  function readIndex(key) {
    const value = parameters.get(key) ?? "0";

    if (!/^\d+$/.test(value)) {
      throw new Error("رابط الدرس غير صحيح.");
    }

    const number = Number(value);

    if (!Number.isSafeInteger(number)) {
      throw new Error("رقم الفصل أو الدرس غير صالح.");
    }

    return number;
  }

  return {
    language,
    chapterIndex: readIndex("chapter"),
    lessonIndex: readIndex("lesson")
  };
}

export function getLesson(selection) {
  const chapters = curriculum[selection?.language];
  const chapter = chapters?.[selection?.chapterIndex];
  const lesson = chapter?.lessons?.[selection?.lessonIndex];

  if (!lesson) {
    throw new Error("الدرس المطلوب غير موجود في المنهج.");
  }

  return lesson;
}

export function getNextLesson(selection) {
  const chapters = curriculum[selection?.language];

  if (!chapters) {
    throw new Error("مسار البرمجة المطلوب غير موجود.");
  }

  const chapter = chapters[selection.chapterIndex];

  if (!chapter || !chapter.lessons[selection.lessonIndex]) {
    throw new Error("الدرس الحالي غير موجود.");
  }

  if (selection.lessonIndex + 1 < chapter.lessons.length) {
    return {
      ...selection,
      lessonIndex: selection.lessonIndex + 1
    };
  }

  if (selection.chapterIndex + 1 < chapters.length) {
    return {
      ...selection,
      chapterIndex: selection.chapterIndex + 1,
      lessonIndex: 0
    };
  }

  return null;
}

export function lessonUrl(selection) {
  if (!curriculum[selection?.language]) {
    throw new Error("مسار البرمجة المطلوب غير موجود.");
  }

  getLesson(selection);

  const params = new URLSearchParams({
    lang: selection.language,
    chapter: String(selection.chapterIndex),
    lesson: String(selection.lessonIndex)
  });

  return `lecture.html?${params.toString()}`;
}
