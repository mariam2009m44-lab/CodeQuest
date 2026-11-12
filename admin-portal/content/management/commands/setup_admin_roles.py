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
    help = "Create the standard CodeQuest content-admin groups and permissions."

    def handle(self, *args, **options):
        models = (LearningPath, Course, Lesson, QuizQuestion, Announcement, StudentProject)
        manager, _ = Group.objects.get_or_create(name="مدير المنصة")
        editor, _ = Group.objects.get_or_create(name="محرر المحتوى")

        manager_permissions = []
        editor_permissions = []
        for model in models:
            content_type = ContentType.objects.get_for_model(model)
            permissions = Permission.objects.filter(content_type=content_type)
            manager_permissions.extend(permissions)
            editor_permissions.extend(
                permissions.filter(codename__startswith=("view_", "add_", "change_"))
            )

        manager.permissions.set(manager_permissions)
        editor.permissions.set(editor_permissions)

        self.stdout.write(self.style.SUCCESS(
            "تم إعداد مجموعتي مدير المنصة ومحرر المحتوى وصلاحياتهما."
        ))
        self.stdout.write(
            "أنشئ المستخدمين من لوحة Django، ثم أضف كل مستخدم إلى المجموعة المناسبة. "
            "لا تمنح صفة superuser إلا لحساب المالك."
        )
