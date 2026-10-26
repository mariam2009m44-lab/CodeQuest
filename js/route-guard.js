
import { requireUser } from "./auth.js";

const PUBLIC_PAGES = new Set([
  "index.html",
  "login.html",
  "signup.html"
]);

const currentPage =
  window.location.pathname.split("/").pop() || "index.html";

let redirectStarted = false;

function redirectToLogin() {
  if (redirectStarted) return;

  redirectStarted = true;

  const loginUrl = new URL("login.html", window.location.href);

  // الاحتفاظ بالصفحة المطلوبة ومعاملاتها، دون استخدام عنوان خارجي.
  const next = `${currentPage}${window.location.search}${window.location.hash}`;

  loginUrl.searchParams.set("next", next);
  window.location.replace(loginUrl.href);
}

async function protectPage() {
  if (PUBLIC_PAGES.has(currentPage)) {
    return;
  }

  try {
    const user = await requireUser();

    if (!user?.uid) {
      redirectToLogin();
      return;
    }

    document.documentElement.dataset.authenticated = "true";
  } catch (error) {
    console.warn("Page authentication required:", error?.message);
    redirectToLogin();
  }
}

protectPage();
