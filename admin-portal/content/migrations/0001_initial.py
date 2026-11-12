# Generated for the initial CodeQuest Control Center content schema.
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="LearningPath",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("draft", "مسودة"), ("published", "منشور"), ("archived", "مؤرشف")], db_index=True, default="draft", max_length=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=120, verbose_name="اسم المسار")),
                ("slug", models.SlugField(blank=True, max_length=140, unique=True, verbose_name="المعرّف")),
                ("language", models.CharField(max_length=40, verbose_name="لغة البرمجة")),
                ("description", models.TextField(blank=True, verbose_name="الوصف")),
                ("display_order", models.PositiveIntegerField(default=0, verbose_name="ترتيب العرض")),
            ],
            options={"verbose_name": "مسار تعليمي", "verbose_name_plural": "المسارات التعليمية", "ordering": ["display_order", "title"]},
        ),
        migrations.CreateModel(
            name="Announcement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("draft", "مسودة"), ("published", "منشور"), ("archived", "مؤرشف")], db_index=True, default="draft", max_length=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=160, verbose_name="العنوان")),
                ("body", models.TextField(verbose_name="المحتوى")),
                ("starts_at", models.DateTimeField(blank=True, null=True, verbose_name="يبدأ العرض")),
                ("ends_at", models.DateTimeField(blank=True, null=True, verbose_name="ينتهي العرض")),
            ],
            options={"verbose_name": "إعلان", "verbose_name_plural": "الإعلانات", "ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="StudentProject",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("draft", "مسودة"), ("published", "منشور"), ("archived", "مؤرشف")], db_index=True, default="draft", max_length=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=160, verbose_name="اسم المشروع")),
                ("description", models.TextField(verbose_name="الوصف")),
                ("language", models.CharField(blank=True, max_length=40, verbose_name="لغة البرمجة")),
                ("difficulty", models.CharField(blank=True, max_length=30, verbose_name="المستوى")),
                ("starter_code", models.TextField(blank=True, verbose_name="الكود الابتدائي")),
                ("instructions", models.TextField(blank=True, verbose_name="تعليمات التنفيذ")),
                ("display_order", models.PositiveIntegerField(default=0, verbose_name="ترتيب العرض")),
            ],
            options={"verbose_name": "مشروع تعليمي", "verbose_name_plural": "المشاريع التعليمية", "ordering": ["display_order", "title"]},
        ),
        migrations.CreateModel(
            name="Course",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("draft", "مسودة"), ("published", "منشور"), ("archived", "مؤرشف")], db_index=True, default="draft", max_length=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=160, verbose_name="اسم المنهج")),
                ("description", models.TextField(blank=True, verbose_name="الوصف")),
                ("display_order", models.PositiveIntegerField(default=0, verbose_name="ترتيب العرض")),
                ("path", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="courses", to="content.learningpath", verbose_name="المسار")),
            ],
            options={"verbose_name": "منهج", "verbose_name_plural": "المناهج", "ordering": ["display_order", "title"]},
        ),
        migrations.CreateModel(
            name="Lesson",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("draft", "مسودة"), ("published", "منشور"), ("archived", "مؤرشف")], db_index=True, default="draft", max_length=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=180, verbose_name="عنوان الدرس")),
                ("lesson_key", models.SlugField(help_text="يُستخدم لاحقًا لربط المحتوى بمعرّفات الدروس في CodeQuest.", max_length=160, unique=True, verbose_name="معرّف الدرس الحالي")),
                ("summary", models.TextField(blank=True, verbose_name="ملخص")),
                ("content", models.TextField(blank=True, verbose_name="محتوى الدرس")),
                ("estimated_minutes", models.PositiveSmallIntegerField(default=10, verbose_name="المدة المتوقعة بالدقائق")),
                ("display_order", models.PositiveIntegerField(default=0, verbose_name="ترتيب العرض")),
                ("course", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="lessons", to="content.course", verbose_name="المنهج")),
            ],
            options={"verbose_name": "درس", "verbose_name_plural": "الدروس", "ordering": ["display_order", "title"]},
        ),
        migrations.CreateModel(
            name="QuizQuestion",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("draft", "مسودة"), ("published", "منشور"), ("archived", "مؤرشف")], db_index=True, default="draft", max_length=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("prompt", models.TextField(verbose_name="السؤال")),
                ("options", models.JSONField(default=list, help_text='أدخل قائمة نصوص JSON، مثال: ["اختيار 1", "اختيار 2"]', verbose_name="الاختيارات")),
                ("correct_index", models.PositiveSmallIntegerField(default=0, verbose_name="رقم الإجابة الصحيحة")),
                ("explanation", models.TextField(blank=True, verbose_name="التفسير")),
                ("display_order", models.PositiveIntegerField(default=0, verbose_name="ترتيب السؤال")),
                ("lesson", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="questions", to="content.lesson", verbose_name="الدرس")),
            ],
            options={"verbose_name": "سؤال اختبار", "verbose_name_plural": "بنك الأسئلة", "ordering": ["display_order", "id"]},
        ),
    ]
