from django.urls import reverse

from .models import Announcement, Course, LearningPath, Lesson, QuizQuestion, StudentProject


def admin_portal_permissions(request):
    user = getattr(request, "user", None)
    allowed = bool(
        user
        and user.is_authenticated
        and (
            user.is_superuser
            or user.groups.filter(name="مدير المنصة").exists()
        )
    )
    return {"can_manage_student_data": allowed}


def admin_portal_overview(request):
    user = getattr(request, "user", None)
    if not (
        user
        and user.is_authenticated
        and user.is_staff
        and request.path == reverse("admin:index")
    ):
        return {}

    models = (
        ("paths", LearningPath),
        ("courses", Course),
        ("lessons", Lesson),
        ("questions", QuizQuestion),
        ("announcements", Announcement),
        ("projects", StudentProject),
    )
    counts = {
        key: model.objects.count()
        for key, model in models
    }
    published = {
        key: model.objects.filter(status="published").count()
        for key, model in models
    }
    return {"admin_portal_counts": counts, "admin_portal_published": published}
