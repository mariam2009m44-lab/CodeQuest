import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const API_URL = "https://codequest.mariam2009m44.workers.dev/api/cody/chat";
const HEALTH_URL = API_URL.replace(/\/chat$/, "/health");

const launcher = document.getElementById("codyChatLauncher");
const heroLauncher = document.getElementById("codyHeroLauncher");
const panel = document.getElementById("codyChatPanel");
const closeButton = document.getElementById("codyChatClose");
const form = document.getElementById("codyChatForm");
const input = document.getElementById("codyChatInput");
const messages = document.getElementById("codyChatMessages");
const status = document.getElementById("codyChatStatus");

let currentUser = null;
let history = [];
let requestInProgress = false;
let healthPromise = null;
let resolveAuthReady;

const authReady = new Promise(resolve => {
  resolveAuthReady = resolve;
});

const CODY_EMOTION_CLASSES = [
  "is-waving",
  "is-happy",
  "is-celebrating",
  "is-encouraging"
];

let emotionTimer = null;

function setStatus(message = "") {
  if (status) status.textContent = message;
}

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
    characters.forEach(character => {
      character.classList.remove(...CODY_EMOTION_CLASSES);
    });
  }, emotion === "celebrate" ? 2600 : 1900);
}

window.addEventListener("codequest:cody-emotion", event => {
  playCodyEmotion(event.detail?.emotion || "wave");
});

function addMessage(messageText, role) {
  if (!messages) return;

  const node = document.createElement("div");
  node.className =
    "cody-chat-message " +
    (role === "user" ? "cody-from-user" : "cody-from-bot");
  node.textContent = String(messageText);
  node.dir = "auto";
  node.setAttribute("role", "listitem");
  messages.append(node);
  messages.scrollTop = messages.scrollHeight;
}

function setBusy(busy) {
  requestInProgress = busy;

  const submit = form?.querySelector('button[type="submit"]');
  if (submit) submit.disabled = busy;

  if (input) input.disabled = busy;
  if (messages) messages.setAttribute("aria-busy", String(busy));
  if (form) form.setAttribute("aria-busy", String(busy));
}

function createSuggestions() {
  if (!panel || !form || panel.querySelector(".cody-chat-suggestions")) return;

  const suggestions = document.createElement("div");
  suggestions.className = "cody-chat-suggestions";
  suggestions.setAttribute("aria-label", "أسئلة مقترحة");

  [
    "اشرحلي فكرة صعبة ببساطة",
    "ساعدني أفهم مسألة رياضيات",
    "راجع الكود ده معايا",
    "عايز أعرف معلومة جديدة"
  ].forEach(label => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cody-chat-suggestion";
    button.textContent = label;
    button.addEventListener("click", () => {
      if (!input || requestInProgress) return;
      input.value = label;
      input.focus();
    });
    suggestions.append(button);
  });

  form.before(suggestions);
}

async function getServiceHealth() {
  if (!healthPromise) {
    healthPromise = fetch(HEALTH_URL, {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store"
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error("تعذر فحص خدمة كودي.");
        return data;
      })
      .catch(error => {
        healthPromise = null;
        throw error;
      });
  }

  return healthPromise;
}

async function openChat() {
  if (!panel) return;

  panel.hidden = false;
  launcher?.setAttribute("aria-expanded", "true");
  playCodyEmotion("wave");
  createSuggestions();

  await authReady;

  if (!currentUser) {
    setStatus("سجّل الدخول أولًا لاستخدام محادثة كودي.");
    return;
  }

  input?.focus();

  try {
    const health = await getServiceHealth();

    if (health.configured === false) {
      setStatus("خدمة الذكاء الاصطناعي غير مكتملة الإعداد. يلزم ضبط مفتاح Gemini في Cloudflare.");
    } else if (health.quotaAvailable === false) {
      setStatus("حماية استخدام كودي غير مفعّلة على الخادم؛ أُوقف الإرسال لحماية الخدمة.");
    } else if (health.ready === true) {
      setStatus("كودي متصل وجاهز لاستقبال أسئلتك.");
    } else {
      setStatus("كودي متاح، لكن حالة الخدمة تحتاج إلى مراجعة.");
    }
  } catch {
    setStatus("لم نتمكن من فحص حالة كودي الآن. يمكنك المحاولة، وسنوضح لك أي مشكلة تظهر.");
  }
}

heroLauncher?.addEventListener("click", () => launcher?.click());
launcher?.addEventListener("click", openChat);

closeButton?.addEventListener("click", () => {
  if (panel) panel.hidden = true;
  launcher?.setAttribute("aria-expanded", "false");
  playCodyEmotion("wave");
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && panel && !panel.hidden) {
    panel.hidden = true;
    launcher?.setAttribute("aria-expanded", "false");
    launcher?.focus();
  }
});

onAuthStateChanged(
  auth,
  user => {
    currentUser = user;
    resolveAuthReady(user);

    if (panel && !panel.hidden && !user) {
      setStatus("انتهت جلسة الدخول. سجّل الدخول مرة أخرى لاستخدام كودي.");
    }
  },
  error => {
    console.error("Cody authentication state error:", error);
    currentUser = null;
    resolveAuthReady(null);
    setStatus("تعذر التحقق من جلسة الحساب. حدّث الصفحة وحاول مرة أخرى.");
  }
);

form?.addEventListener("submit", async event => {
  event.preventDefault();

  if (requestInProgress || !input) return;

  const question = input.value.trim();
  if (!question) return;

  await authReady;

  if (!currentUser) {
    setStatus("سجّل الدخول أولًا لاستخدام محادثة كودي.");
    return;
  }

  if (question.length > 3000) {
    setStatus("السؤال طويل جدًا. اختصره إلى 3000 حرف أو أقل.");
    return;
  }

  input.value = "";
  addMessage(question, "user");
  setStatus("كودي بيقرأ سؤالك وبيجهز الإجابة...");
  setBusy(true);

  const suggestions = panel?.querySelector(".cody-chat-suggestions");
  if (suggestions) suggestions.hidden = true;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 48000);

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
        page_context: [
          document.title,
          location.pathname,
          "CodeQuest learning platform. Answer general safe questions as well as programming, mathematics, science, and lesson questions."
        ].join(" | ")
      }),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.message || data.detail;
      if (response.status === 401) {
        throw new Error("جلسة الدخول غير صالحة. سجّل الدخول من جديد.");
      }
      if (response.status === 429) {
        throw new Error(message || "وصلت للحد اليومي المسموح لأسئلة كودي. حاول غدًا.");
      }
      if (response.status === 503 && !data.message) {
        throw new Error("خدمة كودي غير جاهزة حاليًا. راجع إعدادات الخادم.");
      }
      throw new Error(message || "كودي لم يتمكن من الرد الآن. حاول مرة أخرى.");
    }

    if (data.success === false || typeof data.answer !== "string" || !data.answer.trim()) {
      throw new Error(data.message || "كودي لم يتمكن من تكوين إجابة واضحة.");
    }

    addMessage(data.answer, "model");
    history.push(
      { role: "user", text: question },
      { role: "model", text: data.answer }
    );
    history = history.slice(-10);
    setStatus("");
    playCodyEmotion("happy");
  } catch (error) {
    if (error?.name === "AbortError") {
      setStatus("استغرق الرد وقتًا أطول من المتوقع. جرّب سؤالًا أقصر أو أعد المحاولة.");
    } else {
      setStatus(error?.message || "حدث خطأ في الاتصال بكودي.");
    }
  } finally {
    window.clearTimeout(timeoutId);
    setBusy(false);
    input.focus();
  }
});

window.setTimeout(() => playCodyEmotion("wave"), 650);
