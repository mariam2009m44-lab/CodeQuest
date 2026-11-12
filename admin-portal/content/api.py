from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET

from .models import LearningPath


def _lesson_payload(lesson):
    payload = {
        "id": lesson.lesson_key,
        "title": lesson.title,
        "objective": lesson.objective,
        "cody_intro": lesson.cody_intro,
        "description": lesson.description,
        "task": lesson.task,
        "hints": lesson.hints if isinstance(lesson.hints, list) else [],
        "code_example": lesson.code_example,
        "starter_code": lesson.starter_code,
    }

    source_data = lesson.source_data if isinstance(lesson.source_data, dict) else {}
    if "xp_reward" in source_data:
        payload["xp_reward"] = source_data["xp_reward"]

    questions = []
    for question in lesson.questions.filter(status="published").order_by("display_order", "id"):
        quiz = {
            "question": question.prompt,
            "options": question.options,
            "correct_index": question.correct_index,
            "explanation": question.explanation,
        }
        source_quiz = source_data.get("quiz", {})
        if isinstance(source_quiz, dict):
            for key in ("success_msg", "fail_msg"):
                if key in source_quiz:
                    quiz[key] = source_quiz[key]
        questions.append(quiz)

    if questions:
        payload["quiz"] = questions[0]
        if len(questions) > 1:
            payload["questions"] = questions
    return payload


@require_GET
def public_curriculum_api(request, language):
    path = get_object_or_404(
        LearningPath.objects.filter(status=LearningPath.Status.PUBLISHED),
        language__iexact=language,
    )
    courses = path.courses.filter(status="published").prefetch_related("lessons__questions")
    chapters_by_key = {}

    for course in courses:
        lessons = course.lessons.filter(status="published").order_by(
            "chapter_order", "lesson_order", "display_order", "title"
        )
        for lesson in lessons:
            chapter_key = lesson.chapter_key or "uncategorized"
            chapter = chapters_by_key.setdefault(chapter_key, {
                "id": chapter_key,
                "title": lesson.chapter_title or "دروس متنوعة",
                "lessons": [],
                "_order": lesson.chapter_order,
            })
            chapter["lessons"].append(_lesson_payload(lesson))

    chapters = []
    for chapter in sorted(chapters_by_key.values(), key=lambda item: (item["_order"], item["title"])):
        chapter.pop("_order", None)
        chapters.append(chapter)

    response = JsonResponse({
        "schema_version": 1,
        "language": path.language.lower(),
        "title": path.title,
        "description": path.description,
        "chapters": chapters,
    }, json_dumps_params={"ensure_ascii": False})
    response["Access-Control-Allow-Origin"] = "*"
    response["Cache-Control"] = "public, max-age=60"
    response["X-Content-Type-Options"] = "nosniff"
    return response
