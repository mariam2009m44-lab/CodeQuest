from datetime import timedelta
from hashlib import sha256
from unittest.mock import MagicMock, patch

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


class PublicCurriculumApiTests(TestCase):
    def setUp(self):
        self.path = LearningPath.objects.create(
            title="Python Curriculum",
            language="python",
            description="منهج تجريبي",
            status=LearningPath.Status.PUBLISHED,
        )
        self.course = Course.objects.create(
            path=self.path,
            title="Python Basics",
            status=Course.Status.PUBLISHED,
        )
        self.lesson = Lesson.objects.create(
            course=self.course,
            title="First lesson",
            lesson_key="py-1-1",
            chapter_key="python-chapter-1",
            chapter_title="الفصل الأول",
            chapter_order=1,
            lesson_order=1,
            objective="هدف الدرس",
            cody_intro="مقدمة Cody",
            task="مهمة",
            hints=["تلميح أول"],
            code_example="print('hello')",
            status=Lesson.Status.PUBLISHED,
        )
        QuizQuestion.objects.create(
            lesson=self.lesson,
            prompt="ما الأمر؟",
            options=["print()", "input()"],
            correct_index=0,
            explanation="شرح الإجابة",
            status=QuizQuestion.Status.PUBLISHED,
        )

    def test_public_api_returns_only_published_curriculum_in_existing_json_shape(self):
        response = self.client.get(reverse("public_curriculum_api", kwargs={"language": "python"}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Access-Control-Allow-Origin"], "*")
        data = response.json()
        self.assertEqual(data["schema_version"], 1)
        self.assertEqual(data["language"], "python")
        self.assertEqual(data["chapters"][0]["id"], "python-chapter-1")
        lesson = data["chapters"][0]["lessons"][0]
        self.assertEqual(lesson["id"], "py-1-1")
        self.assertEqual(lesson["objective"], "هدف الدرس")
        self.assertEqual(lesson["hints"], ["تلميح أول"])
        self.assertEqual(lesson["quiz"]["correct_index"], 0)

    def test_public_api_excludes_draft_lessons_and_questions(self):
        self.lesson.status = Lesson.Status.DRAFT
        self.lesson.save(update_fields=("status", "updated_at"))
        response = self.client.get(reverse("public_curriculum_api", kwargs={"language": "python"}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["chapters"], [])

    def test_public_api_is_read_only(self):
        response = self.client.post(reverse("public_curriculum_api", kwargs={"language": "python"}))
        self.assertEqual(response.status_code, 405)

    def test_unknown_or_unpublished_language_returns_404(self):
        response = self.client.get(reverse("public_curriculum_api", kwargs={"language": "unknown"}))
        self.assertEqual(response.status_code, 404)


class FirebaseStudentSummaryTests(TestCase):
    @patch("content.firebase_service.get_firestore_client")
    def test_student_summary_uses_the_real_firestore_paths_and_bounded_reads(self, mock_get_db):
        db = MagicMock()
        users_collection = MagicMock()
        user_document = MagicMock()
        profile_snapshot = MagicMock()
        profile_snapshot.exists = True
        profile_snapshot.to_dict.return_value = {
            "displayName": "Learner",
            "xp": 120,
            "stars": 4,
            "coins": 10,
            "level": 2,
            "email": "private@example.test",
        }
        user_document.get.return_value = profile_snapshot

        progress_ref = MagicMock()
        progress_ref.limit.return_value.stream.return_value = []
        user_document.collection.return_value = progress_ref
        users_collection.document.return_value = user_document

        projects_collection = MagicMock()
        projects_query = MagicMock()
        projects_collection.where.return_value = projects_query
        projects_query.limit.return_value.stream.return_value = []

        def collection(name):
            return {
                "users": users_collection,
                "projects": projects_collection,
            }[name]

        db.collection.side_effect = collection
        mock_get_db.return_value = db

        from .firebase_service import get_student_summary

        result = get_student_summary("sample_uid_123")

        self.assertEqual(result["completed_lessons"], 0)
        self.assertEqual(result["projects_count"], 0)
        self.assertNotIn("email", result["profile"])
        progress_ref.limit.assert_called_once_with(500)
        projects_collection.where.assert_called_once_with("userId", "==", "sample_uid_123")
        projects_query.limit.assert_called_once_with(500)
        user_document.collection.assert_called_once_with("lessonProgress")

    @patch("content.firebase_service.get_firestore_client")
    def test_student_summary_marks_counts_as_potentially_incomplete_at_the_cap(self, mock_get_db):
        db = MagicMock()
        users_collection = MagicMock()
        user_document = MagicMock()
        profile_snapshot = MagicMock()
        profile_snapshot.exists = True
        profile_snapshot.to_dict.return_value = {"displayName": "Learner"}
        user_document.get.return_value = profile_snapshot

        progress_ref = MagicMock()
        progress_ref.limit.return_value.stream.return_value = [
            MagicMock(to_dict=MagicMock(return_value={
                "completed": True,
                "language": "python",
            }))
            for _ in range(500)
        ]
        user_document.collection.return_value = progress_ref
        users_collection.document.return_value = user_document

        projects_collection = MagicMock()
        projects_query = MagicMock()
        projects_collection.where.return_value = projects_query
        projects_query.limit.return_value.stream.return_value = [MagicMock() for _ in range(500)]

        db.collection.side_effect = lambda name: {
            "users": users_collection,
            "projects": projects_collection,
        }[name]
        mock_get_db.return_value = db

        from .firebase_service import get_student_summary

        result = get_student_summary("sample_uid_123")

        self.assertEqual(result["completed_lessons"], 500)
        self.assertEqual(result["projects_count"], 500)
        self.assertTrue(result["progress_may_be_incomplete"])
        self.assertTrue(result["projects_may_be_incomplete"])


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
