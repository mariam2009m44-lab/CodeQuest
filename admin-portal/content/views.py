import hashlib
import re

from django.core.exceptions import PermissionDenied
from django.shortcuts import render

from .firebase_service import (
    FirebaseAdminDisabled,
    get_student_summary,
    list_student_accounts,
)
from .models import StudentLookupAudit


UID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,128}$")


def _require_student_manager(request):
    if not (
        request.user.is_superuser
        or request.user.groups.filter(name="مدير المنصة").exists()
    ):
        raise PermissionDenied


def student_accounts_view(request):
    _require_student_manager(request)
    page_token = request.GET.get("page", "").strip()
    if len(page_token) > 2048:
        return render(request, "admin/student_accounts.html", {
            "accounts": [], "error": "رمز الصفحة غير صالح.", "next_page_token": "",
        })
    try:
        result = list_student_accounts(page_token=page_token, page_size=50)
        query = request.GET.get("q", "").strip().casefold()
        accounts = result["accounts"]
        if query:
            accounts = [
                account for account in accounts
                if query in account["uid"].casefold()
                or query in account["email"].casefold()
                or query in account["display_name"].casefold()
            ]
        context = {
            "accounts": accounts,
            "error": None,
            "next_page_token": result["next_page_token"],
            "query": request.GET.get("q", ""),
            "page_count": len(result["accounts"]),
            "filtered": bool(query),
        }
    except FirebaseAdminDisabled as error:
        context = {"accounts": [], "error": str(error), "next_page_token": ""}
    except Exception:
        context = {
            "accounts": [],
            "error": "تعذر تحميل الحسابات. راجع إعدادات Firebase وصلاحيات القراءة في سجلات الخادم.",
            "next_page_token": "",
        }
    return render(request, "admin/student_accounts.html", context)


def student_lookup_view(request):
    _require_student_manager(request)
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
                context["error"] = "تعذر قراءة بيانات الطالب. راجع إعدادات Firebase وسجلات الخادم."
    return render(request, "admin/student_lookup.html", context)
