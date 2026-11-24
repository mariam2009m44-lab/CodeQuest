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
    if (url.href.includes('/codemirror.min.css')) return route.fulfill({contentType:'text/css',body:await readFile(require.resolve('codemirror/lib/codemirror.css'))});
    if (url.href.includes('/codemirror.min.js')) return route.fulfill({contentType:'text/javascript',body:await readFile(require.resolve('codemirror/lib/codemirror.js'))});
    if (url.origin === 'https://www.gstatic.com' && url.pathname.endsWith('firebase-firestore.js')) return route.fulfill({contentType:'text/javascript',body:`
      export const doc=(_, ...p)=>p.join('/'); export const collection=doc; export const serverTimestamp=()=>0;
      export const getDoc=async()=>({exists:()=>!!window.fixtureProject,data:()=>window.fixtureProject});
      export const addDoc=async(_,data)=>{if(window.failSave)throw new Error('test offline');window.lastSaved=data;return{id:'test-project'}};
      export const updateDoc=async(_,data)=>{if(window.failSave)throw new Error('test offline');window.lastSaved=data};`});
    if (url.origin !== origin) return route.abort();
    if (url.pathname === '/js/auth.js') return route.fulfill({contentType:'text/javascript',body:'export async function requireUser(){return {uid:sessionStorage.getItem("testUid")||"test-a"}}'});
    if (url.pathname === '/js/firebase-config.js') return route.fulfill({contentType:'text/javascript',body:'export const db={};'});
    if (['/js/route-guard.js', '/js/reminders.js', '/js/game-audio.js'].includes(url.pathname)) return route.fulfill({ contentType: 'application/javascript', body: '' });
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json' };
    try { await route.fulfill({ contentType: types[extname(url.pathname)] || 'application/octet-stream', body: process.env.LIVE_SOURCE && url.pathname==='/playground.html' ? await (await fetch('https://codequest-mu-six.vercel.app/playground.html')).text() : await readFile(resolve(root, url.pathname.slice(1))) }); }
    catch { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  return { page, errors };
}



test('playground runs actual JavaScript in worker, reports errors, saves and isolates account drafts', {timeout:30000},async t=>{
 const{page}=await newPage(t);await page.setViewportSize({width:1100,height:1000});await page.goto(`${origin}/playground.html`);await page.waitForFunction(()=>document.querySelector('.CodeMirror')?.CodeMirror);
 const code='console.log("line one"); console.log("line two")';
 await page.evaluate(code=>document.querySelector('.CodeMirror').CodeMirror.setValue(code),code);
 await page.click('#runBtn');await page.waitForFunction(()=>!document.getElementById('runBtn').disabled);
 assert.equal((await page.locator('#output').textContent()).trim(),'line one\nline two');
 await page.locator('#output').scrollIntoViewIfNeeded();
 await page.screenshot({path:'/downloads/editor-real-output.png'});
 await page.evaluate(()=>document.querySelector('.CodeMirror').CodeMirror.setValue('throw new Error("test-error")'));
 await page.click('#runBtn');await page.waitForFunction(()=>!document.getElementById('runBtn').disabled);assert.match(await page.locator('#output').textContent(),/test-error/);
 await page.evaluate(()=>document.querySelector('.CodeMirror').CodeMirror.setValue('console.log("saved draft")'));
 await page.click('#saveBtn');await page.waitForFunction(()=>window.lastSaved);assert.equal(await page.evaluate(()=>window.lastSaved.userId),'test-a');
 await page.evaluate(()=>{sessionStorage.setItem('testUid','test-b')});await page.reload();
 await page.waitForFunction(()=>sessionStorage.getItem('playgroundOwnerUid')==='test-b');
 assert.ok(!(await page.evaluate(()=>document.querySelector('.CodeMirror').CodeMirror.getValue())).includes('saved draft'));
});
test('studio real code runner prints output and blocks parent data access',async t=>{
 const{page}=await newPage(t);await page.goto(`${origin}/studio.html`);
 await page.fill('#codeInput','console.log("مرحباً يا كودي")');await page.click('#runCodeBtn');await page.waitForFunction(()=>document.getElementById('consoleOutput').textContent.includes('مرحباً يا كودي'));
 await page.fill('#codeInput','console.log(parent.localStorage.length)');await page.click('#runCodeBtn');await page.waitForFunction(()=>document.getElementById('consoleOutput').textContent.includes('Error'));
 assert.match(await page.locator('#consoleOutput').textContent(),/Error/);
});

test('playground: failed cloud save keeps account recovery draft across a new tab session',async t=>{
 const {page}=await newPage(t);await page.goto(`${origin}/playground.html`);await page.waitForFunction(()=>document.querySelector('.CodeMirror')?.CodeMirror);await page.evaluate(()=>{window.failSave=true;document.querySelector('.CodeMirror').CodeMirror.setValue('console.log("offline recovery")')});await page.click('#saveBtn');await page.waitForFunction(()=>document.getElementById('saveStatus').textContent.includes('تعذّر'));assert.equal(await page.locator('#saveStatus .status-dot').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(251, 113, 133)');await page.locator('#saveStatus').scrollIntoViewIfNeeded();await page.screenshot({path:'/downloads/editor-save-failure.png'});assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('codequest_playground_draft_test-a')).code),'console.log("offline recovery")');await page.evaluate(()=>{sessionStorage.clear();sessionStorage.setItem('testUid','test-a')});await page.reload();await page.waitForFunction(()=>document.querySelector('.CodeMirror')?.CodeMirror?.getValue().includes('offline recovery'));assert.match(await page.locator('#saveStatus').textContent(),/استرجاع|تعديلات|مزامنة/);
});
