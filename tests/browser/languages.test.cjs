const { test, before, after } = require('node:test');
const { strict: assert } = require('node:assert');
const { readFile } = require('node:fs/promises');
const { resolve, extname, sep } = require('node:path');
const { chromium } = require('playwright');

const root = resolve(__dirname, '../..');
const origin = 'http://codequest.test';
const curricula = {
  python: 'json/python_curriculum.json',
  javascript: 'json/js_curriculum.json',
  cpp: 'json/cpp_curriculum.json',
  java: 'json/java_curriculum.json'
};
let browser;

// Authentication is stubbed so course-path.html renders its real map from
// the real curriculum JSON. All other external requests are blocked.
const authFixture = `
export async function requireUser() { return { uid: 'learner-a' }; }
export async function getLessonProgress() { return []; }
export async function getUserProfile() { return { xp: 0, stars: 0 }; }
`;

before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

test('languages page: each card opens the new lessons and the previous path link opens course-path.html and renders one road node per lesson of its curriculum', { timeout: 60000 }, async t => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  t.after(() => context.close());
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    const path = url.pathname.slice(1);
    const js = body => route.fulfill({ contentType: 'application/javascript', body });
    if (path === 'js/auth.js') return js(authFixture);
    if (path === 'js/route-guard.js') return js('');
    if (path === 'js/game-audio.js') return js('');
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.js': 'application/javascript' };
    const file = resolve(root, path);
    const contentType = types[extname(file)];
    if (!contentType || !file.startsWith(root + sep)) return route.abort();
    const body = await readFile(file).catch(() => null);
    return body ? route.fulfill({ contentType, body }) : route.fulfill({ status: 404 });
  });
  const page = await context.newPage();
  await page.goto(`${origin}/languages.html`);
  const hrefs = await page.$$eval('.lang-card', cards => cards.map(card => card.getAttribute('href')));
  const langs = hrefs.map(href => new URL(href, origin).searchParams.get('lang'));
  assert.deepEqual([...langs].sort(), Object.keys(curricula).sort());
  if (process.env.SCREENSHOT) {
    await page.waitForTimeout(2500);
    await page.screenshot({ path: process.env.SCREENSHOT, fullPage: true });
  }

  for (const lang of langs) {
    await page.goto(`${origin}/languages.html`);
    assert.equal(await page.getAttribute(`.lang-card[href$="lang=${lang}"]`,'href'),`learning.html?lang=${lang}`,`${lang}: main card opens the new lessons`);await page.click(`.old-path a[href$="lang=${lang}"]`);
    await page.waitForURL(`**/course-path.html?lang=${lang}`);
    const data = JSON.parse(await readFile(resolve(root, curricula[lang]), 'utf8'));
    await page.waitForSelector('.cw-road-node', { timeout: 15000 });
    // Python is loaded from js/chapters/ch*.js (lessons plus a chapter exam);
    // the other languages come straight from their curriculum JSON.
    const lessons = lang === 'python'
      ? await page.evaluate(() => Object.values(window.CHAPTERS).reduce((sum, chapter) => sum + chapter.lessons.length, 0))
      : data.chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0);
    if (lang === 'python') assert.equal(Object.keys(await page.evaluate(() => window.CHAPTERS)).length, data.chapters.length, 'python: 12 chapters loaded');
    assert.equal(await page.locator('.cw-road-node').count(), lessons, `${lang}: one road node per lesson`);
    assert.match(await page.textContent('#cwLessonCount'), new RegExp(`${lessons}`), `${lang}: lesson count shown`);
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/path-${lang}.png` });
  }
});
