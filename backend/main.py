
import os
import json
import asyncio
import time
from pathlib import Path
from typing import Optional

import httpx
import firebase_admin
from firebase_admin import auth as firebase_auth

from fastapi import (
    FastAPI,
    Header,
    HTTPException,
    Depends,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict


# ==========================================
# إعدادات التطبيق
# ==========================================

app = FastAPI(
    title="CodeQuest API",
    description="Python Backend for Cody Academy",
    version="1.1.0",
)

# في النشر الفعلي، حددي نطاقات الموقع في متغير CORS_ORIGINS.
origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "*").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


# ==========================================
# مسارات المشروع
# ==========================================

# الملف موجود في backend/main.py
# parents[1] يرجع إلى المجلد الرئيسي للمشروع.

BASE_DIR = Path(__file__).resolve().parents[1]

CURRICULUM_DIR = BASE_DIR / "json"

CURRICULUM_FILES = {
    "python": "python_curriculum.json",
    "javascript": "js_curriculum.json",
    "cpp": "cpp_curriculum.json",
}


# ==========================================
# إعداد Judge0
# ==========================================

JUDGE0_URL = os.getenv(
    "JUDGE0_URL",
    "https://ce.judge0.com"
).rstrip("/")

JUDGE0_TIMEOUT = 10
EXECUTION_TIMEOUT = 30
POLL_INTERVAL = 1

LANGUAGE_IDS = {
    "javascript": 63,
    "python": 71,
    "cpp": 54,
}


# ==========================================
# إعداد Firebase
# ==========================================

def get_firebase_app():
    try:
        return firebase_admin.get_app()

    except ValueError:
        try:
            return firebase_admin.initialize_app()

        except Exception:
            raise HTTPException(
                status_code=503,
                detail="Firebase authentication is not configured."
            )


def verify_firebase_token(
    authorization: Optional[str] = Header(default=None)
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    scheme, separator, token = authorization.partition(" ")

    if (
        not separator
        or scheme.lower() != "bearer"
        or not token.strip()
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication header."
        )

    get_firebase_app()

    try:
        decoded_token = firebase_auth.verify_id_token(
            token.strip()
        )

        return decoded_token

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token."
        )


# ==========================================
# نماذج البيانات
# ==========================================

class QuizRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    language: str = Field(min_length=1, max_length=30)

    lesson_id: str = Field(
        alias="lessonId",
        min_length=1,
        max_length=150
    )

    selected_index: int = Field(
        alias="selectedIndex",
        ge=0
    )


class CodeRunRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    language: str = Field(
        min_length=1,
        max_length=30
    )

    source_code: str = Field(
        alias="sourceCode",
        min_length=1,
        max_length=20000
    )

    stdin: str = Field(
        default="",
        max_length=5000
    )


# ==========================================
# قراءة المناهج
# ==========================================

def load_curriculum(language: str):

    filename = CURRICULUM_FILES.get(language)

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Unsupported programming language."
        )

    file_path = CURRICULUM_DIR / filename

    if not file_path.is_file():
        raise HTTPException(
            status_code=500,
            detail=f"Curriculum file not found: {filename}"
        )

    try:
        with file_path.open(
            "r",
            encoding="utf-8"
        ) as file:
            curriculum = json.load(file)

        if not isinstance(curriculum, dict):
            raise ValueError("Invalid curriculum structure.")

        return curriculum

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Curriculum JSON contains invalid data."
        )

    except OSError:
        raise HTTPException(
            status_code=500,
            detail="Unable to read curriculum file."
        )


def find_lesson(curriculum: dict, lesson_id: str):

    chapters = curriculum.get("chapters", [])

    if not isinstance(chapters, list):
        return None

    for chapter in chapters:

        if not isinstance(chapter, dict):
            continue

        lessons = chapter.get("lessons", [])

        if not isinstance(lessons, list):
            continue

        for lesson in lessons:

            if not isinstance(lesson, dict):
                continue

            if str(lesson.get("id")) == lesson_id:
                return lesson

    return None


# ==========================================
# الصفحة الرئيسية وفحص الاتصال
# ==========================================

@app.get("/")
async def root():

    return {
        "name": "CodeQuest API",
        "status": "running",
        "version": "1.1.0"
    }


@app.get("/health")
async def health():

    return {
        "status": "healthy",
        "backend": "python",
        "framework": "fastapi"
    }


# ==========================================
# تصحيح إجابات الاختبارات
# ==========================================

@app.post("/api/quiz/check")
async def check_quiz(
    request: QuizRequest,
    user: dict = Depends(verify_firebase_token)
):

    language = request.language.lower().strip()

    curriculum = load_curriculum(language)

    lesson = find_lesson(
        curriculum,
        request.lesson_id
    )

    if not lesson:
        raise HTTPException(
            status_code=404,
            detail="Lesson not found."
        )

    quiz = lesson.get("quiz")

    if isinstance(quiz, list):
        quiz = quiz[0] if quiz else None

    if not isinstance(quiz, dict):
        raise HTTPException(
            status_code=404,
            detail="Quiz not found for this lesson."
        )

    options = quiz.get("options", [])

    correct_index = quiz.get("correct_index")

    if not isinstance(options, list) or not options:
        raise HTTPException(
            status_code=500,
            detail="Invalid quiz options."
        )

    if (
        not isinstance(correct_index, int)
        or isinstance(correct_index, bool)
    ):
        raise HTTPException(
            status_code=500,
            detail="Correct answer is not configured."
        )

    if not 0 <= correct_index < len(options):
        raise HTTPException(
            status_code=500,
            detail="Invalid correct answer index."
        )

    if request.selected_index >= len(options):
        raise HTTPException(
            status_code=400,
            detail="Selected answer is out of range."
        )

    is_correct = (
        request.selected_index == correct_index
    )

    if is_correct:
        explanation = (
            quiz.get("success_msg")
            or quiz.get("explanation")
            or "إجابة صحيحة! أحسنت."
        )

    else:
        explanation = (
            quiz.get("fail_msg")
            or quiz.get("explanation")
            or "ليست الإجابة الصحيحة، حاول مرة أخرى."
        )

    return {
        "success": True,
        "correct": is_correct,
        "explanation": explanation
    }


# ==========================================
# تشغيل الأكواد باستخدام Judge0
# ==========================================

@app.post("/api/code/run")
async def run_code(
    request: CodeRunRequest,
    user: dict = Depends(verify_firebase_token)
):

    language = request.language.lower().strip()

    language_id = LANGUAGE_IDS.get(language)

    if not language_id:
        raise HTTPException(
            status_code=400,
            detail="Unsupported programming language."
        )

    payload = {
        "language_id": language_id,
        "source_code": request.source_code,
        "stdin": request.stdin,
        "cpu_time_limit": 3,
        "wall_time_limit": 5,
        "memory_limit": 128000
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:

        async with httpx.AsyncClient(
            timeout=JUDGE0_TIMEOUT
        ) as client:

            # إرسال الكود للتشغيل

            response = await client.post(
                f"{JUDGE0_URL}/submissions",
                params={
                    "base64_encoded": "false",
                    "wait": "false"
                },
                headers=headers,
                json=payload
            )

            response.raise_for_status()

            submission = response.json()

            token = submission.get("token")

            if not token:
                raise HTTPException(
                    status_code=502,
                    detail="Execution service did not return a token."
                )

            # انتظار نتيجة التنفيذ

            deadline = time.monotonic() + EXECUTION_TIMEOUT

            result = None

            while time.monotonic() < deadline:

                await asyncio.sleep(POLL_INTERVAL)

                poll_response = await client.get(
                    f"{JUDGE0_URL}/submissions/{token}",
                    params={
                        "base64_encoded": "false"
                    },
                    headers=headers
                )

                poll_response.raise_for_status()

                result = poll_response.json()

                status = result.get("status") or {}

                status_id = status.get("id")

                if status_id is None:
                    raise HTTPException(
                        status_code=502,
                        detail="Execution service returned an invalid status."
                    )

                # 1 = In Queue
                # 2 = Processing
                # باقي الحالات تعني انتهاء التنفيذ

                if status_id not in (1, 2):
                    break

            if result is None:
                raise HTTPException(
                    status_code=504,
                    detail="Code execution timed out."
                )

            final_status = result.get("status") or {}

            final_status_id = final_status.get("id")

            if final_status_id in (1, 2):
                raise HTTPException(
                    status_code=504,
                    detail="Code execution exceeded the allowed waiting time."
                )

            return {
                "success": True,
                "status": final_status.get(
                    "description",
                    "Unknown"
                ),
                "status_id": final_status_id,
                "output": result.get("stdout") or "",
                "error": result.get("stderr") or "",
                "compile_output": result.get("compile_output") or "",
                "time": result.get("time"),
                "memory": result.get("memory"),
                "exit_code": result.get("exit_code")
            }

    except HTTPException:
        raise

    except httpx.HTTPStatusError:
        raise HTTPException(
            status_code=502,
            detail="Code execution service returned an error."
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Code execution service timed out."
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to code execution service."
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while running code."
        )
