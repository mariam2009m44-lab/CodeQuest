from django.contrib import admin
from .models import Announcement, Course, LearningPath, Lesson, QuizQuestion, StudentProject


class PublishingAdmin(admin.ModelAdmin):
    actions = ("publish_selected", "archive_selected")
    list_per_page = 30
    date_hierarchy = "updated_at"

    @admin.action(description="نشر العناصر المحددة")
    def publish_selected(self, request, queryset):
        updated = queryset.update(status="published")
        self.message_user(request, f"تم نشر {updated} عنصر.")

    @admin.action(description="أرشفة العناصر المحددة")
    def archive_selected(self, request, queryset):
        updated = queryset.update(status="archived")
        self.message_user(request, f"تمت أرشفة {updated} عنصر.")


class CourseInline(admin.TabularInline):
    model = Course
    extra = 0
    fields = ("title", "display_order", "status")
    show_change_link = True


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ("title", "lesson_key", "display_order", "status")
    show_change_link = True


class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 0
    fields = ("prompt", "options", "correct_index", "display_order", "status")
    show_change_link = True


@admin.register(LearningPath)
class LearningPathAdmin(PublishingAdmin):
    list_display = ("title", "language", "status", "display_order", "updated_at")
    list_filter = ("status", "language")
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    inlines = (CourseInline,)


@admin.register(Course)
class CourseAdmin(PublishingAdmin):
    list_display = ("title", "path", "status", "display_order", "updated_at")
    list_filter = ("status", "path")
    search_fields = ("title", "description", "path__title")
    inlines = (LessonInline,)


@admin.register(Lesson)
class LessonAdmin(PublishingAdmin):
    list_display = ("title", "course", "lesson_key", "status", "display_order", "updated_at")
    list_filter = ("status", "course__path", "course")
    search_fields = ("title", "lesson_key", "summary", "content")
    inlines = (QuizQuestionInline,)


@admin.register(QuizQuestion)
class QuizQuestionAdmin(PublishingAdmin):
    list_display = ("__str__", "lesson", "correct_index", "status", "display_order")
    list_filter = ("status", "lesson__course")
    search_fields = ("prompt", "lesson__title")


@admin.register(Announcement)
class AnnouncementAdmin(PublishingAdmin):
    list_display = ("title", "status", "starts_at", "ends_at", "updated_at")
    list_filter = ("status",)
    search_fields = ("title", "body")


@admin.register(StudentProject)
class StudentProjectAdmin(PublishingAdmin):
    list_display = ("title", "language", "difficulty", "status", "display_order", "updated_at")
    list_filter = ("status", "language", "difficulty")
    search_fields = ("title", "description", "instructions")
