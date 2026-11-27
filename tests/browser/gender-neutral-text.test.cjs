const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const skip = new Set(["node_modules", "tests", "admin-portal", ".git"]);
const exts = new Set([".html", ".js", ".mjs", ".json"]);
const verbs = "افتح|أكمل|اكمل|اسمح|تأكد|جرّب|جرب|اختر|ادخل|أدخل|شغّل|اضغط|ارجع|انتظر|حاول|تابع|اكتب|اطلب|سجّل|سجل|استخدم|ابدأ|شارك|أعد|راجع|انسخ|ارفع|اسأل|احفظ|ابحث|أضف|حدّث|حدث|أرسل|تحقق|اغلق|أغلق|عود|اذهب|خذ|ابق|انضم|اطلع|اقبل|ارفض|ضع|اترك|تذكر|اختار|اختر";
const strip = (s) => s.replace(/[\u064B-\u0652]/g, "");
const imperative = new RegExp(`(?<![\\u0600-\\u06FF])(?:${strip(verbs)})ي(?:ها|ه|هم)?(?![\\u0600-\\u06FF])`);
const presFem = /(?<![\u0600-\u06FF])(?:تحتاجين|تريدين|تملكين|تقدرين|تستطيعين|تعرفين|تكتبين|تختارين|تدخلين|تفتحين|تضغطين|تقرئين)/;
const pastFem = /[\u0600-\u06FF]+ت\u0650(?![\u0600-\u06FF\u064B-\u0652])|(?<![\u0600-\u06FF])أنتِ(?![\u0600-\u06FF])/;

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (exts.has(path.extname(e.name))) yield full;
  }
}

test("site text has no feminine-only Arabic imperatives or second-person forms", () => {
  const hits = [];
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, "utf8");
    text.split("\n").forEach((line, i) => {
      if (imperative.test(strip(line)) || pastFem.test(line) || presFem.test(strip(line))) hits.push(`${path.relative(root, file)}:${i + 1}`);
    });
  }
  assert.deepEqual(hits, []);
});

test("Google popup-closed error text is neutral and mobile falls back to redirect", () => {
  const src = fs.readFileSync(path.join(root, "js/auth.js"), "utf8");
  assert.ok(/isMobileBrowser\(\)/.test(src));
  assert.ok(/fallbackCodes\.add\("auth\/popup-closed-by-user"\)/.test(src));
  assert.ok(!/افتحيها|وأكملي/.test(src));
});

test("academy pages never show raw error codes and keep the owner bootstrap hidden", () => {
  const { execFileSync } = require("node:child_process");
  const out = execFileSync(process.execPath, ["--input-type=module", "-e", `
    import { acadMsg, ACADEMY_DOWN_TEXT } from "${path.join(root, "js/academy-errors.js").replace(/\\/g, "/")}";
    const r = [acadMsg({code:"internal",message:"internal"}), acadMsg({code:"functions/not-found",message:"not-found"}), acadMsg({code:"permission-denied",message:"ليس لديك صلاحية."}), acadMsg({message:"some english"})];
    console.log(JSON.stringify({r, down: ACADEMY_DOWN_TEXT}));
  `]).toString();
  const { r, down } = JSON.parse(out);
  assert.equal(r[0], down);
  assert.equal(r[1], down);
  assert.equal(r[2], "ليس لديك صلاحية.");
  assert.equal(r[3], "");
  const live = fs.readFileSync(path.join(root, "js/live-academy.js"), "utf8");
  assert.ok(/bootstrapButton\.hidden=true/.test(live));
  for (const f of ["js/live-academy.js", "js/academy-community.js", "js/academy-registration.js"]) {
    assert.ok(!/error\??\.message/.test(fs.readFileSync(path.join(root, f), "utf8")), f);
  }
});
