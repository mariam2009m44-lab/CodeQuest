import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create the initial Django superuser from one-time deployment environment variables."

    def handle(self, *args, **options):
        username = os.environ.get("DJANGO_ADMIN_BOOTSTRAP_USERNAME", "").strip()
        email = os.environ.get("DJANGO_ADMIN_BOOTSTRAP_EMAIL", "").strip()
        password = os.environ.get("DJANGO_ADMIN_BOOTSTRAP_PASSWORD", "")

        if not username and not password:
            self.stdout.write("Initial admin bootstrap skipped; no bootstrap credentials supplied.")
            return
        if not username or not password:
            raise CommandError(
                "Both DJANGO_ADMIN_BOOTSTRAP_USERNAME and DJANGO_ADMIN_BOOTSTRAP_PASSWORD are required."
            )

        User = get_user_model()
        if User.objects.filter(is_superuser=True).exists():
            self.stdout.write("A superuser already exists; no account was changed.")
            return
        if User.objects.filter(**{User.USERNAME_FIELD: username}).exists():
            raise CommandError(
                "The bootstrap username already belongs to a non-superuser. Choose a different username."
            )

        user = User(**{User.USERNAME_FIELD: username})
        if email and hasattr(user, "email"):
            user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        self.stdout.write(self.style.SUCCESS("Initial Django superuser created."))
        self.stdout.write(
            self.style.WARNING(
                "Remove the DJANGO_ADMIN_BOOTSTRAP_* environment variables from the hosting dashboard now."
            )
        )
