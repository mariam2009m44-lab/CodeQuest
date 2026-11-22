import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
const imageInput = document.getElementById("codyChatImage");
const imageButton = document.getElementById("codyChatImageButton");
const imagePreview = document.getElementById("codyChatImagePreview");
let selectedImageData = null;

let currentUser = null;
let authReady = false;
let sending = false;
let history = [];
let healthPromise = null;
let focusBeforeChat = null;

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
      const pre = document.createElement("pre");
      pre.className = "cody-code-block";
      if (codeLanguage) {
        const label = document.createElement("span");
        label.className = "cody-code-language";
        label.textContent = codeLanguage;
        pre.append(label);
      }
      const code = document.createElement("code");
      code.textContent = codeLines.join("\n");
      pre.append(code);
      container.append(pre);
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
    const pre = document.createElement("pre");
    pre.className = "cody-code-block";
    const code = document.createElement("code");
    code.textContent = codeLines.join("\n");
    pre.append(code);
    container.append(pre);
  }
  flushParagraph();
}

function addMessage(text, role, imageData = null) {
  if (!messages) return;
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
  time.dateTime = new Date().toISOString();
  time.textContent = new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  meta.append(icon, label, time);

  const body = document.createElement("div");
  body.className = "cody-message-body";
  renderFormattedMessage(body, text);
  if (imageData && /^data:image\/(png|jpeg|webp);base64,/.test(imageData)) {
    const image = document.createElement("img");
    image.className = "cody-message-image";
    image.src = imageData;
    image.alt = role === "user" ? "الصورة المرسلة إلى كودي" : "صورة مرفقة في المحادثة";
    image.loading = "lazy";
    body.append(image);
  }
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
    node.append(actions);
  }
  messages.append(node);
  messages.scrollTo({ top: messages.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function showTyping() {
  if (!messages || messages.querySelector(".cody-chat-typing")) return;
  const typing = document.createElement("div");
  typing.className = "cody-chat-typing";
  typing.setAttribute("role", "status");
  typing.setAttribute("aria-label", "كودي يكتب الآن");
  typing.innerHTML = "<span></span><span></span><span></span>";
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
  if (panel.hidden) focusBeforeChat = document.activeElement;
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
      const message = "كودي غير متاح حاليًا لأن مفتاح Gemini غير مضبوط على خادم المنصة. دي مشكلة إعدادات في الخادم، مش في سؤالك.";
      setStatus(message, "error");
      addMessage(message, "model");
    } else if (health.quotaAvailable === false) {
      const message = "كودي متوقف مؤقتًا لأن حماية الاستخدام اليومي غير مفعّلة على الخادم.";
      setStatus(message, "error");
      addMessage(message, "model");
    } else if (health.ready === true) {
      setStatus("كودي متصل وجاهز لاستقبال أسئلتك.", "success");
    } else {
      const message = "خدمة كودي استجابت، لكن إعداداتها غير مكتملة حتى الآن.";
      setStatus(message, "info");
      addMessage(message, "model");
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

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && panel && !panel.hidden) closeChat();
});

let activeRequestController = null;
let previousAuthUid = null;
let conversationLoadUid = null;

async function persistChatMessage(uid, role, text, imageData = null) {
  const payload = {
    role,
    text: String(text || "").slice(0, 5000),
    createdAt: serverTimestamp()
  };
  if (imageData) payload.imageData = imageData;
  await addDoc(collection(db, "users", uid, "codyMessages"), payload);
}

async function loadChatHistory(user) {
  if (!messages || !user || conversationLoadUid === user.uid) return;
  conversationLoadUid = user.uid;
  setStatus("جارٍ تحميل محادثاتك السابقة...", "info");
  try {
    const saved = await getDocs(query(
      collection(db, "users", user.uid, "codyMessages"),
      orderBy("createdAt", "desc"),
      limit(50)
    ));
    if (currentUser?.uid !== user.uid) return;
    messages.querySelectorAll(".cody-chat-message").forEach(node => node.remove());
    history = [];
    const records = saved.docs.map(item => item.data()).reverse();
    if (!records.length) {
      addMessage("أهلًا! أنا كودي. اسألني عن الدراسة أو العلوم أو الرياضيات أو اللغات أو البرمجة أو أي فكرة مناسبة، وهنفكر فيها مع بعض خطوة بخطوة.", "model");
    }
    for (const item of records) {
      if (!["user", "model"].includes(item.role) || typeof item.text !== "string") continue;
      addMessage(item.text, item.role, item.imageData || null);
      history.push({ role: item.role, text: item.text });
    }
    history = history.slice(-10);
    setStatus("محادثاتك محفوظة على حسابك.", "success");
    createSuggestions();
  } catch (error) {
    console.warn("Could not load Cody conversation history:", error?.code || error);
    setStatus("تعذر تحميل السجل الآن. يمكنك متابعة المحادثة، وسنحاول الحفظ عند الإرسال.", "info");
  }
}

onAuthStateChanged(auth, user => {
  const nextUid = user?.uid || null;
  const accountChanged = previousAuthUid !== nextUid;

  if (accountChanged) {
    // Never carry one account's private conversation into another account.
    activeRequestController?.abort();
    history = [];
    conversationLoadUid = null;
    selectedImageData = null;
    if (imagePreview) imagePreview.replaceChildren();
    messages?.querySelectorAll(".cody-chat-message").forEach(node => node.remove());
    previousAuthUid = nextUid;
  }

  currentUser = user;
  authReady = true;

  if (user) {
    setStatus("كودي جاهز لاستقبال أسئلتك.", "success");
    loadChatHistory(user);
  } else if (panel && !panel.hidden) {
    setStatus("سجّل الدخول أولًا لاستخدام كودي.", "error");
  } else {
    setStatus("");
  }
});


async function prepareChatImage(file) {
  if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) {
    setStatus("اختار صورة بصيغة PNG أو JPG أو WebP.", "error");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    setStatus("حجم الصورة الأصلي يجب ألا يتجاوز 5 ميجابايت.", "error");
    return;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { alpha: false });
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    let quality = 0.78;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > 520000 && quality > 0.42) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
    if (dataUrl.length > 520000) throw new Error("IMAGE_TOO_LARGE");
    selectedImageData = dataUrl;
    if (imagePreview) {
      imagePreview.replaceChildren();
      const image = document.createElement("img");
      image.src = dataUrl;
      image.alt = "معاينة الصورة المرفقة";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "إزالة الصورة";
      remove.addEventListener("click", () => {
        selectedImageData = null;
        imagePreview.replaceChildren();
        if (imageInput) imageInput.value = "";
      });
      imagePreview.append(image, remove);
    }
    setStatus("الصورة جاهزة للإرسال إلى كودي.", "success");
  } catch (error) {
    console.warn("Image preparation failed:", error);
    setStatus("تعذر تجهيز الصورة. جرّب صورة أخرى.", "error");
  }
}
imageButton?.addEventListener("click", () => imageInput?.click());
imageInput?.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (file) prepareChatImage(file);
  imageInput.value = "";
});

function resizeComposer() {
  if (!input) return;
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 150) + "px";
}
input?.addEventListener("input", resizeComposer);
input?.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    form?.requestSubmit();
  }
});

form?.addEventListener("submit", async event => {
  event.preventDefault();

  if (sending) return;

  const question = input?.value.trim() || "";
  if (!question && !selectedImageData) return;

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

  panel?.querySelector(".cody-chat-suggestions")?.remove();
  const imageForRequest = selectedImageData;
  addMessage(question || "ممكن تشرحلي الصورة دي؟", "user", imageForRequest);
  showTyping();
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
        question: question || "حلّل الصورة المرفقة واشرح ما يظهر فيها بطريقة واضحة.",
        imageData: imageForRequest || undefined,
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
    const userText = question || "ممكن تشرحلي الصورة دي؟";
    history.push(
      { role: "user", text: userText },
      { role: "model", text: data.answer.trim() }
    );
    try {
      await persistChatMessage(requestUser.uid, "user", userText, imageForRequest);
      await persistChatMessage(requestUser.uid, "model", data.answer.trim());
      setStatus("تم الرد وحفظ المحادثة على حسابك.", "success");
    } catch (saveError) {
      console.warn("Cody reply succeeded but chat history could not be saved:", saveError?.code || saveError);
      setStatus("تم الرد، لكن تعذر حفظ المحادثة الآن.", "info");
    }
    selectedImageData = null;
    if (imagePreview) imagePreview.replaceChildren();
    history = history.slice(-10);

    if (input) { input.value = ""; input.style.height = "auto"; }
    if (!status?.textContent.includes("تعذر حفظ")) setStatus("تم الرد", "success");
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
    // Show failures in the conversation itself, not only in the small status line.
    // This makes missing Worker/Gemini configuration visible to the learner.
    addMessage("مش قادر أرد على السؤال دلوقتي: " + message, "model");
    if (input) { input.value = question; resizeComposer(); }
  } finally {
    hideTyping();
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
