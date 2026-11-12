from datetime import timedelta

from django.contrib import admin
from django.contrib.admin.models import LogEntry
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.core.exceptions import ValidationError
from django.test import RequestFactory, TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Announcement, Course, LearningPath, Lesson, QuizQuestion


class ContentValidationTests(TestCase):
    def setUp(self):
        path = LearningPath.objects.create(title="Python", language="Python")
        course = Course.objects.create(path=path, title="Basics")
        self.lesson = Lesson.objects.create(course=course, title="Variables", lesson_key="python-variables")

    def test_quiz_requires_at_least_two_options(self):
        question = QuizQuestion(lesson=self.lesson, prompt="Question?", options=["Only one"], correct_index=0)
        with self.assertRaises(ValidationError):
            question.full_clean()

    def test_quiz_rejects_correct_answer_outside_options(self):
        question = QuizQuestion(lesson=self.lesson, prompt="Question?", options=["A", "B"], correct_index=2)
        with self.assertRaises(ValidationError):
            question.full_clean()

    def test_quiz_accepts_valid_options(self):
        question = QuizQuestion(lesson=self.lesson, prompt="Question?", options=["A", "B"], correct_index=1)
        question.full_clean()

    def test_announcement_end_must_follow_start(self):
        start = timezone.now()
        announcement = Announcement(title="Notice", body="Text", starts_at=start, ends_at=start - timedelta(minutes=1))
        with self.assertRaises(ValidationError):
            announcement.full_clean()


class AdminAccessTests(TestCase):
    def test_health_check_returns_ok(self):
        response = self.client.get(reverse("health_check"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"ok")

    def test_admin_requires_authentication(self):
        response = self.client.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("admin:login"), response.url)

    def test_staff_user_can_open_admin(self):
        user = get_user_model().objects.create_user(
            username="portal-admin",
            password="test-password-9381",
            is_staff=True,
        )
        self.client.force_login(user)
        response = self.client.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "CodeQuest")


class AdminRoleTests(TestCase):
    def setUp(self):
        call_command("setup_admin_roles")

    def test_editor_can_manage_content_but_cannot_delete(self):
        editor_group = Group.objects.get(name="محرر المحتوى")
        user = get_user_model().objects.create_user(username="content-editor", password="safe-test-password")
        user.groups.add(editor_group)

        self.assertTrue(user.has_perm("content.view_learningpath"))
        self.assertTrue(user.has_perm("content.add_learningpath"))
        self.assertTrue(user.has_perm("content.change_learningpath"))
        self.assertFalse(user.has_perm("content.delete_learningpath"))

    def test_platform_manager_has_content_delete_permission(self):
        manager_group = Group.objects.get(name="مدير المنصة")
        user = get_user_model().objects.create_user(username="platform-manager", password="safe-test-password")
        user.groups.add(manager_group)

        self.assertTrue(user.has_perm("content.delete_learningpath"))

    def test_only_platform_manager_can_view_audit_log(self):
        log_admin = __import__("django.contrib.admin", fromlist=["site"]).site._registry[
            __import__("django.contrib.admin.models", fromlist=["LogEntry"]).LogEntry
        ]
        editor_group = Group.objects.get(name="محرر المحتوى")
        editor = get_user_model().objects.create_user(username="audit-editor", password="safe-test-password")
        editor.groups.add(editor_group)
        manager_group = Group.objects.get(name="مدير المنصة")
        manager = get_user_model().objects.create_user(username="audit-manager", password="safe-test-password")
        manager.groups.add(manager_group)

        request = RequestFactory().get("/admin/")
        request.user = editor
        self.assertFalse(log_admin.has_view_permission(request))
        request.user = manager
        self.assertTrue(log_admin.has_view_permission(request))
