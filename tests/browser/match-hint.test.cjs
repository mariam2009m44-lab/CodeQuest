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


test('match: a wrong order says how many pieces are right and which one to recheck', async t => {
  const d = await device(t);
  const { page, errors } = await d.open('accountA', 'game-match.html');
  await page.waitForSelector('#piecesContainer .piece');
  // lesson 0 correct order: console.log ( "Hello World" ) ;  -> place it with the last two swapped
  const order = ['console.log', '(', '"Hello World"', ';', ')'];
  for (const v of order) await page.locator('#piecesContainer .piece', { hasText: v }).filter({ has: page.locator(':scope') }).first().click();
  await page.click('#checkButton');
  const msg = (await page.textContent('#feedback')).trim();
  assert.match(msg, /3 من 5 قطع في مكانها الصحيح/);
  assert.match(msg, /راجع القطعة رقم 4/);
  await page.screenshot({ path: path.join(artifactDir, 'match-hint-390.png') });
  assert.deepEqual(errors, []);
});
