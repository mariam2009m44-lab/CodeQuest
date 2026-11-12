import json
import re
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from content.models import Course, LearningPath, Lesson, QuizQuestion


CURRICULUM_FILES = (
    "python_curriculum.json",
    "js_curriculum.json",
    "cpp_curriculum.json",
    "java_curriculum.json",
)
CONTENT_KEYS = {
    "objective",
    "cody_intro",
    "description",
    "task",
    "hints",
    "code_example",
    "starter_code",
    "quiz",
}


class Command(BaseCommand):
    help = (
        "Import the existing CodeQuest JSON curricula into Django as drafts. "
        "Existing records are preserved unless --update-existing is supplied."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--update-existing",
            action="store_true",
            help="Update existing lesson and quiz content from the JSON source files.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate source files and report import counts without writing to the database.",
        )

    def handle(self, *args, **options):
        repository_root = Path(__file__).resolve().parents[4]
        source_dir = repository_root / "json"
        update_existing = options["update_existing"]
        dry_run = options["dry_run"]
        totals = {"paths": 0, "courses": 0, "lessons": 0, "questions": 0, "skipped": 0}

        for filename in CURRICULUM_FILES:
            source_path = source_dir / filename
            if not source_path.is_file():
                self.stderr.write(self.style.WARNING(f"تخطي {filename}: الملف غير موجود."))
                totals["skipped"] += 1
                continue

            try:
                data = json.loads(source_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                raise CommandError(f"تعذر قراءة {source_path}: {exc}") from exc

            language = str(data.get("language", "")).strip().lower()
            chapters = data.get("chapters")
            if not language or not isinstance(chapters, list):
                raise CommandError(f"بنية المنهج غير صالحة في {filename}.")

            lesson_items = [
                (chapter_index, chapter, lesson_index, lesson)
                for chapter_index, chapter in enumerate(chapters, start=1)
                if isinstance(chapter, dict)
                for lesson_index, lesson in enumerate(chapter.get("lessons", []), start=1)
                if isinstance(lesson, dict)
            ]
            if not lesson_items:
                self.stderr.write(self.style.WARNING(f"تخطي {filename}: لا توجد دروس قابلة للاستيراد."))
                totals["skipped"] += 1
                continue

            usable_items = [
                item for item in lesson_items
                if CONTENT_KEYS.intersection(item[3].keys())
            ]
            if not usable_items:
                self.stderr.write(self.style.WARNING(
                    f"تخطي {filename}: الملف يحتوي على عناوين ومعرّفات فقط، وليس محتوى دروس كاملًا."
                ))
                totals["skipped"] += 1
                continue

            if dry_run:
                totals["paths"] += 1
                totals["courses"] += 1
                totals["lessons"] += len(usable_items)
                totals["questions"] += sum(
                    1 for _ci, _chapter, _li, lesson_data in usable_items
                    if isinstance(lesson_data.get("quiz"), dict)
                    and isinstance(lesson_data["quiz"].get("options"), list)
                    and len(lesson_data["quiz"]["options"]) >= 2
                )
                self.stdout.write(
                    f"{filename}: {len(usable_items)} درس صالح للاستيراد من أصل {len(lesson_items)}."
                )
                continue

            with transaction.atomic():
                path, path_created = LearningPath.objects.get_or_create(
                    language=language,
                    defaults={
                        "title": data.get("title") or f"مسار {language}",
                        "slug": slugify(language),
                        "description": data.get("description", ""),
                    },
                )
                if path_created:
                    totals["paths"] += 1
                elif update_existing:
                    path.title = data.get("title") or path.title
                    path.description = data.get("description", path.description)
                    path.save(update_fields=("title", "description", "updated_at"))

                course_title = data.get("title") or f"منهج {language}"
                course, course_created = Course.objects.get_or_create(
                    path=path,
                    title=course_title,
                    defaults={"description": data.get("description", "")},
                )
                if course_created:
                    totals["courses"] += 1
                elif update_existing:
                    course.description = data.get("description", course.description)
                    course.save(update_fields=("description", "updated_at"))

                for chapter_index, chapter, lesson_index, lesson_data in usable_items:
                    lesson_key = str(lesson_data.get("id", "")).strip()
                    if not re.fullmatch(r"[A-Za-z0-9_-]{1,160}", lesson_key):
                        self.stderr.write(self.style.WARNING(
                            f"تخطي درس بمعرّف غير صالح في {filename}: {lesson_key!r}"
                        ))
                        continue

                    chapter_key = str(chapter.get("id", "")).strip()
                    chapter_title = str(chapter.get("title", "")).strip()
                    title = str(lesson_data.get("title", "")).strip()
                    if not title:
                        self.stderr.write(self.style.WARNING(f"تخطي {lesson_key}: عنوان الدرس فارغ."))
                        continue

                    defaults = {
                        "course": course,
                        "title": title,
                        "chapter_key": chapter_key,
                        "chapter_title": chapter_title,
                        "chapter_order": chapter_index,
                        "lesson_order": lesson_index,
                        "display_order": (chapter_index * 1000) + lesson_index,
                        "objective": lesson_data.get("objective", ""),
                        "cody_intro": lesson_data.get("cody_intro", ""),
                        "summary": lesson_data.get("objective", ""),
                        "description": lesson_data.get("description", ""),
                        "content": lesson_data.get("description") or lesson_data.get("cody_intro", ""),
                        "task": lesson_data.get("task", ""),
                        "hints": lesson_data.get("hints", []) if isinstance(lesson_data.get("hints", []), list) else [],
                        "code_example": lesson_data.get("code_example", ""),
                        "starter_code": lesson_data.get("starter_code", ""),
                        "source_data": lesson_data,
                    }
                    lesson, created = Lesson.objects.get_or_create(
                        lesson_key=lesson_key,
                        defaults={"course": course, **defaults},
                    )
                    if created:
                        totals["lessons"] += 1
                    elif update_existing:
                        for field, value in defaults.items():
                            setattr(lesson, field, value)
                        lesson.save()

                    quiz_data = lesson_data.get("quiz")
                    if not isinstance(quiz_data, dict):
                        continue
                    question_text = str(quiz_data.get("question", "")).strip()
                    quiz_options = quiz_data.get("options")
                    correct_index = quiz_data.get("correct_index", 0)
                    if (
                        not question_text
                        or not isinstance(quiz_options, list)
                        or len(quiz_options) < 2
                        or not isinstance(correct_index, int)
                        or correct_index < 0
                        or correct_index >= len(quiz_options)
                        or any(not isinstance(option, str) or not option.strip() for option in quiz_options)
                    ):
                        self.stderr.write(self.style.WARNING(f"تخطي سؤال غير صالح للدرس {lesson_key}."))
                        continue
                    question_defaults = {
                        "prompt": question_text,
                        "options": quiz_options,
                        "correct_index": correct_index,
                        "explanation": quiz_data.get("explanation", ""),
                        "display_order": 1,
                    }
                    question, question_created = QuizQuestion.objects.get_or_create(
                        lesson=lesson,
                        display_order=1,
                        defaults=question_defaults,
                    )
                    if question_created:
                        totals["questions"] += 1
                    elif update_existing:
                        for field, value in question_defaults.items():
                            setattr(question, field, value)
                        question.save()

            self.stdout.write(self.style.SUCCESS(f"تمت مراجعة {filename}."))

        self.stdout.write(
            "النتيجة: "
            + ", ".join(f"{key}={value}" for key, value in totals.items())
        )
        if dry_run:
            self.stdout.write(self.style.WARNING("وضع dry-run: لم يتم حفظ أي بيانات."))
        else:
            self.stdout.write(self.style.WARNING(
                "كل العناصر المستوردة تبدأ كمسودات؛ لن تظهر للطلاب قبل نشرها."
            ))
