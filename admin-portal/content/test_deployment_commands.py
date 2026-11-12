from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.test import TestCase


class DeploymentCommandTests(TestCase):
    @patch.dict(
        "os.environ",
        {
            "DJANGO_ADMIN_BOOTSTRAP_USERNAME": "initial-owner",
            "DJANGO_ADMIN_BOOTSTRAP_EMAIL": "owner@example.invalid",
            "DJANGO_ADMIN_BOOTSTRAP_PASSWORD": "A-strong-test-password-2026!",
        },
        clear=True,
    )
    def test_bootstrap_creates_initial_superuser(self):
        call_command("bootstrap_admin")
        owner = get_user_model().objects.get(username="initial-owner")
        self.assertTrue(owner.is_superuser)
        self.assertTrue(owner.is_staff)
        self.assertTrue(owner.check_password("A-strong-test-password-2026!"))

    @patch.dict("os.environ", {}, clear=True)
    def test_bootstrap_skips_when_credentials_are_absent(self):
        call_command("bootstrap_admin")
        self.assertFalse(get_user_model().objects.filter(is_superuser=True).exists())

    @patch.dict(
        "os.environ",
        {
            "DJANGO_ADMIN_BOOTSTRAP_USERNAME": "second-owner",
            "DJANGO_ADMIN_BOOTSTRAP_PASSWORD": "Another-test-password-2026!",
        },
        clear=True,
    )
    def test_bootstrap_never_creates_a_second_superuser(self):
        User = get_user_model()
        existing = User.objects.create_superuser(
            username="existing-owner",
            email="existing@example.invalid",
            password="Existing-test-password-2026!",
        )
        call_command("bootstrap_admin")
        self.assertEqual(User.objects.filter(is_superuser=True).count(), 1)
        existing.refresh_from_db()
        self.assertTrue(existing.check_password("Existing-test-password-2026!"))

    def test_ensure_roles_adds_default_groups_and_permissions(self):
        call_command("ensure_admin_roles")
        manager = Group.objects.get(name="مدير المنصة")
        editor = Group.objects.get(name="محرر المحتوى")
        self.assertTrue(manager.permissions.filter(codename="delete_learningpath").exists())
        self.assertTrue(editor.permissions.filter(codename="change_learningpath").exists())
        self.assertFalse(editor.permissions.filter(codename="delete_learningpath").exists())
