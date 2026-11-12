from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0002_student_lookup_audit"),
    ]

    operations = [
        migrations.AddField(
            model_name="lesson",
            name="chapter_key",
            field=models.CharField(blank=True, db_index=True, max_length=120, verbose_name="معرّف الفصل"),
        ),
        migrations.AddField(
            model_name="lesson",
            name="chapter_title",
            field=models.CharField(blank=True, max_length=180, verbose_name="اسم الفصل"),
        ),
        migrations.AddField(
            model_name="lesson",
            name="chapter_order",
            field=models.PositiveIntegerField(default=0, verbose_name="ترتيب الفصل"),
        ),
        migrations.AddField(
            model_name="lesson",
            name="lesson_order",
            field=models.PositiveIntegerField(default=0, verbose_name="ترتيب الدرس داخل الفصل"),
        ),
        migrations.AddField(
            model_name="lesson",
            name="objective",
            field=models.TextField(blank=True, verbose_name="هدف التعلم"),
        ),
        migrations.AddField(
            model_name="lesson",
            name="cody_intro",
            field=models.TextField(blank=True, verbose_name="مقدمة Cody"),
        ),
        migrations.AddField(
            model_name="lesson",
            name="description",
            field=models.TextField(blank=True, verbose_name="الشرح"),
        ),
        migrations.AddField(
            model_name="lesson",
            name="task",
            field=models.TextField(blank=True, verbose_name="المهمة التطبيقية"),
        ),
        migrations.AddField(
            model_name="lesson",
            name="hints",
            field=models.JSONField(blank=True, default=list, verbose_name="التلميحات"),
        ),
        migrations.AddField(
            model_name="lesson",
            name="code_example",
            field=models.TextField(blank=True, verbose_name="مثال الكود"),
        ),
        migrations.AddField(
            model_name="lesson",
            name="starter_code",
            field=models.TextField(blank=True, verbose_name="الكود الابتدائي"),
        ),
        migrations.AddField(
            model_name="lesson",
            name="source_data",
            field=models.JSONField(blank=True, default=dict, verbose_name="بيانات المصدر الإضافية"),
        ),
    ]
