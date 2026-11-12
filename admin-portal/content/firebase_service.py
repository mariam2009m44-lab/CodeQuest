import os

import firebase_admin
from firebase_admin import credentials, firestore


APP_NAME = "codequest-django-admin"


class FirebaseAdminDisabled(RuntimeError):
    pass


def get_firestore_client():
    if os.environ.get("FIREBASE_ADMIN_ENABLED", "false").lower() != "true":
        raise FirebaseAdminDisabled(
            "تكامل بيانات الطلاب غير مفعّل. يلزم إعداد صلاحيات Firebase أولًا."
        )

    project_id = os.environ.get("FIREBASE_PROJECT_ID", "").strip()
    if not project_id:
        raise FirebaseAdminDisabled("لم يتم تحديد FIREBASE_PROJECT_ID.")

    try:
        app = firebase_admin.get_app(APP_NAME)
    except ValueError:
        # Uses Application Default Credentials / workload identity.
        # Never place a service-account private key in source control.
        app = firebase_admin.initialize_app(
            credentials.ApplicationDefault(),
            options={"projectId": project_id},
            name=APP_NAME,
        )

    if app.project_id != project_id:
        raise FirebaseAdminDisabled("إعداد مشروع Firebase لا يطابق المشروع المحدد.")

    return firestore.client(app=app)


def get_student_summary(uid):
    db = get_firestore_client()
    profile_snapshot = db.collection("users").document(uid).get()
    if not profile_snapshot.exists:
        return None

    profile = profile_snapshot.to_dict() or {}
    allowed_profile_fields = ("displayName", "xp", "stars", "coins", "level")
    safe_profile = {
        key: profile.get(key)
        for key in allowed_profile_fields
        if key in profile
    }

    completed_lessons = 0
    lessons_by_language = {}
    progress_ref = db.collection("users").document(uid).collection("lessonProgress")
    for snapshot in progress_ref.stream():
        progress = snapshot.to_dict() or {}
        if progress.get("completed") is True:
            completed_lessons += 1
            language = progress.get("language")
            if isinstance(language, str) and language:
                lessons_by_language[language] = lessons_by_language.get(language, 0) + 1

    projects_query = db.collection("projects").where("userId", "==", uid)
    projects_count = sum(1 for _ in projects_query.stream())

    return {
        "uid": uid,
        "profile": safe_profile,
        "completed_lessons": completed_lessons,
        "lessons_by_language": lessons_by_language,
        "projects_count": projects_count,
    }
