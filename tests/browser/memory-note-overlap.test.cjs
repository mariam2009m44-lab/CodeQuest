// Memory game: the miss/match message never overlaps the board, at several phone widths.
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


for (const [w, h] of [[320, 640], [360, 740], [390, 844], [412, 915]]) for (const pairs of [6]) {
  test(`memory board: 3D canvas matches the visible viewport and the note clears the cards at ${w}px, ${pairs} pairs`, async t => {
    const d = await device(t, { viewport: { width: w, height: h } });
    const { page } = await d.open('accountA', 'game-memory.html');
    await page.click(`.lvl-btn[data-pairs="${pairs}"]`);
    await page.waitForSelector('#gameGrid .card');
    // Phone browsers: the visible height changes with the address bar; the canvas must follow innerHeight exactly (not 100vh).
    for (const hh of [h, h - 70]) {
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(300);
      const c = await page.evaluate(() => { const r = document.getElementById('board3d').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), iw: innerWidth, ih: innerHeight }; });
      assert.deepEqual([c.w, c.h], [c.iw, c.ih], 'canvas box equals the visible viewport');
    }
    await page.setViewportSize({ width: w, height: h });
    const info = await page.$$eval('#gameGrid .card', cs => cs.map((c, i) => ({ i, id: c.dataset.id })));
    const a = info[0], b = info.find(x => x.id !== a.id);
    const cards = page.locator('#gameGrid .card');
    await cards.nth(a.i).click(); await cards.nth(b.i).click();
    await page.waitForSelector('#matchNote.miss'); await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      const note = document.getElementById('matchNote').getBoundingClientRect();
      const cs = [...document.querySelectorAll('#gameGrid .card')].map(c => c.getBoundingClientRect());
      return { noteTop: note.top, cardsBottom: Math.max(...cs.map(r => r.bottom)), sizes: new Set(cs.map(r => Math.round(r.width) + 'x' + Math.round(r.height))).size };
    });
    assert.equal(m.sizes, 1);
    assert.ok(m.noteTop >= m.cardsBottom + 20, `note top ${m.noteTop} must clear cards bottom ${m.cardsBottom} by 20px`);
  });
}
