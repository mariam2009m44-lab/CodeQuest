// Placement quiz: runs in the browser only. Nothing is sent or stored. The result is a suggestion.
const QS = [
  { q: "ما الذي يفعله البرنامج؟", a: ["مجموعة تعليمات ينفذها الحاسوب بالترتيب", "لعبة جاهزة فقط", "جهاز داخل الحاسوب"], c: 0 },
  { q: "ما ناتج هذا الكود؟", code: "x = 3\ny = 4\nprint(x + y)", a: ["34", "7", "x + y"], c: 1 },
  { q: "أي كلمة تستخدم لاتخاذ قرار في الكود؟", a: ["if", "print", "import"], c: 0 },
  { q: "كم مرة تُطبع كلمة hi؟", code: "for i in range(3):\n    print(\"hi\")", a: ["مرة واحدة", "ثلاث مرات", "أربع مرات"], c: 1 },
  { q: "ما ناتج هذا الكود؟", code: "n = 5\nif n > 3:\n    print(\"big\")\nelse:\n    print(\"small\")", a: ["big", "small", "لا شيء"], c: 0 },
  { q: "ما ناتج هذا الكود؟", code: "def f(a):\n    return a * 2\nprint(f(f(2)))", a: ["4", "8", "2"], c: 1 },
];
const form = document.getElementById("plForm");
QS.forEach((x, i) => {
  const fs = document.createElement("fieldset"); fs.className = "pl-q";
  const lg = document.createElement("legend"); lg.textContent = (i + 1) + ". " + x.q; fs.append(lg);
  if (x.code) { const pre = document.createElement("pre"); pre.textContent = x.code; fs.append(pre); }
  x.a.forEach((t, j) => { const lb = document.createElement("label"), r = document.createElement("input"); r.type = "radio"; r.name = "q" + i; r.value = String(j); lb.append(r, document.createTextNode(t)); fs.append(lb); });
  form.append(fs);
});
const btn = document.createElement("button"); btn.type = "submit"; btn.className = "pl-btn"; btn.textContent = "اعرض النتيجة"; form.append(btn);
function levelFor(score) { return score <= 2 ? "beginner" : score <= 4 ? "basic" : "intermediate"; }
const TEXT = {
  beginner: ["نقطة البداية: مبتدئ", "ابدأ بالوحدة الأولى من أي مسار. Python خيار مناسب للبداية."],
  basic: ["نقطة البداية: أساسي", "راجع الوحدات الأولى سريعًا، ثم انتقل إلى الحلقات والدوال."],
  intermediate: ["نقطة البداية: متوسط", "يمكنك البدء من الدوال والمشاريع، واختيار المسار الذي يهمك."],
};
form.addEventListener("submit", ev => {
  ev.preventDefault(); let s = 0, blank = false;
  QS.forEach((x, i) => { const v = form.querySelector('input[name="q' + i + '"]:checked'); if (!v) blank = true; else if (Number(v.value) === x.c) s++; });
  const out = document.getElementById("plResult"); out.replaceChildren();
  if (blank) { out.hidden = false; const p = document.createElement("p"); p.textContent = "أجب عن كل الأسئلة أولًا."; out.append(p); return; }
  const [h, t] = TEXT[levelFor(s)], h2 = document.createElement("h2"), p = document.createElement("p"), a = document.createElement("a");
  h2.textContent = h; p.textContent = t + " (" + s + " من " + QS.length + ")"; a.href = "academy-registration.html"; a.textContent = "سجّل في الأكاديمية";
  out.append(h2, p, a); out.hidden = false; out.scrollIntoView({ block: "nearest" });
});
