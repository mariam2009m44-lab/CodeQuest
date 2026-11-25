from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand

from content.models import (
    Announcement,
    Course,
    LearningPath,
    Lesson,
    QuizQuestion,
    StudentProject,
)


class Command(BaseCommand):
    help = "Ensure the standard CodeQuest content-admin groups exist without resetting custom permissions."

    def handle(self, *args, **options):
        models = (LearningPath, Course, Lesson, QuizQuestion, Announcement, StudentProject)
        manager, _ = Group.objects.get_or_create(name="مدير المنصة")
        editor, _ = Group.objects.get_or_create(name="محرر المحتوى")

        for model in models:
            content_type = ContentType.objects.get_for_model(model)
            permissions = Permission.objects.filter(content_type=content_type)
            manager.permissions.add(*permissions)
            editor.permissions.add(
                *[
                    permission
                    for permission in permissions
                    if permission.codename.startswith(("view_", "add_", "change_"))
                ]
            )

        self.stdout.write(self.style.SUCCESS("تم التأكد من وجود أدوار مدير المنصة ومحرر المحتوى."))
