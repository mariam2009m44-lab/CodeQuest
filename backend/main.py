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
from pydantic import BaseModel, Field, ConfigDict, StrictInt

from cody_chat import router as cody_chat_router


# ==========================================
# Application configuration
# ==========================================

app = FastAPI(
    title="CodeQuest API",
    description="Backend API for Cody Academy",
    version="1.2.0",
)

# In production, set CORS_ORIGINS to the exact frontend origins.
# Example: https://your-site.example,https://www.your-site.example
cors_value = os.getenv("CORS_ORIGINS", "*")

origins = [
    origin.strip()
    for origin in cors_value.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(cody_chat_router)


# ==========================================
# Project paths
# ==========================================

BASE_DIR = Path(__file__).resolve().parents[1]

CURRICULUM_DIR = BASE_DIR / "json"

CURRICULUM_FILES = {
    "python": "python_curriculum.json",
    "javascript": "js_curriculum.json",
    "cpp": "cpp_curriculum.json",
}


# ==========================================
# Judge0 configuration
# ==========================================

JUDGE0_URL = os.getenv(
    "JUDGE0_URL",
    "https://ce.judge0.com",
).rstrip("/")

JUDGE0_API_KEY = os.getenv("JUDGE0_API_KEY", "").strip()
JUDGE0_API_HOST = os.getenv("JUDGE0_API_HOST", "").strip()

JUDGE0_CONNECT_TIMEOUT = 10.0
JUDGE0_READ_TIMEOUT = 10.0
EXECUTION_TIMEOUT = 30
POLL_INTERVAL = 1

MAX_SOURCE_LENGTH = 20000
MAX_STDIN_LENGTH = 5000
MAX_OUTPUT_LENGTH = 12000

LANGUAGE_IDS = {
    "javascript": 63,
    "python": 71,
    "cpp": 54,
}


def get_judge0_headers() -> dict[str, str]:
    headers = {
        "Content-Type": "application/json",
    }

    # These headers are only needed for providers that use RapidAPI.
    if JUDGE0_API_KEY:
        headers["X-RapidAPI-Key"] = JUDGE0_API_KEY

    if JUDGE0_API_HOST:
        headers["X-RapidAPI-Host"] = JUDGE0_API_HOST

    return headers


def truncate_output(value, limit: int = MAX_OUTPUT_LENGTH) -> str:
    if not isinstance(value, str):
        return ""

    if len(value) <= limit:
        return value

    return value[:limit] + "\n...[output truncated]"


# ==========================================
# Firebase authentication
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
                detail="Firebase authentication is not configured.",
            )


def verify_firebase_token(
    authorization: Optional[str] = Header(default=None),
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    scheme, separator, token = authorization.partition(" ")

    if (
        not separator
        or scheme.lower() != "bearer"
        or not token.strip()
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication header.",
        )

    get_firebase_app()

    try:
        decoded_token = firebase_auth.verify_id_token(
            token.strip(),
        )

        if not decoded_token.get("uid"):
            raise ValueError("Firebase token has no user ID.")

        return decoded_token

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )


# ==========================================
# Request models
# ==========================================

class QuizRequest(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid",
    )

    language: str = Field(
        min_length=1,
        max_length=30,
    )

    lesson_id: str = Field(
        alias="lessonId",
        min_length=1,
        max_length=150,
    )

    selected_index: StrictInt = Field(
        alias="selectedIndex",
        ge=0,
    )


class CodeRunRequest(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid",
    )

    language: str = Field(
        min_length=1,
        max_length=30,
    )

    source_code: str = Field(
        alias="sourceCode",
        min_length=1,
        max_length=MAX_SOURCE_LENGTH,
    )

    stdin: str = Field(
        default="",
        max_length=MAX_STDIN_LENGTH,
    )


# ==========================================
# Curriculum helpers
# ==========================================

def load_curriculum(language: str) -> dict:
    filename = CURRICULUM_FILES.get(language)

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="Unsupported programming language.",
        )

    file_path = CURRICULUM_DIR / filename

    if not file_path.is_file():
        raise HTTPException(
            status_code=500,
            detail="Curriculum file is not available.",
        )

    try:
        with file_path.open("r", encoding="utf-8") as file:
            curriculum = json.load(file)

        if not isinstance(curriculum, dict):
            raise ValueError("Invalid curriculum structure.")

        if not isinstance(curriculum.get("chapters"), list):
            raise ValueError("Curriculum chapters must be a list.")

        return curriculum

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Curriculum JSON contains invalid data.",
        )

    except OSError:
        raise HTTPException(
            status_code=500,
            detail="Unable to read curriculum file.",
        )

    except ValueError:
        raise HTTPException(
            status_code=500,
            detail="Curriculum structure is invalid.",
        )


def find_lesson(
    curriculum: dict,
    lesson_id: str,
) -> dict | None:
    chapters = curriculum.get("chapters", [])

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
# Basic health endpoints
# ==========================================

@app.get("/")
async def root():
    return {
        "name": "CodeQuest API",
        "status": "running",
        "version": "1.2.0",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "backend": "python",
        "framework": "fastapi",
        "judge0_configured": bool(JUDGE0_URL),
    }


# ==========================================
# Quiz checking
# ==========================================

@app.post("/api/quiz/check")
async def check_quiz(
    request: QuizRequest,
    user: dict = Depends(verify_firebase_token),
):
    language = request.language.lower().strip()

    curriculum = load_curriculum(language)

    lesson = find_lesson(
        curriculum,
        request.lesson_id,
    )

    if lesson is None:
        raise HTTPException(
            status_code=404,
            detail="Lesson not found.",
        )

    quiz = lesson.get("quiz")

    if isinstance(quiz, list):
        quiz = quiz[0] if quiz else None

    if not isinstance(quiz, dict):
        raise HTTPException(
            status_code=404,
            detail="Quiz not found for this lesson.",
        )

    options = quiz.get("options")
    correct_index = quiz.get("correct_index")

    if not isinstance(options, list) or not options:
        raise HTTPException(
            status_code=500,
            detail="Quiz options are not configured correctly.",
        )

    if not all(isinstance(option, (str, dict)) for option in options):
        raise HTTPException(
            status_code=500,
            detail="Quiz options contain invalid data.",
        )

    if (
        not isinstance(correct_index, int)
        or isinstance(correct_index, bool)
    ):
        raise HTTPException(
            status_code=500,
            detail="Correct answer is not configured.",
        )

    if not 0 <= correct_index < len(options):
        raise HTTPException(
            status_code=500,
            detail="Correct answer index is invalid.",
        )

    if request.selected_index >= len(options):
        raise HTTPException(
            status_code=400,
            detail="Selected answer is out of range.",
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
        "explanation": explanation,
    }


# ==========================================
# Judge0 code execution
# ==========================================

@app.post("/api/code/run")
async def run_code(
    request: CodeRunRequest,
    user: dict = Depends(verify_firebase_token),
):
    language = request.language.lower().strip()

    language_id = LANGUAGE_IDS.get(language)

    if language_id is None:
        raise HTTPException(
            status_code=400,
            detail="Unsupported programming language.",
        )

    if not request.source_code.strip():
        raise HTTPException(
            status_code=422,
            detail="Source code cannot be empty.",
        )

    payload = {
        "language_id": language_id,
        "source_code": request.source_code,
        "stdin": request.stdin,
        "cpu_time_limit": 3,
        "wall_time_limit": 5,
        "memory_limit": 128000,
    }

    headers = get_judge0_headers()

    timeout = httpx.Timeout(
        connect=JUDGE0_CONNECT_TIMEOUT,
        read=JUDGE0_READ_TIMEOUT,
        write=JUDGE0_READ_TIMEOUT,
        pool=JUDGE0_CONNECT_TIMEOUT,
    )

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            submission_response = await client.post(
                f"{JUDGE0_URL}/submissions",
                params={
                    "base64_encoded": "false",
                    "wait": "false",
                },
                headers=headers,
                json=payload,
            )

            submission_response.raise_for_status()

            try:
                submission = submission_response.json()
            except ValueError:
                raise HTTPException(
                    status_code=502,
                    detail="Execution service returned invalid data.",
                )

            token = submission.get("token")

            if not isinstance(token, str) or not token.strip():
                raise HTTPException(
                    status_code=502,
                    detail="Execution service did not return a valid token.",
                )

            deadline = time.monotonic() + EXECUTION_TIMEOUT
            result = None

            while time.monotonic() < deadline:
                await asyncio.sleep(POLL_INTERVAL)

                poll_response = await client.get(
                    f"{JUDGE0_URL}/submissions/{token}",
                    params={
                        "base64_encoded": "false",
                    },
                    headers=headers,
                )

                poll_response.raise_for_status()

                try:
                    result = poll_response.json()
                except ValueError:
                    raise HTTPException(
                        status_code=502,
                        detail="Execution service returned invalid result data.",
                    )

                if not isinstance(result, dict):
                    raise HTTPException(
                        status_code=502,
                        detail="Execution service returned an invalid result.",
                    )

                status = result.get("status")

                if not isinstance(status, dict):
                    raise HTTPException(
                        status_code=502,
                        detail="Execution service returned an invalid status.",
                    )

                status_id = status.get("id")

                if not isinstance(status_id, int):
                    raise HTTPException(
                        status_code=502,
                        detail="Execution service returned an invalid status ID.",
                    )

                # 1 = In Queue, 2 = Processing.
                if status_id not in (1, 2):
                    break

            if result is None:
                raise HTTPException(
                    status_code=504,
                    detail="Code execution timed out.",
                )

            final_status = result.get("status") or {}
            final_status_id = final_status.get("id")

            if final_status_id in (1, 2):
                raise HTTPException(
                    status_code=504,
                    detail="Code execution exceeded the allowed waiting time.",
                )

            return {
                "success": True,
                "status": final_status.get(
                    "description",
                    "Unknown",
                ),
                "status_id": final_status_id,
                "output": truncate_output(result.get("stdout")),
                "error": truncate_output(result.get("stderr")),
                "compile_output": truncate_output(
                    result.get("compile_output")
                ),
                "time": result.get("time"),
                "memory": result.get("memory"),
                "exit_code": result.get("exit_code"),
            }

    except HTTPException:
        raise

    except httpx.HTTPStatusError:
        raise HTTPException(
            status_code=502,
            detail="Code execution service returned an error.",
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Code execution service timed out.",
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to code execution service.",
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while running code.",
        )