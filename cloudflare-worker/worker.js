import { createRemoteJWKSet, jwtVerify } from "jose";

const FIREBASE_KEYS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Vary": "Origin"
    }
  });
}

function getAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin");

  if (origin !== env.ALLOWED_ORIGIN) {
    return null;
  }

  return origin;
}

async function verifyFirebaseUser(request, env) {
  const authorization = request.headers.get("Authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    throw new Error("MISSING_TOKEN");
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    throw new Error("MISSING_TOKEN");
  }

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

export default {
  async fetch(request, env) {
    const origin = getAllowedOrigin(request, env);

    if (!origin) {
      return new Response("Origin not allowed", {
        status: 403
      });
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

    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return jsonResponse(
        {
          success: true,
          service: "CodeQuest Backend",
          status: "running"
        },
        200,
        origin
      );
    }

    if (url.pathname === "/api/session" && request.method === "GET") {
      try {
        const user = await verifyFirebaseUser(request, env);

        return jsonResponse(
          {
            success: true,
            authenticated: true,
            user
          },
          200,
          origin
        );
      } catch {
        return jsonResponse(
          {
            success: false,
            authenticated: false,
            message: "جلسة تسجيل الدخول غير صالحة."
          },
          401,
          origin
        );
      }
    }

    return jsonResponse(
      {
        success: false,
        message: "المسار المطلوب غير موجود."
      },
      404,
      origin
    );
  }
};