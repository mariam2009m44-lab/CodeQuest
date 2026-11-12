from django.contrib import admin
from django.contrib.admin.models import CHANGE, LogEntry

from .models import (
    Announcement,
    Course,
    LearningPath,
    Lesson,
    QuizQuestion,
    StudentLookupAudit,
    StudentProject,
)


class PublishingAdmin(admin.ModelAdmin):
    actions = ("publish_selected", "archive_selected")
    list_per_page = 30
    date_hierarchy = "updated_at"

    def _change_status(self, request, queryset, status, message):
        objects = list(queryset)
        for obj in objects:
            obj.status = status
            obj.save(update_fields=("status", "updated_at"))
        if objects:
            LogEntry.objects.log_actions(
                request.user.pk,
                objects,
                CHANGE,
                change_message=message,
            )
        self.message_user(request, f"{message}: {len(objects)} عنصر.")

    @admin.action(description="نشر العناصر المحددة")
    def publish_selected(self, request, queryset):
        self._change_status(request, queryset, "published", "نشر العناصر المحددة")

    @admin.action(description="أرشفة العناصر المحددة")
    def archive_selected(self, request, queryset):
        self._change_status(request, queryset, "archived", "أرشفة العناصر المحددة")


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


@admin.register(LogEntry)
class AuditLogAdmin(admin.ModelAdmin):
    date_hierarchy = "action_time"
    list_display = ("action_time", "user", "content_type", "object_repr", "action_flag")
    list_filter = ("action_flag", "content_type")
    search_fields = ("object_repr", "change_message", "user__username")
    ordering = ("-action_time",)
    readonly_fields = (
        "action_time",
        "user",
        "content_type",
        "object_id",
        "object_repr",
        "action_flag",
        "change_message",
    )

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser or request.user.groups.filter(name="مدير المنصة").exists()

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_view_or_change_permission(self, request, obj=None):
        return self.has_view_permission(request, obj)


@admin.register(StudentLookupAudit)
class StudentLookupAuditAdmin(admin.ModelAdmin):
    list_display = ("accessed_at", "requested_by", "short_uid_hash")
    list_filter = ("accessed_at",)
    date_hierarchy = "accessed_at"
    ordering = ("-accessed_at",)
    readonly_fields = ("requested_by", "target_uid_hash", "accessed_at")

    @admin.display(description="بصمة UID")
    def short_uid_hash(self, obj):
        return obj.target_uid_hash[:12]

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser or request.user.groups.filter(name="مدير المنصة").exists()

    def has_view_or_change_permission(self, request, obj=None):
        return self.has_view_permission(request, obj)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
