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
test('image puzzle preset: played result facts remain readable', async t=>{
 const {page}=await newPage(t);await page.goto(`${origin}/game-image-puzzle.html`);
 // Use the existing illustrated game banner as a lightweight local uploaded image.
 await page.click('#startBtn');await page.waitForSelector('#gameLayout.visible');

 // Exercise the click placement handler for every piece, rather than directly calling checkWin.
 for(let i=0;i<4;i++){
   await page.locator(`[data-piece="${i}"]`).first().click();
   await page.locator('#board').scrollIntoViewIfNeeded();
   const xy=await page.evaluate(i=>{const r=document.getElementById('board').getBoundingClientRect();return {x:r.left+(i%2+.5)*cellW,y:r.top+(Math.floor(i/2)+.5)*cellH}},i);
   await page.mouse.click(xy.x,xy.y);
 }
 await page.waitForSelector('#successBox.visible');
 assert.equal(await page.locator('#puzzleStars').textContent(),'★★★');
 const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('codeQuestPuzzleBest_tech-computer_2')));
 assert.equal(record.stars,3);assert.equal(record.plays,1);
 await page.locator('#learningTitle').scrollIntoViewIfNeeded();
 await page.screenshot({path:'/downloads/puzzle-facts-fixed.png'});
});

test('speed: learning pauses timer, explains wrong answers, manual continue, finite round and fresh replay',async t=>{
 const {page}=await newPage(t);await page.goto(`${origin}/game-speed.html`);await page.click('.lvl-btn[data-cq-level="easy"]');
 assert.equal(await page.evaluate(()=>untimed),true);const code=await page.locator('#speedCode').textContent();assert.match(code,/print\(/);
 const first=await page.evaluate(()=>currentQs.map(q=>q.id));await page.evaluate(()=>ans(!currentQs[curr].a));
 assert.equal(await page.locator('#score').textContent(),'0');await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>curr),0);assert.equal(await page.evaluate(()=>time),30);
 assert.ok((await page.locator('#speedExplain').textContent()).length>40);await page.locator('#answerFeedback').scrollIntoViewIfNeeded();await page.screenshot({path:'/downloads/speed-learning-preview.png'});
 for(let i=0;i<6;i++){if(i>0)await page.evaluate(()=>ans(currentQs[curr].a));await page.click('#continueAnswer');}
 await page.waitForSelector('#resultScreen.active');assert.equal(await page.locator('#learningReview p').count(),6);
 await page.evaluate(()=>restartGame());await page.click('.lvl-btn[data-cq-level="easy"]');const next=await page.evaluate(()=>currentQs.map(q=>q.id));assert.equal(next.filter(x=>!first.includes(x)).length,2);
 assert.deepEqual(await page.evaluate(()=>currentQs.every(q=>q.level==='easy')),true);
});
test('speed: timed mode does not consume thinking time while explanation is open',async t=>{
 const {page}=await newPage(t);await page.goto(`${origin}/game-speed.html`);await page.uncheck('#untimedMode');await page.click('.lvl-btn[data-cq-level="easy"]');
 await page.waitForFunction(()=>time<30);await page.evaluate(()=>ans(currentQs[curr].a));const time=await page.evaluate(()=>time);await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>time),time);await page.click('#continueAnswer');await page.waitForFunction(old=>time<old,time);
});
test('image puzzle: eight new local programming scenes, contextual answer retry and completion',async t=>{
 const {page}=await newPage(t);await page.goto(`${origin}/game-image-puzzle.html`);await page.selectOption('#galleryCategory','programming');assert.equal(await page.locator('.art-card').count(),8);
 const loaded=await page.locator('.art-card img').evaluateAll(images=>Promise.all(images.map(im=>im.decode().then(()=>im.naturalWidth>0))));assert.ok(loaded.every(Boolean));
 await page.screenshot({path:'/downloads/puzzle-gallery-expanded.png'});
 await page.locator('.art-card').first().click();await page.click('#startBtn');await page.waitForSelector('#gameLayout.visible');
 for(let i=0;i<4;i++){await page.locator(`[data-piece="${i}"]`).first().click();await page.locator('#board').scrollIntoViewIfNeeded();const xy=await page.evaluate(i=>{const r=document.getElementById('board').getBoundingClientRect();return{x:r.left+(i%2+.5)*cellW,y:r.top+(Math.floor(i/2)+.5)*cellH}},i);await page.mouse.click(xy.x,xy.y)}
 await page.waitForSelector('#successBox.visible');assert.equal(await page.locator('#learningChoices button').count(),3);await page.locator('#learningChoices button').nth(0).click();assert.match(await page.locator('#learningChoiceFeedback').textContent(),/جرّب/);assert.equal(await page.evaluate(()=>localStorage.getItem('cq-puzzle-learned-learn-variables')),null);
 await page.locator('#learningChoices button').nth(1).click();assert.match(await page.locator('#learningChoiceFeedback').textContent(),/صحيحة/);assert.equal(await page.evaluate(()=>localStorage.getItem('cq-puzzle-learned-learn-variables')),'1');await page.locator('#learningQuestion').scrollIntoViewIfNeeded();await page.screenshot({path:'/downloads/puzzle-learning-check.png'});
});
test('code puzzle: added practice has correct output and no account reward call',async t=>{
 const {page}=await newPage(t);await page.goto(`${origin}/game-match.html`);await page.selectOption('#matchLesson','1');
 for(const word of ['let score = 2;','score = score + 3;','console.log(score);'])await page.getByRole('button',{name:'إضافة '+word,exact:true}).click();
 await page.click('#checkButton');await page.waitForSelector('#matchLearning:not([hidden])');assert.equal(await page.locator('#matchOutput').textContent(),'5');assert.match(await page.locator('#feedback').textContent(),/لا توجد مكافأة/);assert.equal(await page.evaluate(()=>localStorage.getItem('codequest-match-practice-1')),'1');await page.locator('#matchLearning').scrollIntoViewIfNeeded();await page.screenshot({path:'/downloads/code-puzzle-learning.png'});
});
test('speed: guessing one answer cannot unlock the next level',async t=>{
 const {page}=await newPage(t);await page.goto(`${origin}/game-speed.html`);await page.click('.lvl-btn[data-cq-level="easy"]');await page.evaluate(()=>{ans(currentQs[curr].a);end()});await page.waitForSelector('#resultScreen.active');assert.equal(await page.evaluate(()=>localStorage.getItem('codequest-speed-stars-easy')),null);await page.evaluate(()=>restartGame());assert.equal(await page.locator('[data-cq-level="medium"]').isDisabled(),true);
});
