
import { createRemoteJWKSet, jwtVerify } from "jose";

const FIREBASE_KEYS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

const ALLOWED_LANGUAGES = new Set([
  "python",
  "javascript",
  "cpp"
]);

function jsonResponse(data, status, origin = null) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin"
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
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

  return origin === env.ALLOWED_ORIGIN
    ? origin
    : null;
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

function unauthorizedResponse(origin) {
  return jsonResponse({
    success: false,
    message: "سجّل الدخول أولًا."
  }, 401, origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check
    if (
      url.pathname === "/health" &&
      request.method === "GET"
    ) {
      const origin = getAllowedOrigin(request, env);

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

    // CORS
    const origin = getAllowedOrigin(request, env);

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
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization",
          "Vary": "Origin"
        }
      });
    }

    // Session verification
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

    // Quiz answer checking
    if (
      url.pathname === "/api/quiz/check" &&
      request.method === "POST"
    ) {
      // Verify authentication separately.
      try {
        await verifyFirebaseUser(request, env);
      } catch {
        return unauthorizedResponse(origin);
      }

      // Parse JSON safely.
      let body;

      try {
        body = await request.json();
      } catch {
        return jsonResponse({
          success: false,
          message: "JSON غير صالح."
        }, 400, origin);
      }

      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
      ) {
        return jsonResponse({
          success: false,
          message: "بيانات غير صالحة."
        }, 400, origin);
      }

      const {
        language,
        lessonId,
        selectedIndex
      } = body;

      // Validate submitted values.
      if (
        !ALLOWED_LANGUAGES.has(language) ||
        typeof lessonId !== "string" ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(lessonId) ||
        !Number.isInteger(selectedIndex) ||
        selectedIndex < 0 ||
        selectedIndex > 20
      ) {
        return jsonResponse({
          success: false,
          message: "بيانات الإجابة غير صحيحة."
        }, 400, origin);
      }

      try {
        if (!env.QUIZ_ANSWERS) {
          throw new Error("QUIZ_BINDING_MISSING");
        }

        const key =
          `quiz:${language}:${lessonId}`;

        const answerData =
          await env.QUIZ_ANSWERS.get(key);

        if (!answerData) {
          return jsonResponse({
            success: false,
            message: "لم يتم إعداد إجابة هذا الاختبار بعد."
          }, 404, origin);
        }

        const answer = JSON.parse(answerData);

        if (
          !answer ||
          typeof answer !== "object" ||
          !Number.isInteger(answer.correctIndex) ||
          answer.correctIndex < 0 ||
          answer.correctIndex > 20
        ) {
          throw new Error("INVALID_ANSWER_DATA");
        }

        const isCorrect =
          selectedIndex === answer.correctIndex;

        const explanation =
          isCorrect &&
          typeof answer.explanation === "string"
            ? answer.explanation.slice(0, 500)
            : isCorrect
              ? "إجابة صحيحة!"
              : "حاول مرة أخرى، وراجع شرح الدرس.";

        return jsonResponse({
          success: true,
          correct: isCorrect,
          explanation
        }, 200, origin);

      } catch (error) {
        console.error(
          "Quiz checking error:",
          error
        );

        return jsonResponse({
          success: false,
          message: "حدث خطأ أثناء تصحيح الإجابة."
        }, 500, origin);
      }
    }

    return jsonResponse({
      success: false,
      message: "المسار المطلوب غير موجود."
    }, 404, origin);
  }
};
