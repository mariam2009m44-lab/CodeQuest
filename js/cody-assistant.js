import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const API_URL = "https://codequest.mariam2009m44.workers.dev/api/cody/chat";
const HEALTH_URL = API_URL.slice(0, API_URL.lastIndexOf("/")) + "/health";
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
let healthPromise = null;

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

async function getServiceHealth() {
  if (!healthPromise) {
    healthPromise = fetch(HEALTH_URL, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store"
    }).then(async response => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("تعذر فحص خدمة كودي.");
      // Keep a successful ready result for this page session, but recheck
      // unavailable configuration on the next open after the owner fixes it.
      if (data.ready !== true) healthPromise = null;
      return data;
    }).catch(error => {
      healthPromise = null;
      throw error;
    });
  }
  return healthPromise;
}

function createSuggestions() {
  if (!panel || !form || panel.querySelector(".cody-chat-suggestions")) return;
  const container = document.createElement("div");
  container.className = "cody-chat-suggestions";
  container.setAttribute("aria-label", "أسئلة مقترحة");

  [
    "اشرحلي موضوع علمي بطريقة بسيطة",
    "ساعدني أحل مسألة رياضيات خطوة بخطوة",
    "ترجملي الجملة دي واشرح معناها",
    "اقترحلي فكرة مشروع إبداعي",
    "احكيلي معلومة عامة مميزة"
  ].forEach(label => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cody-chat-suggestion";
    button.textContent = label;
    button.addEventListener("click", () => {
      if (!input || sending) return;
      input.value = label;
      input.focus();
    });
    container.append(button);
  });

  form.before(container);
}

async function openChat() {
  if (!panel) return;
  panel.hidden = false;
  launcher?.setAttribute("aria-expanded", "true");
  playCodyEmotion("wave");
  createSuggestions();

  if (!authReady) {
    setStatus("جارٍ التحقق من جلسة الحساب...", "info");
    return;
  }
  if (!currentUser) {
    setStatus("سجّل الدخول أولًا لاستخدام كودي.", "error");
    return;
  }

  input?.focus();
  try {
    const health = await getServiceHealth();
    if (health.configured === false) {
      setStatus("كودي غير متاح حاليًا: إعداد تشغيل الذكاء الاصطناعي غير مكتمل على خادم المنصة. المشكلة من إعدادات الخادم وليست من حسابك أو جهازك.", "error");
    } else if (health.quotaAvailable === false) {
      setStatus("حماية الاستخدام اليومي غير مفعّلة على الخادم؛ الإرسال متوقف لحماية الخدمة.", "error");
    } else if (health.ready === true) {
      setStatus("كودي متصل وجاهز لاستقبال أسئلتك.", "success");
    } else {
      setStatus("الخدمة استجابت، لكن إعداداتها تحتاج إلى مراجعة.", "info");
    }
  } catch {
    setStatus("لم نتمكن من فحص حالة كودي الآن. يمكنك المحاولة، وسنوضح لك أي مشكلة تظهر.", "info");
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

let activeRequestController = null;
let previousAuthUid = null;

onAuthStateChanged(auth, user => {
  const nextUid = user?.uid || null;
  const accountChanged = previousAuthUid !== nextUid;

  if (accountChanged) {
    // Never carry one account's private conversation into another account.
    activeRequestController?.abort();
    history = [];
    messages?.querySelectorAll(".cody-chat-message").forEach(node => node.remove());
    previousAuthUid = nextUid;
  }

  currentUser = user;
  authReady = true;

  if (user) {
    setStatus("كودي جاهز لاستقبال أسئلتك.", "success");
  } else if (panel && !panel.hidden) {
    setStatus("سجّل الدخول أولًا لاستخدام كودي.", "error");
  } else {
    setStatus("");
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

  const requestUser = currentUser;
  const controller = new AbortController();
  activeRequestController = controller;

  try {
    const token = await requestUser.getIdToken();
    const timeoutId = window.setTimeout(() => controller.abort(), 48000);
    let response;

    try {
      response = await fetch(API_URL, {
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
        page_context: [
          document.title,
          location.pathname,
          "CodeQuest learning platform. Answer general safe questions as well as programming, school subjects, mathematics, science, languages, writing, study skills, technology, and general knowledge."
        ].join(" | ")
      }),
      signal: controller.signal
      });
    } finally {
      window.clearTimeout(timeoutId);
    }

    const data = await response.json().catch(() => ({}));

    if (currentUser?.uid !== requestUser.uid) return;

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
    // A sign-out or account switch intentionally aborts the old account's request.
    if (currentUser?.uid !== requestUser.uid) return;

    const message = error?.name === "AbortError" || error?.name === "TimeoutError"
      ? "تأخر رد كودي أكثر من المتوقع. جرّب سؤالًا أقصر ثم أعد المحاولة."
      : error instanceof TypeError
        ? "تعذّر الاتصال بخدمة كودي. تحقّق من الإنترنت وحاول مجددًا."
        : (error?.message || "حدث خطأ غير متوقع أثناء إرسال السؤال.");

    setStatus(message, "error");
    if (input) input.value = question;
  } finally {
    if (activeRequestController === controller) activeRequestController = null;
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
