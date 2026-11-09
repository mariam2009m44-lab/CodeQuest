
import { createRemoteJWKSet, jwtVerify } from "jose";

const FIREBASE_KEYS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

const ALLOWED_ORIGIN = "https://mariam2009m44-lab.github.io";

const CURRICULUM_PATHS = {
  javascript: "/json/js_curriculum.json",
  python: "/json/python_curriculum.json",
  cpp: "/json/cpp_curriculum.json"
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

function getAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = env.ALLOWED_ORIGIN || ALLOWED_ORIGIN;

  return origin === allowedOrigin ? origin : null;
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

const EXECUTABLE_LANGUAGES = Object.freeze({
  javascript: 63,
  python: 71,
  cpp: 54,
  java: 62
});

function safeOutput(value) {
  return typeof value === "string" ? value.slice(0, 20000) : "";
}

async function readJudge0Response(response) {
  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("INVALID_JUDGE0_RESPONSE");
  }

  if (!response.ok) {
    console.error("Judge0 HTTP error:", response.status, data);
    throw new Error("JUDGE0_UNAVAILABLE");
  }

  return data;
}

async function handleCodeRun(request, env, origin) {
  try {
    await verifyFirebaseUser(request, env);
  } catch {
    return jsonResponse({
      success: false,
      message: "سجّلي الدخول أولًا لتشغيل الأكواد."
    }, 401, origin);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({
      success: false,
      message: "بيانات طلب التشغيل غير صالحة."
    }, 400, origin);
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    !Object.prototype.hasOwnProperty.call(
      EXECUTABLE_LANGUAGES,
      body.language
    ) ||
    typeof body.code !== "string" ||
    !body.code.trim() ||
    body.code.length > 50000 ||
    (body.stdin !== undefined &&
      (typeof body.stdin !== "string" || body.stdin.length > 10000))
  ) {
    return jsonResponse({
      success: false,
      message: "لغة البرمجة أو الكود أو بيانات الإدخال غير صالحة."
    }, 400, origin);
  }

  const baseUrl = (env.JUDGE0_URL || "https://ce.judge0.com")
    .replace(/\/+$/, "");

  let submission;

  try {
    const response = await fetch(
      `${baseUrl}/submissions?base64_encoded=false&wait=false`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: body.code,
          language_id: EXECUTABLE_LANGUAGES[body.language],
          stdin: body.stdin || ""
        }),
        signal: AbortSignal.timeout(15000)
      }
    );

    submission = await readJudge0Response(response);
  } catch (error) {
    console.error("Judge0 submission error:", error);
    return jsonResponse({
      success: false,
      message: "تعذر إرسال الكود إلى خدمة التشغيل حاليًا."
    }, 503, origin);
  }

  if (!submission?.token) {
    console.error("Judge0 response did not include a token:", submission);
    return jsonResponse({
      success: false,
      message: "خدمة التشغيل لم تُرجع رقم التنفيذ."
    }, 502, origin);
  }

  let result = null;
  let lastPollingError = null;

  // Public Judge0 instances may briefly queue requests or rate-limit polling.
  // Retry transient polling failures instead of failing on the first response.
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const response = await fetch(
        `${baseUrl}/submissions/${encodeURIComponent(submission.token)}?base64_encoded=false`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10000)
        }
      );

      if (response.status === 429 || response.status >= 500) {
        lastPollingError = `HTTP_${response.status}`;
        continue;
      }

      result = await readJudge0Response(response);
      lastPollingError = null;
    } catch (error) {
      lastPollingError = error?.message || "POLLING_FAILED";
      console.warn("Judge0 polling attempt failed:", attempt + 1, lastPollingError);
      continue;
    }

    if (result?.status?.id && result.status.id > 2) {
      break;
    }
  }

  if (!result?.status || result.status.id <= 2) {
    console.error("Judge0 result polling exhausted:", lastPollingError);
    return jsonResponse({
      success: false,
      message: lastPollingError
        ? "تعذر الاتصال بخدمة النتائج بعد عدة محاولات. حاولي مرة أخرى."
        : "استغرق تنفيذ الكود وقتًا طويلًا. حاولي مرة أخرى."
    }, lastPollingError ? 503 : 504, origin);
  }

  return jsonResponse({
    ok: result.status.id === 3,
    stdout: safeOutput(result.stdout),
    stderr: safeOutput(result.stderr),
    compileOutput: safeOutput(result.compile_output),
    message: safeOutput(result.message),
    status: result.status.description || "Unknown",
    time: result.time || null,
    memory: result.memory || null
  }, 200, origin);
}

async function loadQuiz(language, lessonId, env) {
  const curriculumPath = CURRICULUM_PATHS[language];

  if (!curriculumPath) {
    throw new Error("UNSUPPORTED_LANGUAGE");
  }

  const curriculumBase = (
    env.CURRICULUM_BASE_URL ||
    "https://raw.githubusercontent.com/mariam2009m44-lab/CodeQuest/main"
  ).replace(/\\/+$/, "");

  const curriculumUrl = `${curriculumBase}${curriculumPath}`;
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
      CURRICULUM_PATHS,
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
    const quiz = await loadQuiz(language, lessonId, env);

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
    const origin = getAllowedOrigin(request, env);

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
      url.pathname === "/api/code/run" &&
      request.method === "POST"
    ) {
      return handleCodeRun(request, env, origin);
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
