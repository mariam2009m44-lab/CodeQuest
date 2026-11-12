from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
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
