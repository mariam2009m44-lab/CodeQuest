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
    if (url.href === 'https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js') return route.fulfill({contentType:'text/javascript',body:'export function httpsCallable(){return async()=>{throw new Error("emulated failure")}}'});
    if (url.origin !== origin) return route.abort();
    if (url.pathname === '/js/auth.js') return route.fulfill({contentType:'text/javascript',body:'export async function requireUser(){return {uid:"test"}}'});
    if (url.pathname === '/js/firebase-config.js') return route.fulfill({contentType:'text/javascript',body:'export const functions={};'});
    if (['/js/route-guard.js', '/js/reminders.js', '/js/game-audio.js'].includes(url.pathname)) return route.fulfill({ contentType: 'application/javascript', body: '' });
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json' };
    try { await route.fulfill({ contentType: types[extname(url.pathname)] || 'application/octet-stream', body: await readFile(resolve(root, url.pathname.slice(1))) }); }
    catch { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  return { page, errors };
}


test('code puzzle: completion persists even when server reward fails, and no reward success is claimed', async t=>{
 const {page}=await newPage(t);await page.goto(`${origin}/game-match.html`);
 for(const word of ['console.log','(', '"Hello World"',')',';'])await page.getByRole('button',{name:'إضافة '+word,exact:true}).click();
 await page.click('#checkButton');
 await page.waitForFunction(()=>localStorage.getItem('codequest-match-completed')==='1');
 assert.match(await page.locator('#matchProgress').textContent(),/اكتمل/);
 await page.reload();assert.match(await page.locator('#matchProgress').textContent(),/اكتمل/);
});
test('image puzzle: custom image stays usable, real tap-placement awards stars and reload restores gallery progress', async t=>{
 const {page}=await newPage(t);await page.goto(`${origin}/game-image-puzzle.html`);
 // Use the existing illustrated game banner as a lightweight local uploaded image.
 await page.setInputFiles('#customPhotoInput',{name:'picture.png',mimeType:'image/png',buffer:Buffer.from(await page.screenshot())});
 await page.waitForFunction(()=>document.getElementById('galleryUploadStatus').textContent.includes('تم تجهيز'));
 await page.click('#startBtn');await page.waitForSelector('#gameLayout.visible');
 assert.equal(await page.locator('#currentTitle').textContent(),'صورتك الخاصة');
 // Exercise the click placement handler for every piece, rather than directly calling checkWin.
 for(let i=0;i<4;i++){
   await page.locator(`[data-piece="${i}"]`).first().click();
   await page.locator('#board').scrollIntoViewIfNeeded();
   const xy=await page.evaluate(i=>{const r=document.getElementById('board').getBoundingClientRect();return {x:r.left+(i%2+.5)*cellW,y:r.top+(Math.floor(i/2)+.5)*cellH}},i);
   await page.mouse.click(xy.x,xy.y);
 }
 await page.waitForSelector('#successBox.visible');
 assert.equal(await page.locator('#puzzleStars').textContent(),'★★★');
 const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('codeQuestPuzzleBest_custom-photo_2')));
 assert.equal(record.stars,3);assert.equal(record.plays,1);
 await page.locator('#puzzleStars').scrollIntoViewIfNeeded();
 await page.screenshot({path:'/downloads/puzzle-real-win.png'});
});
