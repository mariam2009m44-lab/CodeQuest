def admin_portal_permissions(request):
    user = getattr(request, "user", None)
    allowed = bool(
        user
        and user.is_authenticated
        and (
            user.is_superuser
            or user.groups.filter(name="مدير المنصة").exists()
        )
    )
    return {"can_manage_student_data": allowed}
