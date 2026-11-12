from datetime import timedelta
from hashlib import sha256
from unittest.mock import patch

from django.contrib import admin
from django.contrib.admin.models import LogEntry
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import RequestFactory, TestCase
from django.urls import reverse
from django.utils import timezone

from .firebase_service import FirebaseAdminDisabled
from .models import Announcement, Course, LearningPath, Lesson, QuizQuestion, StudentLookupAudit


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
        log_admin = admin.site._registry[LogEntry]
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


    def test_student_lookup_is_available_to_staff_manager_only(self):
        manager_group = Group.objects.get(name="مدير المنصة")
        manager = get_user_model().objects.create_user(
            username="student-data-manager",
            password="safe-test-password",
            is_staff=True,
        )
        manager.groups.add(manager_group)
        self.client.force_login(manager)
        response = self.client.get(reverse("student_lookup"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Firebase UID")

        editor_group = Group.objects.get(name="محرر المحتوى")
        editor = get_user_model().objects.create_user(
            username="student-data-editor",
            password="safe-test-password",
            is_staff=True,
        )
        editor.groups.add(editor_group)
        self.client.force_login(editor)
        response = self.client.get(reverse("student_lookup"))
        self.assertEqual(response.status_code, 403)

    @patch.dict("os.environ", {"FIREBASE_ADMIN_ENABLED": "false"})
    def test_student_lookup_does_not_connect_when_firebase_is_disabled(self):
        manager_group = Group.objects.get(name="مدير المنصة")
        manager = get_user_model().objects.create_user(
            username="firebase-disabled-manager",
            password="safe-test-password",
            is_staff=True,
        )
        manager.groups.add(manager_group)
        self.client.force_login(manager)

        response = self.client.post(reverse("student_lookup"), {"uid": "sample_uid_123"})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "تكامل بيانات الطلاب غير مفعّل")


    @patch("content.views.get_student_summary", return_value={
        "uid": "sample_uid_123",
        "profile": {"displayName": "Learner"},
        "completed_lessons": 2,
        "lessons_by_language": {"python": 2},
        "projects_count": 1,
    })
    def test_successful_student_lookup_is_audited_with_hashed_uid(self, _mock_summary):
        manager_group = Group.objects.get(name="مدير المنصة")
        manager = get_user_model().objects.create_user(
            username="audited-student-manager",
            password="safe-test-password",
            is_staff=True,
        )
        manager.groups.add(manager_group)
        self.client.force_login(manager)

        response = self.client.post(reverse("student_lookup"), {"uid": "sample_uid_123"})
        self.assertEqual(response.status_code, 200)
        audit = StudentLookupAudit.objects.get(requested_by=manager)
        self.assertEqual(audit.target_uid_hash, sha256(b"sample_uid_123").hexdigest())


class StudentAccountsPageTests(TestCase):
    def setUp(self):
        call_command("setup_admin_roles")
        manager_group = Group.objects.get(name="مدير المنصة")
        self.manager = get_user_model().objects.create_user(
            username="accounts-page-manager",
            password="safe-test-password",
            is_staff=True,
        )
        self.manager.groups.add(manager_group)

    @patch("content.views.list_student_accounts", return_value={
        "accounts": [{
            "uid": "learner_123",
            "email": "learner@example.test",
            "display_name": "Learner",
            "email_verified": True,
            "disabled": False,
            "created_at": None,
            "last_sign_in_at": None,
        }],
        "next_page_token": "next-page-token",
    })
    def test_manager_can_view_paginated_student_accounts(self, mock_list):
        self.client.force_login(self.manager)
        response = self.client.get(reverse("student_accounts"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "learner@example.test")
        self.assertContains(response, "learner_123")
        self.assertContains(response, "الحسابات التالية")
        mock_list.assert_called_once_with(page_token="", page_size=50)

    def test_content_editor_cannot_view_student_accounts(self):
        editor_group = Group.objects.get(name="محرر المحتوى")
        editor = get_user_model().objects.create_user(
            username="accounts-page-editor",
            password="safe-test-password",
            is_staff=True,
        )
        editor.groups.add(editor_group)
        self.client.force_login(editor)
        response = self.client.get(reverse("student_accounts"))
        self.assertEqual(response.status_code, 403)

    @patch("content.views.list_student_accounts", side_effect=FirebaseAdminDisabled(
        "تكامل بيانات الطلاب غير مفعّل."
    ))
    def test_accounts_page_explains_when_firebase_is_disabled(self, _mock_list):
        self.client.force_login(self.manager)
        response = self.client.get(reverse("student_accounts"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "تكامل بيانات الطلاب غير مفعّل")


class AdminOverviewTests(TestCase):
    def test_admin_home_shows_content_counts_and_quick_links(self):
        user = get_user_model().objects.create_user(
            username="overview-admin",
            password="safe-test-password",
            is_staff=True,
            is_superuser=True,
        )
        path = LearningPath.objects.create(
            title="Python Overview",
            language="Python",
            status=LearningPath.Status.PUBLISHED,
        )
        Course.objects.create(path=path, title="Overview Course")
        self.client.force_login(user)
        response = self.client.get(reverse("admin:index"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "نظرة عامة على المنصة")
        self.assertContains(response, "المسارات التعليمية")
        self.assertContains(response, "متابعة الطلاب")
        self.assertContains(response, "لا يظهر تلقائيًا في موقع الطلاب")
        self.assertEqual(response.context["admin_portal_counts"]["paths"], 1)
        self.assertEqual(response.context["admin_portal_published"]["paths"], 1)
