import { loginUser, registerUser, resetPassword, authError } from "./auth.js";
const form = document.getElementById("loginForm") || document.getElementById("signupForm");
if (!form) throw new Error("نموذج الحساب غير موجود.");

const isSignup = form.id === "signupForm";
const submitButton = form.querySelector('[type="submit"]');
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const nameInput = document.getElementById("name");

if (nameInput) { nameInput.autocomplete = "nickname"; nameInput.maxLength = 50; }

const message = document.createElement("p");
message.setAttribute("role", "status");
message.setAttribute("aria-live", "polite");
message.style.marginTop = "16px";
form.after(message);

function displayMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#b91c1c" : "#166534";
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity() || submitButton.disabled) return;

  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "جارٍ التحقق...";
  displayMessage("");

  try {
    if (isSignup) {
      await registerUser(nameInput.value, emailInput.value, passwordInput.value);
    } else {
      await loginUser(emailInput.value, passwordInput.value);
    }
    location.assign("dashboard.html");
  } catch (error) {
    displayMessage(error?.code ? authError(error) : error?.message, true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
});
