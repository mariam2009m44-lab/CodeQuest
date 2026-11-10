import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const API_URL = "https://codequest.mariam2009m44.workers.dev/api/cody/chat";
const launcher = document.getElementById("codyChatLauncher");
const panel = document.getElementById("codyChatPanel");
const closeButton = document.getElementById("codyChatClose");
const form = document.getElementById("codyChatForm");
const input = document.getElementById("codyChatInput");
const messages = document.getElementById("codyChatMessages");
const status = document.getElementById("codyChatStatus");
let currentUser = null;
let history = [];

function addMessage(text, role) {
  const node = document.createElement("div");
  node.className = "cody-chat-message " + (role === "user" ? "cody-from-user" : "cody-from-bot");
  node.textContent = text;
  messages.append(node);
  messages.scrollTop = messages.scrollHeight;
}
launcher?.addEventListener("click", () => {
  panel.hidden = false;
  input.focus();
});
closeButton?.addEventListener("click", () => { panel.hidden = true; });
onAuthStateChanged(auth, user => { currentUser = user; });
form?.addEventListener("submit", async event => {
  event.preventDefault();
  const question = input.value.trim();
  if (!question) return;
  if (!currentUser) {
    status.textContent = "سجّل الدخول أولًا لاستخدام كودي.";
    return;
  }
  input.value = "";
  addMessage(question, "user");
  status.textContent = "كودي بيفكر في سؤالك...";
  const submit = form.querySelector("button");
  submit.disabled = true;
  try {
    const token = await currentUser.getIdToken();
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ question, history: history.slice(-10), page_context: "CodeQuest dashboard; Arabic-first programming learning platform." })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || data.message || "خدمة كودي غير متاحة حاليًا.");
    if (typeof data.answer !== "string" || !data.answer.trim()) throw new Error("كودي لم يتمكن من تكوين إجابة.");
    addMessage(data.answer, "model");
    history.push({ role: "user", text: question }, { role: "model", text: data.answer });
    history = history.slice(-10);
    status.textContent = "";
  } catch (error) {
    status.textContent = error.message || "حدث خطأ في الاتصال بكودي.";
  } finally {
    submit.disabled = false;
    input.focus();
  }
});
