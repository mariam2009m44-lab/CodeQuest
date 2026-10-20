
import { auth, functions } from "./firebase-config.js";

import {
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";

const claimRewardFunction = httpsCallable(
  functions,
  "claimGameReward"
);

const VALID_GAME_IDS = new Set([
  "memory",
  "match",
  "bug",
  "quiz",
  "build",
  "speed"
]);

export async function claimGameReward(gameId) {
  if (!VALID_GAME_IDS.has(gameId)) {
    throw new Error("معرّف اللعبة غير صحيح.");
  }

  if (!auth.currentUser) {
    throw new Error("سجّلي الدخول أولًا.");
  }

  const result = await claimRewardFunction({ gameId });

  return result.data;
}
