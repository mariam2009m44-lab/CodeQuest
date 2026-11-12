import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="StudentLookupAudit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("target_uid_hash", models.CharField(db_index=True, max_length=64, verbose_name="بصمة معرّف الطالب")),
                ("accessed_at", models.DateTimeField(auto_now_add=True, verbose_name="وقت الاطلاع")),
                ("requested_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="student_lookup_audits", to=settings.AUTH_USER_MODEL, verbose_name="المسؤول")),
            ],
            options={
                "verbose_name": "سجل الاطلاع على بيانات طالب",
                "verbose_name_plural": "سجل الاطلاع على بيانات الطلاب",
                "ordering": ["-accessed_at"],
            },
        ),
    ]
