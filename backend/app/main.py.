import os
import asyncio
from pathlib import Path
from typing import Optional

import httpx
import firebase_admin
from firebase_admin import auth as firebase_auth

from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict


# ==========================================
# إعدادات التطبيق
# ==========================================

app = FastAPI(
    title="CodeQuest API",
    description="Python Backend for Cody Academy",
    version="1.0.0"
)

origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


# المسار الرئيسي للمشروع
BASE_DIR = Path(__file__).resolve().parents[2]

CURRICULUM_FILES = {
    "python": "python_curriculum.json",
    "javascript": "js_curriculum.json",
    "cpp": "cpp_curriculum.json",
}

JUDGE0_URL = os.getenv(
    "JUDGE0_URL",
    "https://ce.judge0.com"
).rstrip("/")

LANGUAGE_IDS = {
    "javascript": 63,
    "python": 71,
    "cpp": 54,
}


# ==========================================
# التحقق من تسجيل الدخول Firebase
# ==========================================

def verify_firebase_token(
    authorization: Optional[str] = Header(default=None)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    token = authorization.replace("Bearer ", "", 1).strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )

    try:
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app()

        decoded_token = firebase_auth.verify_id_token(token)

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

    language: str
    lesson_id: str = Field(alias="lessonId")
    selected_index: int = Field(alias="selectedIndex", ge=0)


class CodeRunRequest(BaseModel):
    language: str
    source_code: str = Field(alias="sourceCode", min_length=1, max_length=20000)
    stdin: str = Field(default="", max_length=5000)

    model_config = ConfigDict(populate_by_name=True)


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

    file_path = BASE_DIR / "json" / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Curriculum file not found: {filename}"
        )

    try:
        import json

        with file_path.open("r", encoding="utf-8") as file:
            return json.load(file)

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to read curriculum file."
        )


def find_lesson(curriculum: dict, lesson_id: str):
    chapters = curriculum.get("chapters", [])

    for chapter in chapters:
        for lesson in chapter.get("lessons", []):
            if lesson.get("id") == lesson_id:
                return lesson

    return None


# ==========================================
# الصفحة الرئيسية وفحص الاتصال
# ==========================================

@app.get("/")
async def root():
    return {
        "name": "CodeQuest API",
        "status": "running"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "backend": "python",
        "framework": "fastapi"
    }


# ==========================================
# التحقق من إجابات الاختبارات
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

    if not isinstance(correct_index, int):
        raise HTTPException(
            status_code=500,
            detail="Correct answer is not configured."
        )

    if correct_index < 0 or correct_index >= len(options):
        raise HTTPException(
            status_code=500,
            detail="Invalid correct answer index."
        )

    if request.selected_index >= len(options):
        raise HTTPException(
            status_code=400,
            detail="Selected answer is out of range."
        )

    is_correct = request.selected_index == correct_index

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
# تشغيل الأكواد
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

    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "language_id": language_id,
        "source_code": request.source_code,
        "stdin": request.stdin,
        "cpu_time_limit": 3,
        "wall_time_limit": 5,
        "memory_limit": 128000
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:

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
                    detail="Code execution service did not return a token."
                )

            result = None

            for _ in range(15):
                await asyncio.sleep(1)

                poll_response = await client.get(
                    f"{JUDGE0_URL}/submissions/{token}",
                    params={"base64_encoded": "false"},
                    headers=headers
                )

                poll_response.raise_for_status()

                result = poll_response.json()

                status_id = result.get("status", {}).get("id")

                if status_id not in (1, 2):
                    break

            if result is None:
                raise HTTPException(
                    status_code=504,
                    detail="Execution timed out."
                )

            status = result.get("status", {})

            return {
                "success": True,
                "status": status.get("description", "Unknown"),
                "output": result.get("stdout") or "",
                "error": result.get("stderr") or "",
                "compile_output": result.get("compile_output") or "",
                "time": result.get("time"),
                "memory": result.get("memory")
            }

    except httpx.HTTPStatusError:
        raise HTTPException(
            status_code=502,
            detail="Code execution service returned an error."
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to code execution service."
        )