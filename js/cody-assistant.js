import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const API_URL = "https://codequest.mariam2009m44.workers.dev/api/cody/chat";
const launcher = document.getElementById("codyChatLauncher");
const heroLauncher = document.getElementById("codyHeroLauncher");
const panel = document.getElementById("codyChatPanel");
const closeButton = document.getElementById("codyChatClose");
const form = document.getElementById("codyChatForm");
const input = document.getElementById("codyChatInput");
const messages = document.getElementById("codyChatMessages");
const status = document.getElementById("codyChatStatus");

let currentUser = null;
let authReady = false;
let sending = false;
let history = [];

const CODY_EMOTION_CLASSES = [
  "is-waving",
  "is-happy",
  "is-celebrating",
  "is-encouraging"
];
let emotionTimer = null;

function playCodyEmotion(emotion = "wave") {
  const classByEmotion = {
    wave: "is-waving",
    happy: "is-happy",
    celebrate: "is-celebrating",
    encourage: "is-encouraging"
  };
  const className = classByEmotion[emotion] || classByEmotion.wave;
  const characters = document.querySelectorAll(".cody-character");
  if (!characters.length) return;

  characters.forEach(character => {
    character.classList.remove(...CODY_EMOTION_CLASSES);
    void character.offsetWidth;
    character.classList.add(className);
  });

  window.clearTimeout(emotionTimer);
  emotionTimer = window.setTimeout(() => {
    characters.forEach(character => character.classList.remove(...CODY_EMOTION_CLASSES));
  }, emotion === "celebrate" ? 2600 : 1900);
}

window.addEventListener("codequest:cody-emotion", event => {
  playCodyEmotion(event.detail?.emotion || "wave");
});

function setStatus(message = "", state = "info") {
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
}

function addMessage(text, role) {
  if (!messages) return;
  const node = document.createElement("div");
  node.className = "cody-chat-message " +
    (role === "user" ? "cody-from-user" : "cody-from-bot");
  node.textContent = text;
  node.dir = "auto";
  node.lang = /[\u0600-\u06FF]/.test(text) ? "ar" : "en";
  messages.append(node);
  messages.scrollTop = messages.scrollHeight;
}

function openChat() {
  if (!panel) return;
  panel.hidden = false;
  launcher?.setAttribute("aria-expanded", "true");
  playCodyEmotion("wave");

  if (!authReady) {
    setStatus("جارٍ التحقق من جلسة الحساب...", "info");
  } else if (!currentUser) {
    setStatus("سجّل الدخول أولًا لاستخدام كودي.", "error");
  } else {
    setStatus("اسأل كودي عن البرمجة أو الدراسة أو أي موضوع عام مناسب.", "info");
  }

  input?.focus();
}

function closeChat() {
  if (!panel) return;
  panel.hidden = true;
  launcher?.setAttribute("aria-expanded", "false");
  playCodyEmotion("wave");
}

heroLauncher?.addEventListener("click", openChat);
launcher?.addEventListener("click", openChat);
closeButton?.addEventListener("click", closeChat);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && panel && !panel.hidden) closeChat();
});

onAuthStateChanged(auth, user => {
  currentUser = user;
  authReady = true;

  if (user) {
    setStatus("كودي جاهز لاستقبال أسئلتك.", "success");
  } else if (panel && !panel.hidden) {
    setStatus("سجّل الدخول أولًا لاستخدام كودي.", "error");
  }
});

form?.addEventListener("submit", async event => {
  event.preventDefault();

  if (sending) return;

  const question = input?.value.trim() || "";
  if (!question) return;

  if (!authReady) {
    setStatus("لحظة واحدة، جارٍ التحقق من الحساب.", "info");
    return;
  }

  if (!currentUser) {
    setStatus("انتهت جلسة الحساب أو لم يتم تسجيل الدخول. سجّل الدخول ثم حاول مجددًا.", "error");
    return;
  }

  sending = true;
  const submit = form.querySelector('button[type="submit"], button');
  if (submit) submit.disabled = true;
  if (input) input.disabled = true;

  addMessage(question, "user");
  setStatus("كودي بيجهّز الإجابة...", "loading");
  playCodyEmotion("encourage");

  try {
    const token = await currentUser.getIdToken();
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        question,
        history: history.slice(-10).map(item => ({
          role: item.role,
          text: String(item.text || "").slice(0, 1500)
        })),
        page_context: "CodeQuest learning platform. The student may ask about programming, school subjects, mathematics, science, languages, writing, study skills, technology, or general knowledge."
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("جلسة الدخول غير صالحة. سجّل الدخول من جديد ثم جرّب.");
      }
      if (response.status === 429) {
        throw new Error(data.message || "وصلت إلى حد الأسئلة المتاح حاليًا. حاول لاحقًا.");
      }
      throw new Error(
        data.message ||
        data.detail ||
        "تعذّر على كودي الرد الآن. حاول مرة أخرى بعد قليل."
      );
    }

    if (typeof data.answer !== "string" || !data.answer.trim()) {
      throw new Error("وصل رد غير مكتمل من كودي. حاول إرسال السؤال مرة أخرى.");
    }

    addMessage(data.answer.trim(), "model");
    history.push(
      { role: "user", text: question },
      { role: "model", text: data.answer.trim() }
    );
    history = history.slice(-10);

    if (input) input.value = "";
    setStatus("تم الرد", "success");
    playCodyEmotion("happy");
  } catch (error) {
    const message = error instanceof TypeError
      ? "تعذّر الاتصال بخدمة كودي. تحقّق من الإنترنت وحاول مجددًا."
      : (error?.message || "حدث خطأ غير متوقع أثناء إرسال السؤال.");

    setStatus(message, "error");
    if (input) input.value = question;
  } finally {
    sending = false;
    if (submit) submit.disabled = false;
    if (input) {
      input.disabled = false;
      input.focus();
    }
  }
});

if (launcher) {
  launcher.setAttribute("aria-controls", "codyChatPanel");
  launcher.setAttribute("aria-expanded", "false");
}

window.setTimeout(() => playCodyEmotion("wave"), 650);
