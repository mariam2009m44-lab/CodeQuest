from django.contrib import admin
from django.http import HttpResponse
from django.urls import path

admin.site.site_header = "CodeQuest Control Center"
admin.site.site_title = "CodeQuest Admin"
admin.site.index_title = "إدارة محتوى المنصة"


def health_check(request):
    return HttpResponse("ok", content_type="text/plain")


urlpatterns = [
    path("healthz/", health_check, name="health_check"),
    path("admin/", admin.site.urls),
]
