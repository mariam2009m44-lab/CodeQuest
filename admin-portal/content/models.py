from django.db import models
from django.utils.text import slugify


class PublishedModel(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "مسودة"
        PUBLISHED = "published", "منشور"
        ARCHIVED = "archived", "مؤرشف"

    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class LearningPath(PublishedModel):
    title = models.CharField("اسم المسار", max_length=120)
    slug = models.SlugField("المعرّف", max_length=140, unique=True, blank=True)
    language = models.CharField("لغة البرمجة", max_length=40)
    description = models.TextField("الوصف", blank=True)
    display_order = models.PositiveIntegerField("ترتيب العرض", default=0)

    class Meta:
        ordering = ["display_order", "title"]
        verbose_name = "مسار تعليمي"
        verbose_name_plural = "المسارات التعليمية"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Course(PublishedModel):
    path = models.ForeignKey(LearningPath, on_delete=models.PROTECT, related_name="courses", verbose_name="المسار")
    title = models.CharField("اسم المنهج", max_length=160)
    description = models.TextField("الوصف", blank=True)
    display_order = models.PositiveIntegerField("ترتيب العرض", default=0)

    class Meta:
        ordering = ["display_order", "title"]
        verbose_name = "منهج"
        verbose_name_plural = "المناهج"

    def __str__(self):
        return self.title


class Lesson(PublishedModel):
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="lessons", verbose_name="المنهج")
    title = models.CharField("عنوان الدرس", max_length=180)
    lesson_key = models.SlugField("معرّف الدرس الحالي", max_length=160, unique=True, help_text="يُستخدم لاحقًا لربط المحتوى بمعرّفات الدروس في CodeQuest.")
    summary = models.TextField("ملخص", blank=True)
    content = models.TextField("محتوى الدرس", blank=True)
    estimated_minutes = models.PositiveSmallIntegerField("المدة المتوقعة بالدقائق", default=10)
    display_order = models.PositiveIntegerField("ترتيب العرض", default=0)

    class Meta:
        ordering = ["display_order", "title"]
        verbose_name = "درس"
        verbose_name_plural = "الدروس"

    def __str__(self):
        return self.title


class QuizQuestion(PublishedModel):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="questions", verbose_name="الدرس")
    prompt = models.TextField("السؤال")
    options = models.JSONField("الاختيارات", default=list, help_text="أدخل قائمة نصوص JSON، مثال: [\"اختيار 1\", \"اختيار 2\"]")
    correct_index = models.PositiveSmallIntegerField("رقم الإجابة الصحيحة", default=0)
    explanation = models.TextField("التفسير", blank=True)
    display_order = models.PositiveIntegerField("ترتيب السؤال", default=0)

    class Meta:
        ordering = ["display_order", "id"]
        verbose_name = "سؤال اختبار"
        verbose_name_plural = "بنك الأسئلة"

    def __str__(self):
        return self.prompt[:70]


class Announcement(PublishedModel):
    title = models.CharField("العنوان", max_length=160)
    body = models.TextField("المحتوى")
    starts_at = models.DateTimeField("يبدأ العرض", null=True, blank=True)
    ends_at = models.DateTimeField("ينتهي العرض", null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "إعلان"
        verbose_name_plural = "الإعلانات"

    def __str__(self):
        return self.title


class StudentProject(PublishedModel):
    title = models.CharField("اسم المشروع", max_length=160)
    description = models.TextField("الوصف")
    language = models.CharField("لغة البرمجة", max_length=40, blank=True)
    difficulty = models.CharField("المستوى", max_length=30, blank=True)
    starter_code = models.TextField("الكود الابتدائي", blank=True)
    instructions = models.TextField("تعليمات التنفيذ", blank=True)
    display_order = models.PositiveIntegerField("ترتيب العرض", default=0)

    class Meta:
        ordering = ["display_order", "title"]
        verbose_name = "مشروع تعليمي"
        verbose_name_plural = "المشاريع التعليمية"

    def __str__(self):
        return self.title
