

import { createRemoteJWKSet, jwtVerify } from "jose";

const FIREBASE_KEYS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

function jsonResponse(data, status, origin = null) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin"
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
  }

  return new Response(JSON.stringify(data), { status, headers });
}

function getAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  return origin === env.ALLOWED_ORIGIN ? origin : null;
}

async function verifyFirebaseUser(request, env) {
  const authorization = request.headers.get("Authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    throw new Error("MISSING_TOKEN");
  }

  const token = authorization.slice(7).trim();
  if (!token) throw new Error("MISSING_TOKEN");

  const { payload } = await jwtVerify(token, FIREBASE_KEYS, {
    issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
    audience: env.FIREBASE_PROJECT_ID,
    algorithms: ["RS256"]
  });

  if (
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    payload.sub.length > 128
  ) {
    throw new Error("INVALID_USER");
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email : null
  };
}

const ALLOWED_LANGUAGES = new Set([
  "python",
  "javascript",
  "cpp"
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check can be opened directly in a browser.
    if (url.pathname === "/health" && request.method === "GET") {
      const origin = getAllowedOrigin(request, env);

      if (request.headers.has("Origin") && !origin) {
        return new Response("Origin not allowed", { status: 403 });
      }

      return jsonResponse({
        success: true,
        service: "CodeQuest Backend",
        status: "running"
      }, 200, origin);
    }

    const origin = getAllowedOrigin(request, env);

    if (!origin) {
      return new Response("Origin not allowed", { status: 403 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Vary": "Origin"
        }
      });
    }

    if (url.pathname === "/api/session" && request.method === "GET") {
      try {
        const user = await verifyFirebaseUser(request, env);

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
      try {
        await verifyFirebaseUser(request, env);

        const body = await request.json();
        const { language, lessonId, selectedIndex } = body;

        if (
          !ALLOWED_LANGUAGES.has(language) ||
          typeof lessonId !== "string" ||
          lessonId.length < 1 ||
          lessonId.length > 100 ||
          !Number.isInteger(selectedIndex) ||
          selectedIndex < 0 ||
          selectedIndex > 20
        ) {
          return jsonResponse({
            success: false,
            message: "بيانات الإجابة غير صحيحة."
          }, 400, origin);
        }

        const key = `quiz:${language}:${lessonId}`;
        const answerData = await env.QUIZ_ANSWERS.get(key);

        if (!answerData) {
          return jsonResponse({
            success: false,
            message: "لم يتم إعداد إجابة هذا الاختبار بعد."
          }, 404, origin);
        }

        const answer = JSON.parse(answerData);

        if (!Number.isInteger(answer.correctIndex)) {
          throw new Error("INVALID_ANSWER_DATA");
        }

        const isCorrect = selectedIndex === answer.correctIndex;

        return jsonResponse({
          success: true,
          correct: isCorrect,
          explanation: isCorrect
            ? (answer.explanation || "إجابة صحيحة!")
            : "حاول مرة أخرى، وراجع شرح الدرس."
        }, 200, origin);

      } catch (error) {
        if (
          error.message === "MISSING_TOKEN" ||
          error.message === "INVALID_USER"
        ) {
          return jsonResponse({
            success: false,
            message: "سجّل الدخول أولاً."
          }, 401, origin);
        }

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
