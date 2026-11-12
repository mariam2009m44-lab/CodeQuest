from django.contrib import admin
from django.urls import path

admin.site.site_header = "CodeQuest Control Center"
admin.site.site_title = "CodeQuest Admin"
admin.site.index_title = "إدارة محتوى المنصة"

urlpatterns = [
    path("admin/", admin.site.urls),
]
