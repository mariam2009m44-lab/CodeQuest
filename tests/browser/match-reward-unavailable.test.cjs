// game-match, first lesson: when the reward service is not deployed (functions/not-found) the learner gets an honest
// "solved, saved on this device, account reward unavailable" state and no retry loop. Stubbed Firebase (mock), not production.
const path = require('node:path');
const artifactDir = process.env.CQ_ARTIFACT_DIR || path.join(require('node:os').tmpdir(), 'codequest-test-artifacts');
require('node:fs').mkdirSync(artifactDir, { recursive: true });
const { test } = require('node:test'), assert = require('node:assert/strict'), { chromium } = require('playwright'), fs = require('fs/promises');
const root = path.resolve(__dirname, '../..'), origin = 'http://codequest.test';
async function run(code, fn) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await ctx.route('**/*', async route => {
      const u = new URL(route.request().url());
      if (u.href === 'https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js') return route.fulfill({ contentType: 'text/javascript', body: `export function httpsCallable(){return async()=>{const e=new Error("x");e.code=${JSON.stringify(code)};throw e}}` });
      if (u.origin !== origin) return route.abort();
      if (u.pathname === '/js/auth.js') return route.fulfill({ contentType: 'text/javascript', body: 'export async function requireUser(){return {uid:"u1"}}' });
      if (u.pathname === '/js/firebase-config.js') return route.fulfill({ contentType: 'text/javascript', body: 'export const functions={};' });
      if (['/js/route-guard.js', '/js/reminders.js', '/js/game-audio.js', '/js/game-3d.js'].includes(u.pathname)) return route.fulfill({ contentType: 'application/javascript', body: '' });
      const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.png': 'image/png' };
      try { await route.fulfill({ contentType: types[path.extname(u.pathname)] || 'application/octet-stream', body: await fs.readFile(path.join(root, u.pathname.slice(1))) }); } catch { await route.fulfill({ status: 404, body: 'nf' }); }
    });
    const p = await ctx.newPage(); await p.goto(origin + '/game-match.html'); await p.waitForSelector('#piecesContainer .piece, .piece');
    await fn(p);
  } finally { await browser.close(); }
}
async function solve(p) { for (const v of ['console.log', '(', '"Hello World"', ')', ';']) await p.locator('.piece:not(.placed)', { hasText: new RegExp('^' + v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first().click(); await p.click('#checkButton, button:has-text("تحقق من الحل")'); }
test('functions/not-found: solved state is honest and there is no reward retry loop', () => run('functions/not-found', async p => {
  await solve(p);
  await p.waitForFunction(() => /مكافأة الحساب غير متاحة/.test(document.getElementById('feedback').textContent));
  const btn = p.locator('button', { hasText: 'اكتمل التدريب' }); assert.equal(await btn.count() > 0, true); assert.equal(await btn.first().isDisabled(), true);
  assert.doesNotMatch(await p.evaluate(() => document.body.innerText), /إعادة محاولة تسجيل المكافأة/);
  await p.screenshot({ path: path.join(artifactDir, 'match-reward-unavailable-390.png'), fullPage: true });
  await p.locator('#matchLearning').scrollIntoViewIfNeeded(); await p.evaluate(() => document.getElementById('matchLearning').scrollIntoView({ block: 'start' }));
  await p.screenshot({ path: path.join(artifactDir, 'match-vp-explanation-390.png') });
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(artifactDir, 'match-vp-bottom-390.png') });
  const nav = await p.evaluate(() => { const n = [...document.querySelectorAll('nav,[class*=bottom-nav],[class*=mobile-nav]')].find(e => getComputedStyle(e).position === 'fixed'); const r = n && n.getBoundingClientRect(); const last = document.getElementById('rewardPanel') || document.querySelector('.reward-panel'); const l = last && last.getBoundingClientRect(); return { navTop: r && r.top, panelBottom: l && l.bottom }; });
  assert.ok(nav.navTop === null || nav.panelBottom === null || nav.panelBottom <= nav.navTop, 'result panel is not under the fixed nav at the bottom: ' + JSON.stringify(nav));
}));
test('a transient error keeps the retry button (reward may still be available)', () => run('functions/internal', async p => {
  await solve(p);
  await p.waitForFunction(() => /تعذر تسجيل المكافأة/.test(document.getElementById('feedback').textContent));
  assert.equal(await p.locator('button', { hasText: 'إعادة محاولة تسجيل المكافأة' }).count() > 0, true);
}));
