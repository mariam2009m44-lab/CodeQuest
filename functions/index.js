
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue
} = require("firebase-admin/firestore");
const {
  onCall,
  HttpsError
} = require("firebase-functions/v2/https");
const {
  defineSecret,
  defineString
} = require("firebase-functions/params");

initializeApp();

const db = getFirestore();

const JUDGE0_URL = defineString("JUDGE0_URL");
const JUDGE0_API_KEY = defineSecret("JUDGE0_API_KEY");

const CALL_OPTIONS = {
  region: "europe-west1",
  enforceAppCheck: true,
  timeoutSeconds: 45,
  memory: "256MiB",
  maxInstances: 2,
  concurrency: 10
};

const languages = {
  javascript: 63,
  python: 71,
  cpp: 54
};

// Server-defined rewards; clients cannot choose the amounts.
const GAME_REWARDS = Object.freeze({
  memory: { xp: 20, coins: 10 },
  match: { xp: 20, coins: 10 },
  bug: { xp: 25, coins: 12 },
  quiz: { xp: 15, coins: 8 },
  build: { xp: 30, coins: 15 },
  speed: { xp: 20, coins: 10 }
});

exports.runCode = onCall(
  {
    ...CALL_OPTIONS,
    secrets: [JUDGE0_API_KEY]
  },
  async request => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "يلزم تسجيل الدخول."
      );
    }

    const data = request.data || {};

    if (
      !Object.hasOwn(languages, data.language) ||
      typeof data.code !== "string" ||
      !data.code.trim() ||
      data.code.length > 50000
    ) {
      throw new HttpsError(
        "invalid-argument",
        "الكود أو اللغة غير صحيحة."
      );
    }

    // Execution is intentionally not enabled until Judge0 is configured.
    return {
      ok: true,
      stdout:
        "Code execution placeholder (configure Judge0 in functions/index.js)"
    };
  }
);

exports.submitQuiz = onCall(CALL_OPTIONS, async request => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "يلزم تسجيل الدخول."
    );
  }

  // Keep existing placeholder behavior until quiz validation
  // is implemented on the server.
  return {
    correct: false,
    awardedXp: 0
  };
});

exports.claimGameReward = onCall(
  CALL_OPTIONS,
  async request => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "سجّلي الدخول أولًا."
      );
    }

    const gameId = request.data?.gameId;

    if (
      typeof gameId !== "string" ||
      !Object.hasOwn(GAME_REWARDS, gameId)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "اللعبة غير معروفة."
      );
    }

    const uid = request.auth.uid;
    const reward = GAME_REWARDS[gameId];

    const userRef = db.collection("users").doc(uid);
    const rewardRef = userRef
      .collection("gameRewards")
      .doc(gameId);

    return db.runTransaction(async transaction => {
      const rewardSnapshot = await transaction.get(rewardRef);

      if (rewardSnapshot.exists) {
        return {
          awarded: false,
          reason: "already-claimed",
          xp: 0,
          coins: 0
        };
      }

      const userSnapshot = await transaction.get(userRef);

      if (!userSnapshot.exists) {
        throw new HttpsError(
          "failed-precondition",
          "ملف المستخدم غير موجود."
        );
      }

      transaction.create(rewardRef, {
        gameId,
        xp: reward.xp,
        coins: reward.coins,
        claimedAt: FieldValue.serverTimestamp()
      });

      transaction.update(userRef, {
        xp: FieldValue.increment(reward.xp),
        coins: FieldValue.increment(reward.coins),
        updatedAt: FieldValue.serverTimestamp()
      });

      return {
        awarded: true,
        xp: reward.xp,
        coins: reward.coins
      };
    });
  }
);
