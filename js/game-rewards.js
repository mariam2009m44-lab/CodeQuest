import { auth, functions } from "./firebase-config.js";

import {
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";

const claimRewardFunction = httpsCallable(
  functions,
  "claimGameReward"
);

const VERIFIED_GAME_ID = "code-puzzle-hello-world";

const VERIFIED_SOLUTION = Object.freeze([
  "console.log",
  "(",
  '"Hello World"',
  ")",
  ";"
]);

export async function claimGameReward(gameId, solution) {
  if (gameId !== VERIFIED_GAME_ID) {
    throw new Error("هذه اللعبة لا تدعم تسجيل مكافأة خادمية حتى الآن.");
  }

  if (
    !Array.isArray(solution) ||
    solution.length !== VERIFIED_SOLUTION.length ||
    !solution.every((piece, index) => piece === VERIFIED_SOLUTION[index])
  ) {
    throw new Error("الحل غير مكتمل أو غير صحيح.");
  }

  if (!auth.currentUser) {
    throw new Error("سجّل الدخول أولًا.");
  }

  const result = await claimRewardFunction({
    gameId: VERIFIED_GAME_ID,
    solution: [...solution]
  });

  return result.data;
}
