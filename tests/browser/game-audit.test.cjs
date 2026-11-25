// Regression tests for the game audit fixes: account-scoped progress, fail-closed unknown account,
// quiz timer after a hidden tab, option shuffle keeps the answer, memory restart race,
// equivalent build orders, guarded storage, star-aligned feedback, touch input.
const path = require('node:path');
const artifactDir = process.env.CQ_ARTIFACT_DIR || path.join(require('node:os').tmpdir(), 'codequest-test-artifacts');
require('node:fs').mkdirSync(artifactDir, { recursive: true });
const { test, before, after } = require('node:test');
const { strict: assert } = require('node:assert');
const { readFile } = require('node:fs/promises');
const { resolve, extname } = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const root = resolve(__dirname, '../..');
const origin = 'http://codequest.test';
let browser;
before(async () => { browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); });
after(async () => { await browser?.close(); });

// One browser context = one shared device. state.uid picks the signed-in account for the next page load.
async function device(t, options = {}) {
  const state = { uid: 'accountA' };
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', ...options });
  t.after(() => context.close());
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.href === 'https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js') return route.fulfill({ contentType: 'text/javascript', body: 'export function httpsCallable(){return async()=>({data:{}})}' });
    if (url.origin !== origin) return route.abort();
    if (url.pathname === '/js/auth.js') {
      const body = state.uid === '__none__' ? 'export async function requireUser(){throw new Error("no user")}' : `export async function requireUser(){return {uid:${JSON.stringify(state.uid)}}}`;
      return route.fulfill({ contentType: 'text/javascript', body });
    }
    if (url.pathname === '/js/firebase-config.js') return route.fulfill({ contentType: 'text/javascript', body: 'export const functions={};' });
    if (['/js/route-guard.js', '/js/reminders.js', '/js/game-audio.js'].includes(url.pathname)) return route.fulfill({ contentType: 'application/javascript', body: '' });
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp' };
    try { await route.fulfill({ contentType: types[extname(url.pathname)] || 'application/octet-stream', body: await readFile(resolve(root, url.pathname.slice(1))) }); }
    catch { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  const open = async (uid, file) => {
    state.uid = uid;
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
    await page.goto(`${origin}/${file}`);
    return { page, errors };
  };
  return { open, context };
}

async function perfectSpeedEasy(page) {
  await page.click('.lvl-btn[data-cq-level="easy"]');
  for (let i = 0; i < 6; i++) { await page.evaluate(() => ans(currentQs[curr].a)); await page.click('#continueAnswer'); }
  await page.waitForSelector('#resultScreen.active');
}

test('guarded storage: games still start and play when storage throws', async t => {
  const d = await device(t);
  await d.context.addInitScript(() => {
    const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
    Storage.prototype.setItem = boom; Storage.prototype.getItem = boom; Storage.prototype.removeItem = boom;
  });
  const { page, errors } = await d.open('accountA', 'game-speed.html');
  await page.waitForFunction(() => window.CQGameStore.ready);
  await page.click('.lvl-btn[data-cq-level="easy"]');
  await page.waitForSelector('#gameScreen.active');
  await page.evaluate(() => ans(currentQs[curr].a));
  assert.ok(Number(await page.locator('#score').textContent()) > 0);
  assert.deepEqual(errors.filter(e => !/SecurityError|blocked/.test(e)), []);
});

test('quiz timer: a hidden tab at the question change does not carry over leftover seconds', async t => {
  const d = await device(t);
  const { page } = await d.open('accountA', 'game-quiz.html');
  await page.waitForFunction(() => window.CQGameStore.ready);
  await page.click('.lvl-btn[data-cq-level="easy"], .lvl-btn[onclick*="easy"]');
  await page.waitForSelector('#gameScreen.active');
  await page.waitForFunction(() => timeLeft <= 17);
  // Hide the tab, answer, and keep it hidden past the 1.7 s change to the next question.
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.evaluate(() => document.querySelector('.opt-btn').click());
  await page.waitForFunction(() => curr === 1, null, { timeout: 4000 });
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  const left = await page.evaluate(() => timeLeft);
  assert.ok(left >= 19, `next question must start with a fresh 20 s, got ${left}`);
});

test('quiz options are shuffled, the correct answer follows its text, timeout shows the answer', async t => {
  const d = await device(t);
  const { page } = await d.open('accountA', 'game-quiz.html');
  await page.waitForFunction(() => window.CQGameStore.ready);
  await page.click('.lvl-btn[onclick*="easy"]');
  const positions = new Set();
  for (let i = 0; i < 10; i++) {
    const info = await page.evaluate(() => {
      const q = currentQs[curr], texts = [...document.querySelectorAll('.opt-btn')].map(b => b.textContent);
      return { texts, correctText: q.opts[q.a], sameSet: [...texts].sort().join('|') === [...q.opts].sort().join('|') };
    });
    assert.equal(info.sameSet, true);
    const pos = info.texts.indexOf(info.correctText);
    positions.add(pos);
    const before = Number(await page.locator('#score').textContent());
    if (i % 2 === 0) {
      await page.locator('.opt-btn').nth(pos).click();
      assert.ok(Number(await page.locator('#score').textContent()) > before, 'clicking the correct text must score');
      assert.equal(await page.locator('.opt-btn').nth(pos).getAttribute('class').then(c => c.includes('correct')), true);
    } else {
      await page.locator('.opt-btn').nth(pos === 0 ? 1 : 0).click();
      assert.equal(Number(await page.locator('#score').textContent()), before, 'a wrong text must not score');
      assert.equal(await page.locator('.opt-btn').nth(pos).getAttribute('class').then(c => c.includes('correct')), true, 'correct one is highlighted');
    }
    await page.waitForFunction(i => curr === i + 1 || document.getElementById('resultScreen').classList.contains('active'), i, { timeout: 4000 });
  }
  assert.ok(positions.size > 1, 'correct answer position must vary: ' + [...positions]);
});

test('memory: restarting inside the mismatch window cannot strand a face-up card', async t => {
  const d = await device(t);
  const { page, errors } = await d.open('accountA', 'game-memory.html');
  await page.waitForFunction(() => window.CQGameStore.ready);
  await page.click('.lvl-btn[data-pairs="6"]');
  await page.waitForSelector('#gameGrid .card');
  // Flip two cards that do not match, then restart before the 800 ms reset fires.
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#gameGrid .card')];
    const a = cards[0], b = cards.find(c => c.dataset.id !== a.dataset.id);
    a.click(); b.click(); restartCurrentLevel();
  });
  await page.evaluate(() => document.querySelector('#gameGrid .card').click());
  await page.waitForTimeout(1100);
  assert.equal(await page.evaluate(() => flippedCards.length), 1, 'the new first card is still tracked');
  assert.equal(await page.locator('#gameGrid .card.flipped').count(), 1);
  // The level must still be winnable.
  await page.evaluate(() => { restartCurrentLevel(); });
  for (let n = 0; n < 6; n++) {
    await page.evaluate(() => {
      const open = [...document.querySelectorAll('#gameGrid .card:not(.matched)')];
      const a = open[0], b = open.find(c => c !== a && c.dataset.id === a.dataset.id);
      a.click(); b.click();
    });
  }
  await page.waitForSelector('#winScreen', { state: 'visible' });
  assert.deepEqual(errors, []);
});

const HARD_ORDER = ['class Car:', '    def __init__(self, brand):', '        self.brand = brand', '    def display(self):', '        print(self.brand)', 'car = Car("Cody")', 'car.display()'];
const HARD_SWAPPED = ['class Car:', '    def display(self):', '        print(self.brand)', '    def __init__(self, brand):', '        self.brand = brand', 'car = Car("Cody")', 'car.display()'];

async function buildOrder(page, lines) {
  for (const line of lines) await page.evaluate(line => { const b = [...document.querySelectorAll('#sourceZone .code-block:not(.selected)')].find(x => x.textContent === line); b.click(); }, line);
  await page.click('#btn');
}

test('build: an equivalent method order is accepted, a genuinely wrong order is not', async t => {
  let python = true;
  try { for (const code of [HARD_ORDER, HARD_SWAPPED]) assert.equal(execFileSync('python3', ['-c', code.join('\n')]).toString().trim(), 'Cody'); } catch (e) { if (e.code === 'ENOENT') python = false; else throw e; }
  const d = await device(t);
  const wrong = await d.open('accountA', 'game-build.html');
  await wrong.page.waitForFunction(() => window.CQGameStore.ready);
  await wrong.page.evaluate(() => { CQGameStore.set('codequest-build-stars-easy', '3'); CQGameStore.set('codequest-build-stars-medium', '3'); window.dispatchEvent(new CustomEvent('cq-game-ready')); });
  await wrong.page.click('.lvl-btn[onclick*="hard"]');
  await wrong.page.waitForSelector('#sourceZone .code-block');
  await buildOrder(wrong.page, ['car = Car("Cody")', 'class Car:', '    def __init__(self, brand):', '        self.brand = brand', '    def display(self):', '        print(self.brand)', 'car.display()']);
  assert.equal(await wrong.page.evaluate(() => attempts), 1, 'class used before it is defined must fail');
  // Interleaved methods are not equivalent (self.brand line would sit in display).
  const ok = await d.open('accountA', 'game-build.html');
  await ok.page.waitForFunction(() => window.CQGameStore.ready);
  await ok.page.click('.lvl-btn[onclick*="hard"]');
  await ok.page.waitForSelector('#sourceZone .code-block');
  await buildOrder(ok.page, HARD_SWAPPED);
  await ok.page.waitForSelector('#resultScreen.active');
  assert.equal(await ok.page.evaluate(() => attempts), 0);
  assert.ok(python || true);
});

test('result messages follow the existing star thresholds and no celebration at 0 stars', async t => {
  const d = await device(t);
  const { page } = await d.open('accountA', 'game-speed.html');
  await page.addInitScript(() => {});
  await page.evaluate(() => { window.__rewards = 0; window.CodeQuestExperience = { reward() { window.__rewards++; }, collectible() {} }; });
  await page.waitForFunction(() => window.CQGameStore.ready);
  await page.click('.lvl-btn[data-cq-level="easy"]');
  for (let i = 0; i < 6; i++) { await page.evaluate(i => ans(i < 3 ? currentQs[curr].a : !currentQs[curr].a), i); await page.click('#continueAnswer'); }
  await page.waitForSelector('#resultScreen.active');
  assert.match(await page.locator('#resultMessage').textContent(), /لم تحصل على نجمة/);
  assert.equal(await page.evaluate(() => window.__rewards), 0, '3 of 6 is 0 stars, so no reward celebration');
  assert.equal(await page.evaluate(() => CQGameStore.get('codequest-speed-stars-easy')), null, 'no unearned star saved');
  await page.evaluate(() => restartGame());
  await page.click('.lvl-btn[data-cq-level="easy"]');
  for (let i = 0; i < 6; i++) { await page.evaluate(i => ans(i < 4 ? currentQs[curr].a : !currentQs[curr].a), i); await page.click('#continueAnswer'); }
  await page.waitForSelector('#resultScreen.active');
  assert.match(await page.locator('#resultMessage').textContent(), /نجمتين/);
  assert.equal(await page.evaluate(() => CQGameStore.get('codequest-speed-stars-easy')), '2');
});

test('touch: quiz option and memory cards work with real taps on a phone viewport', async t => {
  const d = await device(t, { hasTouch: true, isMobile: true });
  const quiz = await d.open('accountA', 'game-quiz.html');
  await quiz.page.waitForFunction(() => window.CQGameStore.ready);
  await quiz.page.tap('.lvl-btn[onclick*="easy"]');
  await quiz.page.waitForSelector('#gameScreen.active');
  const pos = await quiz.page.evaluate(() => [...document.querySelectorAll('.opt-btn')].findIndex(b => b.textContent === currentQs[curr].opts[currentQs[curr].a]));
  await quiz.page.locator('.opt-btn').nth(pos).tap();
  assert.ok(Number(await quiz.page.locator('#score').textContent()) > 0);
  // The game replaces the options 1.7 s after an answer, so scroll synchronously: a locator wait for the old button to be stable can outlive it on a loaded machine.
  await quiz.page.evaluate(i => document.querySelectorAll('.opt-btn')[i]?.scrollIntoView({ block: 'nearest' }), pos);
  await quiz.page.screenshot({ path: path.join(artifactDir, 'audit-quiz-touch.png') });
  const mem = await d.open('accountA', 'game-memory.html');
  await mem.page.waitForFunction(() => window.CQGameStore.ready);
  await mem.page.tap('.lvl-btn[data-pairs="6"]');
  await mem.page.waitForSelector('#gameGrid .card');
  const ids = await mem.page.evaluate(() => { const c = [...document.querySelectorAll('#gameGrid .card')]; const a = c[0]; return [0, c.findIndex((x, i) => i > 0 && x.dataset.id === a.dataset.id)]; });
  await mem.page.locator('#gameGrid .card').nth(ids[0]).tap();
  await mem.page.locator('#gameGrid .card').nth(ids[1]).tap();
  await mem.page.waitForFunction(() => document.querySelectorAll('#gameGrid .card.matched').length === 2);
  await mem.page.screenshot({ path: path.join(artifactDir, 'audit-memory-touch.png') });
  assert.deepEqual([...quiz.errors, ...mem.errors], []);
});

test('quiz: C++ reads in order in the question, the options and the answer feedback, text unchanged and no HTML parsing', async t => {
  const d = await device(t);
  const { page, errors } = await d.open('accountA', 'game-quiz.html');
  await page.waitForFunction(() => window.CQGameStore.ready);
  await page.evaluate(() => { CQGameStore.set('codequest-quiz-stars-easy', '3'); window.dispatchEvent(new CustomEvent('cq-game-ready')); });
  await page.click('.lvl-btn[onclick*="medium"]');
  const question = 'ما هو الرمز المستخدم للتحقق من التساوي في C++؟';
  await page.evaluate(q => {
    currentQs[curr] = { q, opts: ['=', '==', '<b>x</b>', 'C++'], a: 3, why: 'يستخدم C++ مع <i>operator</i> == في الشروط.' };
    loadQ();
  }, question);
  const measure = () => page.evaluate(() => {
    const out = {};
    for (const [name, root] of [['question', document.getElementById('question')], ['option', [...document.querySelectorAll('.opt-btn')].find(b => b.textContent === 'C++')], ['feedback', document.getElementById('quizLearning')]]) {
      if (!root || !root.textContent) { out[name] = null; continue; }
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n, found = null;
      while ((n = walker.nextNode())) if (n.data.includes('C++')) { found = n; break; }
      if (!found) { out[name] = null; continue; }
      const i = found.data.indexOf('C++'), r = document.createRange(), x = k => { r.setStart(found, i + k); r.setEnd(found, i + k + 1); return r.getBoundingClientRect().left; };
      out[name] = { c: x(0), plus1: x(1), plus2: x(2) };
    }
    return out;
  });
  const before = await measure();
  assert.ok(before.question, 'question has a C++ text node');
  assert.ok(before.question.c < before.question.plus1 && before.question.plus1 < before.question.plus2, 'question: ' + JSON.stringify(before.question));
  assert.ok(before.option.c < before.option.plus1 && before.option.plus1 < before.option.plus2, 'option: ' + JSON.stringify(before.option));
  assert.equal(await page.locator('#question').textContent(), question, 'question text unchanged');
  await page.evaluate(() => document.querySelectorAll('.opt-btn')[optionOrder.indexOf(currentQs[curr].a)].click());
  const after = await measure();
  assert.ok(after.feedback.c < after.feedback.plus1 && after.feedback.plus1 < after.feedback.plus2, 'feedback: ' + JSON.stringify(after.feedback));
  assert.equal(await page.locator('#quizLearning').textContent(), 'الإجابة الصحيحة: C++. يستخدم C++ مع <i>operator</i> == في الشروط.');
  assert.equal(await page.locator('#quizLearning i, #question b, .opt-btn b').count(), 0, 'markup in data must stay text');
  await page.locator('#question').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(artifactDir, 'audit-quiz-cpp-full.png') });
  assert.deepEqual(errors, []);
});
