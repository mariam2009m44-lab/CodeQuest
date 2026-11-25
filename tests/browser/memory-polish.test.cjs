// Memory game polish: term/definition styling, match explanation, miss note.
// (harness copied from game-audit)
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


test('memory: term and definition are marked, a match names the pair, a miss says so', async t => {
  const d = await device(t);
  const { page, errors } = await d.open('accountA', 'game-memory.html');
  await page.click('.lvl-btn[data-pairs="6"]');
  await page.waitForSelector('#gameGrid .card');
  const info = await page.$$eval('#gameGrid .card', cs => cs.map((c, i) => ({ i, id: c.dataset.id, kind: c.querySelector('.card-back').dataset.kind, text: c.querySelector('.card-back').textContent })));
  assert.equal(info.length, 12);
  assert.equal(info.filter(x => x.kind === 'term').length, 6);
  assert.equal(info.filter(x => x.kind === 'definition').length, 6);
  const labels = await page.$$eval('#gameGrid .card-back', bs => new Set(bs.map(b => getComputedStyle(b, '::before').content)).size);
  assert.equal(labels, 2);
  const cards = page.locator('#gameGrid .card');
  // a miss: two cards of different pairs
  const a = info[0], b = info.find(x => x.id !== a.id);
  await cards.nth(a.i).click(); await cards.nth(b.i).click();
  assert.match(await page.textContent('#matchNote'), /مش نفس الزوج/);
  await page.waitForFunction(() => !document.querySelector('#gameGrid .card.flipped'));
  // a match
  const term = info.find(x => x.kind === 'term'), def = info.find(x => x.id === term.id && x.kind === 'definition');
  await cards.nth(term.i).click(); await cards.nth(def.i).click();
  assert.equal((await page.textContent('#matchNote')).trim(), `✔ ${term.text} = ${def.text}`);
  // one more pair so the screenshot shows matched + note
  const t2 = info.find(x => x.kind === 'term' && x.id !== term.id), d2 = info.find(x => x.id === t2.id && x.kind === 'definition');
  await cards.nth(t2.i).click(); await cards.nth(d2.i).click();
  await cards.nth(info.find(x => x.id !== term.id && x.id !== t2.id).i).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(artifactDir, 'memory-polish-390.png') });
  assert.deepEqual(errors, []);
});
