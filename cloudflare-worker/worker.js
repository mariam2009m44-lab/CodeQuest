
import { createRemoteJWKSet, jwtVerify } from "jose";

const FIREBASE_KEYS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

const ALLOWED_ORIGIN = "https://mariam2009m44-lab.github.io";

const CURRICULUM_URLS = {
  javascript:
    "https://raw.githubusercontent.com/mariam2009m44-lab/CodeQuest/main/json/js_curriculum.json",

  python:
    "https://raw.githubusercontent.com/mariam2009m44-lab/CodeQuest/main/json/python_curriculum.json",

  cpp:
    "https://raw.githubusercontent.com/mariam2009m44-lab/CodeQuest/main/json/cpp_curriculum.json"
};

function jsonResponse(data, status, origin = null) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin"
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] =
      "GET, POST, OPTIONS";

    headers["Access-Control-Allow-Headers"] =
      "Content-Type, Authorization";
  }

  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}

function getAllowedOrigin(request) {
  const origin = request.headers.get("Origin");

  return origin === ALLOWED_ORIGIN ? origin : null;
}

async function verifyFirebaseUser(request, env) {
  const authorization =
    request.headers.get("Authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    throw new Error("MISSING_TOKEN");
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    throw new Error("MISSING_TOKEN");
  }

  let payload;

  try {
    const result = await jwtVerify(
      token,
      FIREBASE_KEYS,
      {
        issuer:
          `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,

        audience: env.FIREBASE_PROJECT_ID,

        algorithms: ["RS256"]
      }
    );

    payload = result.payload;
  } catch {
    throw new Error("INVALID_TOKEN");
  }

  if (
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    payload.sub.length > 128
  ) {
    throw new Error("INVALID_USER");
  }

  return {
    uid: payload.sub,
    email:
      typeof payload.email === "string"
        ? payload.email
        : null
  };
}

async function loadQuiz(language, lessonId) {
  const curriculumUrl = CURRICULUM_URLS[language];

  if (!curriculumUrl) {
    throw new Error("UNSUPPORTED_LANGUAGE");
  }

  const response = await fetch(curriculumUrl, {
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(
      `CURRICULUM_FETCH_FAILED_${response.status}`
    );
  }

  const curriculum = await response.json();

  if (!Array.isArray(curriculum?.chapters)) {
    throw new Error("INVALID_CURRICULUM");
  }

  for (const chapter of curriculum.chapters) {
    if (!Array.isArray(chapter?.lessons)) {
      continue;
    }

    const lesson = chapter.lessons.find(
      (item) => item?.id === lessonId
    );

    if (lesson) {
      const quiz = Array.isArray(lesson.quiz)
        ? lesson.quiz[0]
        : lesson.quiz;

      if (
        !quiz ||
        !Array.isArray(quiz.options) ||
        !Number.isInteger(quiz.correct_index) ||
        quiz.correct_index < 0 ||
        quiz.correct_index >= quiz.options.length
      ) {
        throw new Error("INVALID_QUIZ_DATA");
      }

      return quiz;
    }
  }

  return null;
}

async function handleQuizCheck(request, env, origin) {
  try {
    await verifyFirebaseUser(request, env);
  } catch {
    return jsonResponse({
      success: false,
      message: "انتهت جلسة تسجيل الدخول أو أنها غير صالحة. سجّل الدخول مرة أخرى."
    }, 401, origin);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({
      success: false,
      message: "بيانات الطلب غير صالحة."
    }, 400, origin);
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return jsonResponse({
      success: false,
      message: "بيانات الإجابة غير صالحة."
    }, 400, origin);
  }

  const {
    language,
    lessonId,
    selectedIndex
  } = body;

  if (
    !Object.prototype.hasOwnProperty.call(
      CURRICULUM_URLS,
      language
    ) ||
    typeof lessonId !== "string" ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(lessonId) ||
    !Number.isInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex > 20
  ) {
    return jsonResponse({
      success: false,
      message: "بيانات السؤال أو الاختيار غير صحيحة."
    }, 400, origin);
  }

  try {
    const quiz = await loadQuiz(language, lessonId);

    if (!quiz) {
      return jsonResponse({
        success: false,
        message: "لم يتم العثور على سؤال هذا الدرس في ملف المنهج."
      }, 404, origin);
    }

    if (selectedIndex >= quiz.options.length) {
      return jsonResponse({
        success: false,
        message: "رقم الاختيار غير صالح لهذا السؤال."
      }, 400, origin);
    }

    const correct =
      selectedIndex === quiz.correct_index;

    const explanation = correct
      ? (
          quiz.explanation ||
          quiz.success_msg ||
          "إجابة صحيحة! أحسنت."
        )
      : (
          quiz.fail_msg ||
          "الإجابة غير صحيحة. راجع شرح الدرس وحاول مرة أخرى."
        );

    return jsonResponse({
      success: true,
      correct,
      explanation: String(explanation).slice(0, 500)
    }, 200, origin);

  } catch (error) {
    console.error("Quiz checking error:", error);

    return jsonResponse({
      success: false,
      message:
        "تعذر تحميل بيانات الاختبار حاليًا. حاول مرة أخرى بعد قليل."
    }, 503, origin);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = getAllowedOrigin(request);

    if (
      url.pathname === "/health" &&
      request.method === "GET"
    ) {
      if (
        request.headers.has("Origin") &&
        !origin
      ) {
        return new Response(
          "Origin not allowed",
          { status: 403 }
        );
      }

      return jsonResponse({
        success: true,
        service: "CodeQuest Backend",
        status: "running"
      }, 200, origin);
    }

    if (!origin) {
      return new Response(
        "Origin not allowed",
        { status: 403 }
      );
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,

          "Access-Control-Allow-Methods":
            "GET, POST, OPTIONS",

          "Access-Control-Allow-Headers":
            "Content-Type, Authorization",

          "Vary": "Origin"
        }
      });
    }

    if (
      url.pathname === "/api/session" &&
      request.method === "GET"
    ) {
      try {
        const user = await verifyFirebaseUser(
          request,
          env
        );

        return jsonResponse({
          success: true,
          authenticated: true,
          user
        }, 200, origin);

      } catch {
        return jsonResponse({
          success: false,
          authenticated: false,
          message: "جلسة تسجيل الدخول غير صالحة."
        }, 401, origin);
      }
    }

    if (
      url.pathname === "/api/quiz/check" &&
      request.method === "POST"
    ) {
      return handleQuizCheck(
        request,
        env,
        origin
      );
    }

    return jsonResponse({
      success: false,
      message: "المسار المطلوب غير موجود."
    }, 404, origin);
  }
};
