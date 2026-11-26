const { test, before, after } = require('node:test');
const { strict: assert } = require('node:assert');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const { chromium } = require('playwright');

const root = resolve(__dirname, '../..');
const origin = 'http://codequest.test';
const base = `${origin}/CodeQuest/`;
let browser;

// The deployed HTML and app.js run in Chromium with stubbed authentication
// and Firestore. Unrelated scripts and all other external requests are blocked.
const authFixture = `
export async function requireUser() { return getCurrentUser(); }
export function getCurrentUser() { return { uid: window.fixture.uid }; }
export function ensureUserProfile() {
  return window.fixture.failProfile
    ? Promise.reject(new Error('test: offline profile'))
    : new Promise(() => {});
}
export async function logoutUser() {}
`;
const firestoreFixture = `
export const doc = (_, ...path) => path.join('/');
export const collection = doc;
export const query = path => path;
export const where = () => {};
export function onSnapshot(path, ...args) {
  // profile.html has a separate listener for achievement badges. The
  // app.js statistics listener is the one that requests metadata updates.
  if (!path.endsWith('/lessonProgress') || !args[0]?.includeMetadataChanges) return () => {};
  window.fixture.send = (records, metadata = {}) => args.at(-2)({
    docs: records.map(record => ({ data: () => record })), metadata
  });
  window.fixture.fail = () => args.at(-1)(new Error('test: unavailable progress'));
  return () => {};
}
`;

before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function openFixture(t, pageName, viewport, { uid = 'learner-a', failProfile = false, seed = {} } = {}) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
  t.after(() => context.close());
  await context.addInitScript(({ uid, failProfile, seed }) => {
    window.fixture = { uid, failProfile };
    for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
    localStorage.setItem('codequest_learner-a_cody_python_completed_lessons', '["1_0", "1_0", "1_104"]');
    localStorage.setItem('codequest_learner-b_cody_python_completed_lessons', '["2_0", "2_1"]');
  }, { uid, failProfile, seed });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname.slice('/CodeQuest/'.length);
    const js = body => route.fulfill({ contentType: 'application/javascript', body });
    if (url.origin === 'https://www.gstatic.com' && url.pathname === '/firebasejs/10.8.1/firebase-firestore.js') {
      return js(firestoreFixture);
    }
    if (url.origin !== origin || !url.pathname.startsWith('/CodeQuest/')) return route.abort();
    if (path === 'js/auth.js') return js(authFixture);
    if (path === 'js/firebase-config.js') return js('export const db = {};');
    const ext = extname(path);
    if (ext === '.js' && !['js/app.js', 'js/avatars.js', 'js/theme.js'].includes(path)) return route.abort();
    const contentType = ({ '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css' })[ext];
    const file = resolve(root, path);
    if (!contentType || !file.startsWith(root + sep)) return route.abort();
    const body = await readFile(file).catch(() => null);
    return body ? route.fulfill({ contentType, body }) : route.fulfill({ status: 404 });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  await page.goto(`${base}${pageName}`, { waitUntil: 'domcontentloaded' });
  return page;
}

async function expectText(page, selector, text) {
  await page.waitForFunction(({ selector, text }) => document.querySelector(selector)?.textContent.trim() === text,
    { selector, text }, { timeout: 4500 });
}

const count = '.js-completed-lessons';
const status = '.js-lesson-progress-status';
const python = (chapter, lesson) => ({ language: 'python', chapter, lesson, completed: true });

for (const [name, width] of [['dashboard.html', 360], ['profile.html', 390]]) {
  test(`${name}: local progress survives a profile failure and reload at ${width}px`, { timeout: 25000 }, async t => {
    const page = await openFixture(t, name, { width, height: 800 }, { failProfile: true });
    await expectText(page, count, '1');
    await page.evaluate(() => window.fixture.fail());
    await page.waitForFunction(selector => document.querySelector(selector)?.textContent.includes('تعذر تحميل تقدم الحساب'), status);
    await expectText(page, count, '1');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectText(page, count, '1');
  });
}

test('desktop dashboard: pending profile does not block progress; cached and remote records count once and exams do not count', { timeout: 25000 }, async t => {
  const page = await openFixture(t, 'dashboard.html', { width: 1366, height: 900 });
  await expectText(page, count, '1');
  await page.evaluate(records => window.fixture.send(records, { fromCache: true }), [python(0, 0), python(0, 104)]);
  await expectText(page, status, 'عرض آخر بيانات متاحة على الجهاز؛ المزامنة غير مؤكدة.');
  await expectText(page, count, '1');
  await page.evaluate(records => window.fixture.send(records, { fromCache: false, hasPendingWrites: true }), [python(0, 0)]);
  await expectText(page, status, 'عرض آخر بيانات متاحة على الجهاز؛ المزامنة غير مؤكدة.');
  await page.evaluate(records => window.fixture.send(records, { fromCache: false }), [python(0, 0), python(0, 1), python(0, 104), python(12, 105)]);
  await expectText(page, status, '');
  await expectText(page, count, '2');
  assert.equal(new URL(page.url()).pathname, '/CodeQuest/dashboard.html');
});

test('local progress only reads the active learner and ignores a former learner’s delayed event', { timeout: 25000 }, async t => {
  const page = await openFixture(t, 'dashboard.html', { width: 390, height: 800 }, { uid: 'learner-b' });
  await expectText(page, count, '2');
  await page.evaluate(records => {
    window.fixture.uid = 'learner-a';
    window.fixture.send(records, { fromCache: false });
  }, [python(0, 0), python(0, 1), python(0, 2)]);
  await expectText(page, count, '2');
});

test('dashboard counts lessons finished in the studio (map records, all four tracks) for this account only', { timeout: 25000 }, async t => {
  const rec = (c, l) => ({ chapter: c, lesson: l, completed: true, source: 'studio-device-only' });
  const seed = {
    'codequest_lesson_progress_learner-c_python': JSON.stringify([rec(0, 0), rec(0, 1)]),
    'codequest_lesson_progress_learner-c_java': JSON.stringify([rec(0, 0)]),
    'codequest_lesson_progress_anon_python': JSON.stringify([rec(1, 0), rec(1, 1), rec(1, 2)]),
    'codequest_lesson_progress_learner-d_python': JSON.stringify([rec(2, 0)])
  };
  const page = await openFixture(t, 'dashboard.html', { width: 390, height: 800 }, { uid: 'learner-c', seed });
  await expectText(page, count, '3');
  await page.waitForFunction(() => { const e = document.querySelector('.js-python-progress-label'); return e && e.textContent.trim() !== '0%'; });
});
