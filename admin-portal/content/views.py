import hashlib
import re

from django.core.exceptions import PermissionDenied
from django.shortcuts import render

from .firebase_service import FirebaseAdminDisabled, get_student_summary
from .models import StudentLookupAudit


UID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,128}$")


def student_lookup_view(request):
    if not (
        request.user.is_superuser
        or request.user.groups.filter(name="مدير المنصة").exists()
    ):
        raise PermissionDenied

    context = {"student": None, "error": None, "searched": False}
    if request.method == "POST":
        uid = request.POST.get("uid", "").strip()
        context["searched"] = True

        if not UID_PATTERN.fullmatch(uid):
            context["error"] = "أدخل معرّف Firebase UID صالحًا."
        else:
            try:
                context["student"] = get_student_summary(uid)
                if context["student"] is None:
                    context["error"] = "لم يتم العثور على حساب بهذا المعرّف."
                else:
                    StudentLookupAudit.objects.create(
                        requested_by=request.user,
                        target_uid_hash=hashlib.sha256(uid.encode("utf-8")).hexdigest(),
                    )
            except FirebaseAdminDisabled as error:
                context["error"] = str(error)
            except Exception:
                # Do not expose Firebase credentials, project internals, or raw errors.
                context["error"] = "تعذر قراءة بيانات الطالب. راجع إعدادات Firebase وسجلات الخادم."

    return render(request, "admin/student_lookup.html", context)
