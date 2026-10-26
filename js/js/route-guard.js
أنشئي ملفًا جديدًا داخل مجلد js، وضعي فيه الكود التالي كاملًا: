import { requireUser } from "./auth.js";

const PUBLIC_PAGES = new Set([
  "index.html",
  "login.html",
  "signup.html"
]);

const currentPage =
  window.location.pathname.split("/").pop() || "index.html";

async function protectPage() {
  if (PUBLIC_PAGES.has(currentPage)) {
    return;
  }

  try {
    const user = await requireUser();

    if (!user?.uid) {
      throw new Error("Authentication required");
    }

    document.documentElement.dataset.authenticated = "true";
  } catch {
    const next =
      `${currentPage}${window.location.search}${window.location.hash}`;

    const loginUrl = new URL("login.html", window.location.href);

    loginUrl.searchParams.set("next", next);

    window.location.replace(loginUrl.href);
  }
}

protectPage();