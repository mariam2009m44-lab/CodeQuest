import { requireUser } from "./auth.js";

const PUBLIC_PAGES = new Set([
  "index.html",
  "login.html",
  "signup.html",
  "register.html",
  "forgot-password.html",
  "reset-password.html",
  "demo.html",
  "privacy.html",
  "parents-guide.html",
  "offline.html"
]);

const currentPage =
  window.location.pathname.split("/").filter(Boolean).pop() ||
  "index.html";

let redirectStarted = false;

function showPage() {
  document.documentElement.dataset.authenticated = "true";
  document.documentElement.dataset.authCheck = "complete";
  document.body?.removeAttribute("data-auth-pending");
}

function redirectToLogin() {
  if (redirectStarted) return;

  redirectStarted = true;

  const loginUrl = new URL("login.html", window.location.href);

  const currentPath =
    window.location.pathname.split("/").filter(Boolean).pop() ||
    "dashboard.html";

  const next =
    `${currentPath}${window.location.search}${window.location.hash}`;

  loginUrl.searchParams.set("next", next);

  window.location.replace(loginUrl.href);
}

async function protectPage() {
  if (PUBLIC_PAGES.has(currentPage)) {
    document.documentElement.dataset.authCheck = "public";
    return;
  }

  document.documentElement.dataset.authCheck = "pending";

  try {
    const user = await requireUser();

    if (!user?.uid) {
      redirectToLogin();
      return;
    }

    showPage();
  } catch (error) {
    console.warn(
      "Authentication required:",
      error?.message || error
    );

    redirectToLogin();
  }
}

protectPage();