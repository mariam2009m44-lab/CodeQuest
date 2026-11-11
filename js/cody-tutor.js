const MASCOT = `<span class="cody-character cody-character--chat" aria-hidden="true"><span class="cody-character__antenna"></span><span class="cody-character__head"><span class="cody-character__eye cody-character__eye--left"></span><span class="cody-character__eye cody-character__eye--right"></span><span class="cody-character__mouth"></span></span><span class="cody-character__body"><span class="cody-character__core">✦</span></span><span class="cody-character__arm cody-character__arm--left"></span><span class="cody-character__arm cody-character__arm--right"></span><span class="cody-character__leg cody-character__leg--left"></span><span class="cody-character__leg cody-character__leg--right"></span></span>`;

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function makeSteps(lesson) {
  const steps = [];
  const intro = text(lesson?.cody_intro || lesson?.intro);
  const objective = text(lesson?.objective);
  const explanation = text(lesson?.explanation || lesson?.description || lesson?.content);
  const example = text(lesson?.example || lesson?.code_example || lesson?.starter_code || lesson?.starter);
  const task = text(lesson?.task || lesson?.exercise || lesson?.practice);
  const hints = Array.isArray(lesson?.hints)
    ? lesson.hints.map(text).filter(Boolean)
    : [text(lesson?.hint)].filter(Boolean);

  if (intro) steps.push({ label: "بداية الدرس", message: intro, mood: "wave" });
  if (objective) steps.push({ label: "هدفنا النهارده", message: objective, mood: "think" });
  if (explanation) steps.push({ label: "خلينا نفهم", message: explanation, mood: "explain" });
  if (example) steps.push({ label: "نشوف مثال", message: "بص على المثال ده، وحاول تلاحظ إزاي الفكرة اتطبقت في الكود.", code: example, mood: "think" });
  if (task) steps.push({ label: "دورك تطبّق", message: task, mood: "ready" });
  hints.forEach((hint, index) => steps.push({
    label: `تلميح ${index + 1}`,
    message: hint,
    mood: "think"
  }));
  return steps;
}

export function mountCodyTutor(lesson, language = "اللغة الحالية") {
  if (!lesson || typeof document === "undefined") return;
  const host = document.querySelector("#lessonContent .content-grid") ||
    document.querySelector("#lessonContent .workspace") ||
    document.querySelector(".content-grid") ||
    document.querySelector(".workspace");
  if (!host) return;

  document.getElementById("codyInteractiveTutor")?.remove();
  const steps = makeSteps(lesson);
  if (!steps.length) return;

  const panel = document.createElement("section");
  panel.className = "cody-tutor";
  panel.id = "codyInteractiveTutor";
  panel.setAttribute("aria-label", "شرح كودي التفاعلي");
  panel.innerHTML = `
    <div class="cody-tutor-top">
      <div class="cody-tutor-mascot">${MASCOT}</div>
      <div class="cody-tutor-identity">
        <strong>كودي</strong>
        <span>مدرّسك في ${String(language).replace(/[&<>"]/g, "")}</span>
      </div>
      <span class="cody-tutor-live"><i></i> معاك خطوة بخطوة</span>
    </div>
    <div class="cody-tutor-progress" aria-hidden="true"><span></span></div>
    <div class="cody-tutor-meta"><strong class="cody-tutor-step-title"></strong><span class="cody-tutor-step-count"></span></div>
    <div class="cody-tutor-message" aria-live="polite"></div>
    <pre class="cody-tutor-code" hidden dir="ltr"></pre>
    <div class="cody-tutor-actions">
      <button class="cody-tutor-back" type="button" disabled>السابق</button>
      <button class="cody-tutor-next" type="button">متابعة ←</button>
    </div>`;

  host.parentNode.insertBefore(panel, host);
  const title = panel.querySelector(".cody-tutor-step-title");
  const count = panel.querySelector(".cody-tutor-step-count");
  const message = panel.querySelector(".cody-tutor-message");
  const code = panel.querySelector(".cody-tutor-code");
  const bar = panel.querySelector(".cody-tutor-progress span");
  const back = panel.querySelector(".cody-tutor-back");
  const next = panel.querySelector(".cody-tutor-next");
  let index = 0;

  function render() {
    const step = steps[index];
    title.textContent = step.label;
    count.textContent = `خطوة ${index + 1} من ${steps.length}`;
    message.textContent = step.message;
    code.hidden = !step.code;
    code.textContent = step.code || "";
    bar.style.width = `${((index + 1) / steps.length) * 100}%`;
    back.disabled = index === 0;
    next.textContent = index === steps.length - 1 ? "ابدأ التطبيق العملي ↓" : "متابعة ←";
    panel.dataset.mood = step.mood || "explain";
    next.setAttribute("aria-label", index === steps.length - 1 ? "الانتقال إلى التطبيق العملي" : "الانتقال إلى الخطوة التالية");
  }

  back.addEventListener("click", () => {
    if (index === 0) return;
    index -= 1;
    render();
  });

  next.addEventListener("click", () => {
    if (index < steps.length - 1) {
      index += 1;
      render();
      return;
    }
    const target = document.querySelector("#codeEditor, #pythonCodeInput, .editor-card, .editor-panel, .task-card");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    const editor = document.querySelector("#codeEditor, #pythonCodeInput");
    editor?.focus({ preventScroll: true });
    next.textContent = "راجع الشرح مرة أخرى";
    next.onclick = () => { index = 0; render(); };
  });

  render();
}
