const { test, before, after } = require('node:test');
const { strict: assert } = require('node:assert');
const { readFile } = require('node:fs/promises');
const { resolve, extname } = require('node:path');
const { chromium } = require('playwright');

const root = resolve(__dirname, '../..');
const origin = 'http://codequest.test';
const games = ['game-memory', 'game-quiz', 'game-bug', 'game-build', 'game-speed', 'game-match', 'game-image-puzzle'];
let browser;
before(async () => { browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); });
after(async () => { await browser?.close(); });

async function newPage(t) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  t.after(() => context.close());
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (['/js/route-guard.js', '/js/reminders.js', '/js/game-audio.js'].includes(url.pathname)) return route.fulfill({ contentType: 'application/javascript', body: '' });
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.json': 'application/json' };
    try { await route.fulfill({ contentType: types[extname(url.pathname)] || 'application/octet-stream', body: await readFile(resolve(root, url.pathname.slice(1))) }); }
    catch { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  return { page, errors };
}

for (const g of games) {
  test(`${g}: loads with the 3D backdrop, no JS errors, no horizontal overflow`, { timeout: 60000 }, async t => {
    const { page, errors } = await newPage(t);
    await page.goto(`${origin}/${g}.html`);
    await page.waitForFunction(() => window.__cq3d && window.__cq3d.ready, null, { timeout: 15000 });
    assert.equal(await page.locator('canvas#bg3d').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    assert.deepEqual(errors, []);
  });
}

test('memory game: stars are earned, saved, and unlock the next level', { timeout: 60000 }, async t => {
  const { page, errors } = await newPage(t);
  await page.goto(`${origin}/game-memory.html`);
  assert.equal(await page.locator('.lvl-btn[data-pairs="10"]').isDisabled(), true);
  assert.equal(await page.locator('.lvl-btn[data-pairs="15"]').isDisabled(), true);
  await page.click('.lvl-btn[data-pairs="6"]');
  // Solve with perfect play: flip each term then its definition by reading the hidden labels.
  const pairs = await page.evaluate(() => allPairs.slice(0, 6).map(p => [p.term, p.def]));
  for (const [a, b] of pairs) {
    for (const label of [a, b]) {
      const idx = await page.evaluate(l => [...document.querySelectorAll('.card')].findIndex(c => !c.classList.contains('matched') && !c.classList.contains('flipped') && c.querySelector('.card-back').textContent === l), label);
      await page.locator('.card').nth(idx).click();
    }
    await page.waitForTimeout(60);
  }
  await page.waitForSelector('#winScreen', { state: 'visible', timeout: 5000 });
  assert.match(await page.textContent('#resultTitle'), /★★★/);
  assert.equal(await page.evaluate(() => localStorage.getItem('codequest-memory-stars-6')), '3');
  await page.click('text=المستويات');
  assert.equal(await page.locator('.lvl-btn[data-pairs="10"]').isDisabled(), false);
  assert.equal(await page.locator('.lvl-btn[data-pairs="15"]').isDisabled(), true);
  await page.reload();
  assert.equal(await page.locator('.lvl-btn[data-pairs="10"]').isDisabled(), false, 'unlock persists');
  assert.deepEqual(errors, []);
});

for (const g of ['bug', 'build', 'quiz', 'speed']) {
  test(`game-${g}: level badges, locked levels, stars saved after a win`, { timeout: 90000 }, async t => {
    const { page, errors } = await newPage(t);
    await page.goto(`${origin}/game-${g}.html`);
    assert.equal(await page.locator('.lvl-btn[data-cq-level="easy"] img.cq-badge').count(), 1);
    assert.equal(await page.locator('.lvl-btn[data-cq-level="medium"]').isDisabled(), true);
    assert.equal(await page.locator('.lvl-btn[data-cq-level="hard"]').isDisabled(), true);
    await page.click('.lvl-btn[data-cq-level="easy"]');
    if (g === 'bug') {
      await page.evaluate(() => document.querySelectorAll('#codeContainer .line')[levels[currentLevel].bugIndex].click());
    } else if (g === 'build') {
      const seq = await page.evaluate(() => correctSeq);
      for (const code of seq) {
        const idx = await page.evaluate(c => [...document.querySelectorAll('#sourceBlocks .code-block, .code-block')].findIndex(b => b.textContent === c && !b.classList.contains('selected') && !b.closest('#dropZone')), code);
        void idx;
        await page.evaluate(c => { const b = [...document.querySelectorAll('.code-block')].find(x => x.textContent === c && !x.classList.contains('selected') && x.parentElement === source); b.click(); }, code);
      }
      await page.evaluate(() => check());
    } else {
      // Answer every question correctly, skipping the animation delays by calling the game's own handlers.
      const n = await page.evaluate(() => currentQs.length);
      for (let i = 0; i < n; i++) {
        if (g === 'quiz') {
          await page.evaluate(() => { const q = currentQs[curr]; document.querySelectorAll('.opt-btn')[q.a].click(); });
          await page.waitForFunction(k => curr > k || document.getElementById('resultScreen').classList.contains('active'), i, { timeout: 5000 });
        } else {
          await page.evaluate(() => ans(currentQs[curr].a));
          await page.waitForFunction(k => curr > k || gameEnded, i, { timeout: 3000 });
        }
      }
    }
    await page.waitForSelector('#resultScreen.active', { timeout: 8000 });
    await page.waitForSelector('.cq-result-stars');
    assert.equal(await page.evaluate(g2 => localStorage.getItem(`codequest-${g2}-stars-easy`), g), '3');
    await page.evaluate(() => restartGame());
    assert.equal(await page.locator('.lvl-btn[data-cq-level="medium"]').isDisabled(), false);
    assert.equal(await page.locator('.lvl-btn[data-cq-level="hard"]').isDisabled(), true);
    assert.deepEqual(errors, []);
  });
}
