import { auth, db } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const API_URL = "https://codequest.mariam2009m44.workers.dev/api/cody/chat";
const HEALTH_URL = API_URL.slice(0, API_URL.lastIndexOf("/")) + "/health";
const launcher = document.getElementById("codyChatLauncher");
const heroLauncher = document.getElementById("codyHeroLauncher");
const panel = document.getElementById("codyChatPanel");
const closeButton = document.getElementById("codyChatClose");
const expandButton = document.getElementById("codyChatExpand");
const form = document.getElementById("codyChatForm");
const input = document.getElementById("codyChatInput");
const messages = document.getElementById("codyChatMessages");
const status = document.getElementById("codyChatStatus");
const sendButton = form?.querySelector('button[type="submit"]') || null;
const stopButton = document.getElementById("codyChatStop");

let currentUser = null;
let authReady = false;
let sending = false;
let history = [];
let healthPromise = null;
let focusBeforeChat = null;
let conversationLoadVersion = 0;

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

function appendInlineFormatting(parent, source) {
  const pattern = /(\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
  let cursor = 0;
  let match;
  while ((match = pattern.exec(source))) {
    if (match.index > cursor) parent.append(document.createTextNode(source.slice(cursor, match.index)));
    let element;
    if (match[2] !== undefined) {
      element = document.createElement("strong");
      element.textContent = match[2];
    } else if (match[3] !== undefined) {
      element = document.createElement("code");
      element.textContent = match[3];
    } else if (match[4] !== undefined) {
      element = document.createElement("em");
      element.textContent = match[4];
    } else {
      element = document.createElement("a");
      element.textContent = match[5];
      element.href = match[6];
      element.target = "_blank";
      element.rel = "noopener noreferrer";
    }
    parent.append(element);
    cursor = pattern.lastIndex;
  }
  if (cursor < source.length) parent.append(document.createTextNode(source.slice(cursor)));
}

function appendCodeBlock(container, source, language = "") {
  const shell = document.createElement("section");
  shell.className = "cody-code-shell";

  const toolbar = document.createElement("div");
  toolbar.className = "cody-code-toolbar";
  const languageLabel = document.createElement("span");
  languageLabel.className = "cody-code-language";
  languageLabel.textContent = language || "code";

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "cody-code-copy";
  copyButton.innerHTML = '<i class="ri-file-copy-line" aria-hidden="true"></i><span>نسخ الكود</span>';
  copyButton.setAttribute("aria-label", "نسخ الكود");
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(String(source));
      copyButton.querySelector("span").textContent = "تم النسخ";
      copyButton.querySelector("i").className = "ri-check-line";
    } catch {
      copyButton.querySelector("span").textContent = "تعذر النسخ";
    }
  });

  const pre = document.createElement("pre");
  pre.className = "cody-code-block";
  const code = document.createElement("code");
  code.textContent = source;
  pre.append(code);
  toolbar.append(languageLabel, copyButton);
  shell.append(toolbar, pre);
  container.append(shell);
}

function renderFormattedMessage(container, source) {
  const lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");
  let paragraph = [];
  let list = null;
  let codeLines = null;
  let codeLanguage = "";
  const flushParagraph = () => {
    if (!paragraph.length) return;
    const p = document.createElement("p");
    appendInlineFormatting(p, paragraph.join(" "));
    container.append(p);
    paragraph = [];
  };
  const flushList = () => { list = null; };
  const addListItem = (kind, content) => {
    flushParagraph();
    const tag = kind === "ol" ? "ol" : "ul";
    if (!list || list.tagName.toLowerCase() !== tag) {
      flushList();
      list = document.createElement(tag);
      container.append(list);
    }
    const li = document.createElement("li");
    appendInlineFormatting(li, content);
    list.append(li);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const fence = trimmed.match(/^```\s*([\w+-]*)/);
    if (fence && !codeLines) {
      flushParagraph(); flushList();
      codeLines = [];
      codeLanguage = fence[1] || "code";
      continue;
    }
    if (trimmed.startsWith("```") && codeLines) {
      appendCodeBlock(container, codeLines.join("\n"), codeLanguage);
      codeLines = null;
      codeLanguage = "";
      continue;
    }
    if (codeLines) { codeLines.push(line); continue; }
    if (!trimmed) { flushParagraph(); flushList(); continue; }
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushList();
      const h = document.createElement(heading[1].length === 1 ? "h2" : heading[1].length === 2 ? "h3" : "h4");
      appendInlineFormatting(h, heading[2]);
      container.append(h);
      continue;
    }
    const bullet = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bullet) { addListItem("ul", bullet[1]); continue; }
    const numbered = trimmed.match(/^\d+[.)、]\s+(.+)$/);
    if (numbered) { addListItem("ol", numbered[1]); continue; }
    if (trimmed.startsWith(">")) {
      flushParagraph(); flushList();
      const quote = document.createElement("blockquote");
      appendInlineFormatting(quote, trimmed.replace(/^>\s?/, ""));
      container.append(quote);
      continue;
    }
    if (/^---+$/.test(trimmed)) {
      flushParagraph(); flushList();
      container.append(document.createElement("hr"));
      continue;
    }
    flushList();
    paragraph.push(trimmed);
  }
  if (codeLines) {
    appendCodeBlock(container, codeLines.join("\n"), codeLanguage);
  }
  flushParagraph();
}

function addMessage(text, role, createdAt = null, options = {}) {
  if (!messages) return null;
  const node = document.createElement("article");
  node.className = "cody-chat-message " + (role === "user" ? "cody-from-user" : "cody-from-bot");
  node.dir = "auto";
  node.lang = /[\u0600-\u06FF]/.test(text) ? "ar" : "en";

  const meta = document.createElement("div");
  meta.className = "cody-message-meta";
  const icon = document.createElement("i");
  icon.className = role === "user" ? "ri-user-3-line" : "ri-robot-2-line";
  icon.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.textContent = role === "user" ? "أنت" : "كودي";
  const time = document.createElement("time");
  let messageDate;
  try {
    messageDate = createdAt?.toDate?.() || (createdAt instanceof Date ? createdAt : createdAt ? new Date(createdAt) : new Date());
    if (!(messageDate instanceof Date) || Number.isNaN(messageDate.getTime())) messageDate = new Date();
  } catch {
    messageDate = new Date();
  }
  time.dateTime = messageDate.toISOString();
  time.textContent = new Intl.DateTimeFormat("ar-EG", { dateStyle: "short", timeStyle: "short" }).format(messageDate);
  meta.append(icon, label, time);

  const body = document.createElement("div");
  body.className = "cody-message-body";
  renderFormattedMessage(body, text);
  node.append(meta, body);
  if (role !== "user") {
    const actions = document.createElement("div");
    actions.className = "cody-message-actions";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "cody-copy-response";
    copyButton.innerHTML = '<i class="ri-file-copy-line" aria-hidden="true"></i><span>نسخ الرد</span>';
    copyButton.setAttribute("aria-label", "نسخ رد كودي");
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(String(text));
        copyButton.querySelector("span").textContent = "تم النسخ";
        copyButton.querySelector("i").className = "ri-check-line";
      } catch {
        copyButton.querySelector("span").textContent = "تعذر النسخ";
      }
    });
    actions.append(copyButton);

    if (typeof options.regenerateText === "string" && options.regenerateText.trim()) {
      const regenerateButton = document.createElement("button");
      regenerateButton.type = "button";
      regenerateButton.className = "cody-followup-action cody-regenerate-action";
      regenerateButton.innerHTML = '<i class="ri-refresh-line" aria-hidden="true"></i><span>إعادة توليد الرد</span>';
      regenerateButton.addEventListener("click", () => {
        if (!input || !form || sending) return;
        const question = options.regenerateText.trim();
        const turnIndex = history.map(item => item.role === "user" && item.text === question)
          .lastIndexOf(true);
        if (turnIndex >= 0) history = history.slice(0, turnIndex);
        input.value = question;
        resizeComposer();
        form.requestSubmit();
      });
      actions.append(regenerateButton);
      actions.classList.add("has-followups");
    }

    if (typeof options.retryText === "string" && options.retryText.trim()) {
      const retryButton = document.createElement("button");
      retryButton.type = "button";
      retryButton.className = "cody-followup-action cody-retry-action";
      retryButton.innerHTML = '<i class="ri-refresh-line" aria-hidden="true"></i><span>إعادة المحاولة</span>';
      retryButton.addEventListener("click", () => {
        if (!input || !form || sending) return;
        const question = options.retryText.trim();
        // Remove the failed pending turn before resending it, preventing
        // duplicate copies of the same question in the next model context.
        const lastTurn = history[history.length - 1];
        if (lastTurn?.role === "user" && lastTurn.text === question) {
          history.pop();
        }
        input.value = question;
        form.requestSubmit();
      });
      actions.append(retryButton);
    }

    if (options.followups === true) {
      const followups = [
        { label: "بسّط الشرح", prompt: "ممكن تبسّط الشرح السابق أكثر، وتقسمه لخطوات قصيرة؟" },
        { label: "مثال عملي", prompt: "اديني مثالًا عمليًا واضحًا على الفكرة اللي شرحتها." },
        { label: "اختبر فهمي", prompt: "اعمل لي سؤالًا واحدًا قصيرًا عن الشرح السابق، واستنى إجابتي قبل ما تقول الحل." }
      ];
      followups.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cody-followup-action";
        button.textContent = item.label;
        button.addEventListener("click", () => {
          if (!input || !form || sending) return;
          input.value = item.prompt;
          form.requestSubmit();
        });
        actions.append(button);
      });
      actions.classList.add("has-followups");
    }

    node.append(actions);
  }
  messages.append(node);
  messages.scrollTo({ top: messages.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  return node;
}

function addServiceNotice(message) {
  if (!messages) return;
  const existing = messages.querySelector('[data-cody-service-notice="true"]');
  if (existing) {
    const body = existing.querySelector(".cody-message-body");
    if (body) body.textContent = message;
    return;
  }
  const notice = addMessage(message, "model");
  notice?.setAttribute("data-cody-service-notice", "true");
}

function showTyping() {
  if (!messages || messages.querySelector(".cody-chat-typing")) return;
  const typing = document.createElement("div");
  typing.className = "cody-chat-typing";
  typing.setAttribute("role", "status");
  typing.setAttribute("aria-label", "كودي يكتب الآن");
  typing.innerHTML = '<span class="cody-typing-label">كودي بيكتب</span><span></span><span></span><span></span>';
  messages.append(typing);
  panel?.setAttribute("aria-busy", "true");
  messages.scrollTop = messages.scrollHeight;
}

function hideTyping() {
  messages?.querySelector(".cody-chat-typing")?.remove();
  panel?.removeAttribute("aria-busy");
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
  if (!panel || !form || history.length || panel.querySelector(".cody-chat-suggestions")) return;
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
      if (!input || !form || sending) return;
      input.value = label;
      // Suggested questions should submit immediately through the normal flow.
      form.requestSubmit();
    });
    container.append(button);
  });

  form.before(container);
}

async function openChat() {
  if (!panel) return;
  if (panel.hidden) focusBeforeChat = document.activeElement;
  panel.hidden = false;
  launcher?.setAttribute("aria-expanded", "true");
  playCodyEmotion("wave");

  if (!authReady) {
    setStatus("جارٍ التحقق من جلسة الحساب...", "info");
    return;
  }
  if (!currentUser) {
    setStatus("سجّل الدخول أولًا لاستخدام كودي.", "error");
    return;
  }

  createSuggestions();
  input?.focus();
  try {
    const health = await getServiceHealth();
    if (health.configured === false) {
      const message = "كودي غير متاح حاليًا لأن مفتاح Gemini غير مضبوط على خادم المنصة. دي مشكلة إعدادات في الخادم، مش في سؤالك.";
      setStatus(message, "error");
      addServiceNotice(message);
    } else if (health.quotaAvailable === false) {
      const message = "كودي متوقف مؤقتًا لأن حماية الاستخدام اليومي غير مفعّلة على الخادم.";
      setStatus(message, "error");
      addServiceNotice(message);
    } else if (health.ready === true) {
      setStatus("إعدادات كودي موجودة. توافر الرد يتأكد عند إرسال السؤال.", "info");
    } else {
      const message = "خدمة كودي استجابت، لكن إعداداتها غير مكتملة حتى الآن.";
      setStatus(message, "info");
      addServiceNotice(message);
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
  const target = focusBeforeChat && document.contains(focusBeforeChat) ? focusBeforeChat : launcher;
  target?.focus?.();
  focusBeforeChat = null;
}

heroLauncher?.addEventListener("click", openChat);
launcher?.addEventListener("click", openChat);
closeButton?.addEventListener("click", closeChat);
expandButton?.addEventListener("click", () => {
  if (!panel) return;
  const expanded = panel.classList.toggle("is-expanded");
  expandButton.setAttribute("aria-pressed", String(expanded));
  expandButton.setAttribute("aria-label", expanded ? "تصغير نافذة المحادثة" : "تكبير نافذة المحادثة");
  expandButton.setAttribute("title", expanded ? "تصغير نافذة المحادثة" : "تكبير نافذة المحادثة");
  const icon = expandButton.querySelector("i");
  if (icon) icon.className = expanded ? "ri-fullscreen-exit-line" : "ri-fullscreen-line";
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && panel && !panel.hidden) {
    closeChat();
  }
});

let activeRequestController = null;
let stopRequested = false;
let previousAuthUid = null;
let requestGeneration = 0;

stopButton?.addEventListener("click", () => {
  if (!sending || !activeRequestController) return;
  stopRequested = true;
  setStatus("تم إيقاف الرد. تقدر تسأل كودي سؤالًا آخر.", "info");
  activeRequestController.abort();
  stopButton.disabled = true;
});

async function persistConversationMessage(uid, role, text) {
  if (!uid || !["user", "model"].includes(role) || !String(text || "").trim()) return;
  try {
    await addDoc(collection(db, "users", uid, "codyMessages"), {
      role,
      text: String(text).slice(0, 5000),
      createdAt: serverTimestamp()
    });
  } catch (error) {
    // Chat remains usable if optional conversation history cannot be saved.
    console.warn("Cody conversation history could not be saved:", error?.code || error);
  }
}

async function restoreConversation(uid, loadVersion) {
  try {
    const messagesQuery = query(
      collection(db, "users", uid, "codyMessages"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snapshot = await getDocs(messagesQuery);
    if (loadVersion !== conversationLoadVersion || currentUser?.uid !== uid || !messages) return;

    const saved = snapshot.docs
      .map(doc => doc.data())
      .filter(item =>
        ["user", "model"].includes(item.role) &&
        typeof item.text === "string" &&
        item.text.trim()
      )
      .reverse();

    messages.querySelectorAll(
      ".cody-chat-message:not(#codyWelcomeMessage), .cody-chat-typing"
    ).forEach(node => node.remove());

    const welcome = messages.querySelector("#codyWelcomeMessage");
    let renderedCount = 0;
    for (const item of saved) {
      try {
        const rendered = addMessage(
          item.text,
          item.role,
          item.createdAt,
          {
            followups: item.role === "model",
            regenerateText: item.role === "model" && saved[saved.indexOf(item) - 1]?.role === "user"
              ? saved[saved.indexOf(item) - 1].text
              : ""
          }
        );
        if (rendered) renderedCount += 1;
      } catch (renderError) {
        console.warn("A saved Cody message could not be displayed:", renderError);
      }
    }

    // Never leave the transcript empty: retain the welcome bubble if history
    // is empty or an older/corrupt record cannot be rendered.
    if (renderedCount > 0) {
      welcome?.remove();
      history = saved.slice(-10).map(item => ({ role: item.role, text: item.text }));
    } else {
      history = [];
      if (welcome) {
        welcome.hidden = false;
        welcome.textContent = "أهلًا! أنا كودي. اكتب سؤالك في الأسفل واضغط زر الإرسال، وسأساعدك خطوة بخطوة.";
      } else {
        addMessage("أهلًا! أنا كودي. اكتب سؤالك في الأسفل واضغط زر الإرسال، وسأساعدك خطوة بخطوة.", "model");
      }
    }
    if (!history.length) createSuggestions();
  } catch (error) {
    console.warn("Cody conversation history could not be restored:", error?.code || error);
    if (loadVersion === conversationLoadVersion && currentUser?.uid === uid) {
      setStatus("كودي جاهز. تعذّر استرجاع المحادثة السابقة، لكن يمكنك بدء محادثة جديدة.", "info");
      if (!history.length) createSuggestions();
    }
  }
}

onAuthStateChanged(auth, async user => {
  const nextUid = user?.uid || null;
  const accountChanged = previousAuthUid !== nextUid;

  if (accountChanged) {
    // Invalidate pending restores and isolate every learner's private chat.
    conversationLoadVersion += 1;
    requestGeneration += 1;
    activeRequestController?.abort();
    sending = false;stopRequested = false;
    if(input){input.disabled=false;input.value="";}
    if(sendButton)sendButton.disabled=false;
    if(stopButton){stopButton.hidden=true;stopButton.disabled=false;}
    hideTyping();
    history = [];
    messages?.querySelectorAll(
      ".cody-chat-message:not(#codyWelcomeMessage), .cody-chat-typing"
    ).forEach(node => node.remove());

    const welcome = messages?.querySelector("#codyWelcomeMessage");
    if (welcome) {
      welcome.hidden = false;
      welcome.textContent = "أهلًا! أنا كودي. اسألني عن الدراسة أو العلوم أو الرياضيات أو اللغات أو البرمجة أو أي فكرة مناسبة، وهنفكر فيها مع بعض خطوة بخطوة.";
    } else if (messages && !messages.querySelector(".cody-chat-message")) {
      addMessage("أهلًا! أنا كودي. اسألني عن الدراسة أو العلوم أو الرياضيات أو اللغات أو البرمجة أو أي فكرة مناسبة، وهنفكر فيها مع بعض خطوة بخطوة.", "model");
    }
    panel?.querySelector(".cody-chat-suggestions")?.remove();
    previousAuthUid = nextUid;
  }

  currentUser = user;
  authReady = true;

  if (user) {
    const loadVersion = conversationLoadVersion;
    setStatus("كودي جاهز. جارٍ استرجاع محادثتك السابقة...", "info");
    await restoreConversation(user.uid, loadVersion);
    if (loadVersion !== conversationLoadVersion || currentUser?.uid !== user.uid) return;
    setStatus("كودي جاهز لاستقبال أسئلتك.", "success");
  } else if (panel && !panel.hidden) {
    setStatus("سجّل الدخول أولًا لاستخدام كودي.", "error");
  } else {
    setStatus("");
  }
});


function resizeComposer() {
  if (!input) return;
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 150) + "px";
}
input?.addEventListener("input", resizeComposer);

// Capture the actual tap before the browser's native form activation.
// This avoids relying on requestSubmit(), which can be inconsistent in some
// embedded Android browsers. The same handler is also used by keyboard submit.
input?.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    form?.requestSubmit();
  }
});

async function handleCodySubmit(event) {
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

  // A late saved-history response must never replace this new conversation.
  conversationLoadVersion += 1;
  const requestId = ++requestGeneration;
  sending = true;
  stopRequested = false;
  const submit = form.querySelector('button[type="submit"]');
  if (submit) submit.disabled = true;
  if (stopButton) { stopButton.hidden = false; stopButton.disabled = false; }
  if (input) input.disabled = true;

  panel?.querySelector(".cody-chat-suggestions")?.remove();
  addMessage(question, "user");
  void persistConversationMessage(currentUser.uid, "user", question);
  showTyping();
  setStatus("كودي بيجهّز الإجابة...", "loading");
  playCodyEmotion("encourage");

  const requestUser = currentUser;
  const controller = new AbortController();
  activeRequestController = controller;

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    controller.signal.addEventListener("abort",()=>{const error=new Error("Request cancelled");error.name="AbortError";reject(error);},{once:true});
    timeoutId = window.setTimeout(() => {
      controller.abort();
      const timeoutError = new Error("انتهت مهلة الاتصال بخدمة كودي.");
      timeoutError.name = "TimeoutError";
      reject(timeoutError);
    }, 48000);
  });

  try {
    // Apply one end-to-end deadline to token refresh, Firestore context,
    // the Worker request, and reading its response body. Previously the
    // timer was cleared as soon as fetch returned headers, which could leave
    // the chat stuck forever while waiting for JSON/body data.
    const token = await Promise.race([
      requestUser.getIdToken(),
      timeoutPromise
    ]);
    if(controller.signal.aborted || requestId!==requestGeneration || currentUser?.uid!==requestUser.uid)return;
    // Cody no longer waits for optional Firestore profile or lesson reads.
    // Conversation context remains in memory for this active page session.

    const response = await Promise.race([
      fetch(API_URL, {
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
            "CodeQuest learning platform. Answer general safe questions as well as programming, school subjects, mathematics, science, languages, writing, study skills, technology, and general knowledge.",
          ].filter(Boolean).join(" | ").slice(0, 1450)
        }),
        signal: controller.signal
      }),
      timeoutPromise
    ]);

    const data = await Promise.race([
      response.json().catch(() => ({})),
      timeoutPromise
    ]);

    if (requestId !== requestGeneration || currentUser?.uid !== requestUser.uid) return;

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("جلسة الدخول غير صالحة. سجّل الدخول من جديد ثم جرّب.");
      }
      if (response.status === 429) {
        throw new Error(data.message || "وصلت إلى حد الأسئلة المتاح حاليًا. حاول لاحقًا.");
      }
      const serviceMessage = data.message || data.detail || "تعذّر على كودي الرد الآن. حاول مرة أخرى بعد قليل.";
      const diagnosticCode = typeof data.errorCode === "string" && /^[A-Z0-9_]{1,80}$/.test(data.errorCode) ? data.errorCode : "CODY_REQUEST_FAILED";
      const providerStatus = Number.isInteger(data.providerHttpStatus) ? data.providerHttpStatus : response.status;
      throw new Error(`${serviceMessage} (رمز التشخيص: ${diagnosticCode} / ${providerStatus})`);
    }

    if (typeof data.answer !== "string" || !data.answer.trim()) {
      throw new Error("وصل رد غير مكتمل من كودي. حاول إرسال السؤال مرة أخرى.");
    }

    addMessage(data.answer.trim(), "model", null, { followups: true, regenerateText: question });
    void persistConversationMessage(requestUser.uid, "model", data.answer.trim());
    const userText = question || "ممكن تشرحلي الصورة دي؟";
    history.push(
      { role: "user", text: userText },
      { role: "model", text: data.answer.trim() }
    );
    history = history.slice(-10);

    if (input) { input.value = ""; input.style.height = "auto"; }
    if (!status?.textContent.includes("تعذر حفظ")) setStatus("تم الرد", "success");
    playCodyEmotion("happy");
  } catch (error) {
    // A sign-out or account switch intentionally aborts the old account's request.
    if (requestId !== requestGeneration || currentUser?.uid !== requestUser.uid) return;
    if (stopRequested && error?.name === "AbortError") {
      const lastTurn = history[history.length - 1];
      if (!(lastTurn?.role === "user" && lastTurn.text === question)) {
        history.push({ role: "user", text: question });
        history = history.slice(-10);
      }
      setStatus("تم إيقاف الرد. تقدر تكمل بسؤال جديد.", "info");
      return;
    }

    const message = error?.name === "AbortError" || error?.name === "TimeoutError"
      ? "تأخر رد كودي أكثر من المتوقع. جرّب سؤالًا أقصر ثم أعد المحاولة."
      : error instanceof TypeError
        ? "تعذّر الاتصال بخدمة كودي. تحقّق من الإنترنت وحاول مجددًا."
        : (error?.message || "حدث خطأ غير متوقع أثناء إرسال السؤال.");

    setStatus("لم يصل رد. التفاصيل وزر إعادة المحاولة في المحادثة.", "error");
    // Show failures in the conversation itself, not only in the small status line.
    // This makes missing Worker/Gemini configuration visible to the learner.
    addMessage("مش قادر أرد على السؤال دلوقتي: " + message, "model", null, {
      retryText: question
    });
    // Retain unanswered questions so a later follow-up keeps its context.
    const lastTurn = history[history.length - 1];
    if (!(lastTurn?.role === "user" && lastTurn.text === question)) {
      history.push({ role: "user", text: question });
      history = history.slice(-10);
    }
    if (input) { input.value = question; resizeComposer(); }
  } finally {
    window.clearTimeout(timeoutId);
    if(requestId !== requestGeneration)return;
    hideTyping();
    if (activeRequestController === controller) activeRequestController = null;
    sending = false;
    stopRequested = false;
    if (stopButton) { stopButton.hidden = true; stopButton.disabled = false; }
    if (submit) submit.disabled = false;
    if (input) {
      input.disabled = false;
      input.focus();
    }
  }
}

// Keep one submission path for every input method.
// The send button explicitly dispatches the form's submit event; Enter keeps
// using the same form handler. Avoid pointerup/touchend fallbacks because they
// can cancel the browser's click activation on Android and create racey submits.
form?.addEventListener("submit", event => {
  void handleCodySubmit(event).catch(error => {
    console.error("Cody submit handler failed unexpectedly:", error);
    sending = false;
    if (sendButton) sendButton.disabled = false;
    if (input) input.disabled = false;
    hideTyping();
    const detail = error instanceof Error
      ? (error.name + ": " + error.message)
      : String(error || "Unknown error");
    console.error("Cody submission root cause:", error);
    const message = "تعذر بدء إرسال السؤال: " + detail;
    setStatus(message, "error");
    addMessage(message, "model");
  });
});

sendButton?.addEventListener("click", event => {
  event.preventDefault();
  if (!form || sending || sendButton.disabled) return;
  if (!input?.value.trim()) {
    setStatus("اكتب سؤالك أولًا ثم اضغط إرسال.", "info");
    input?.focus();
    return;
  }

  // Dispatch a real, cancelable submit event so the exact same handler runs
  // on mobile, desktop, and keyboard without relying on requestSubmit support.
  form.dispatchEvent(new Event("submit", {
    bubbles: true,
    cancelable: true
  }));
});


if (launcher) {
  launcher.setAttribute("aria-controls", "codyChatPanel");
  launcher.setAttribute("aria-expanded", "false");
}

window.setTimeout(() => playCodyEmotion("wave"), 650);
