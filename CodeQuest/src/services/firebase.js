
export {
  auth,
  db,
  firebaseApp,
  firebaseConfig,
  functions
} from "../../js/firebase-config.js";

export {
  authError,
  ensureUserProfile,
  registerUser,
  loginUser,
  resetPassword,
  logoutUser,
  requireUser,
  getCurrentUser,
  saveLessonProgress,
  getLessonProgress
} from "../../js/auth.js";
