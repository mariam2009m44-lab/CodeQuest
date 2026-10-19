const sources = {
  python: "python_curriculum.json",
  javascript: "js_curriculum.json",
  cpp: "cpp_curriculum.json"
};

export const curriculum = {};

for (const [language, filename] of Object.entries(sources)) {
  try {
    const response = await fetch(`json/${filename}`, { cache: "no-cache" });
    if (!response.ok) continue;
    const data = await response.json();
    if (Array.isArray(data.chapters)) {
      curriculum[language] = data.chapters.map(chapter => ({
        ...chapter,
        lessons: chapter.lessons.map(lesson => ({
          ...lesson,
          desc: lesson.objective || lesson.cody_intro || "",
          code: lesson.code_example || ""
        }))
      }));
    }
  } catch(e) { console.warn(`Failed to load ${language}`); }
}

export function readSelection(search = location.search) {
  const parameters = new URLSearchParams(search);
  const language = parameters.get("lang") || "python";
  if (!Object.hasOwn(curriculum, language)) throw new Error("المسار المطلوب غير موجود.");
  function readIndex(key) {
    const text = parameters.get(key) ?? "0";
    if (!/^\d+$/.test(text)) throw new Error("رابط الدرس غير صحيح.");
    return Number(text);
  }
  return { language, chapterIndex: readIndex("chapter"), lessonIndex: readIndex("lesson") };
}

export function getLesson(selection) {
  const chapter = curriculum[selection.language]?.[selection.chapterIndex];
  const lesson = chapter?.lessons?.[selection.lessonIndex];
  if (!lesson) throw new Error("الدرس المطلوب غير موجود.");
  return lesson;
}

export function getNextLesson(selection) {
  const chapters = curriculum[selection.language];
  const chapter = chapters[selection.chapterIndex];
  if (selection.lessonIndex + 1 < chapter.lessons.length) {
    return { ...selection, lessonIndex: selection.lessonIndex + 1 };
  }
  if (selection.chapterIndex + 1 < chapters.length) {
    return { ...selection, chapterIndex: selection.chapterIndex + 1, lessonIndex: 0 };
  }
  return null;
}

export function lessonUrl(selection) {
  const params = new URLSearchParams({
    lang: selection.language,
    chapter: String(selection.chapterIndex),
    lesson: String(selection.lessonIndex)
  });
  return `lecture.html?${params}`;
}
