// Trainer application + admin review through the REAL Worker code (mock Firebase tokens, in-memory Durable Object), real pages, stubbed auth/Firebase SDK.
// Labelled: stubbed Firebase auth (not real claims).
const path = require('node:path');
const artifactDir = process.env.CQ_ARTIFACT_DIR || path.join(require('node:os').tmpdir(), 'codequest-test-artifacts');
require('node:fs').mkdirSync(artifactDir, { recursive: true });
const { test, before, after } = require('node:test');
const { strict: assert } = require('node:assert');
const { readFile } = require('node:fs/promises');
const { resolve, extname } = require('node:path');
const { chromium } = require('playwright');
const root = resolve(__dirname, '../..');
const origin = 'http://codequest.test';
const WORKER = 'https://codequest.mariam2009m44.workers.dev';
let browser, boot;
before(async () => { browser = await chromium.launch(); ({ boot } = await import('../../cloudflare-worker/tests/helpers-boot.mjs')); });
after(async () => { await browser?.close(); });

async function setup(t, { workerOn, token, verified = true }) {
  const w = boot({}); w.env.ALLOWED_ORIGINS = origin; if (workerOn) { w.env.ACADEMY_APPLICATIONS = 'on'; w.env.ACADEMY_ADMIN_UIDS = 'uidE'; }
  const fnCalls = [];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  t.after(() => context.close());
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin === WORKER) {
      const res = await w.sb.worker.fetch(new Request(req.url(), { method: req.method(), headers: req.headers(), body: req.method() === 'POST' ? req.postData() : undefined }), w.env);
      return route.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: await res.text() });
    }
    if (url.href === 'https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js') return route.fulfill({ contentType: 'text/javascript', body: 'export function httpsCallable(f,n){return async()=>{window.__fn=(window.__fn||[]).concat(n);throw new Error("callable unavailable")}}' });
    if (url.href === 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js') return route.fulfill({ contentType: 'text/javascript', body: `export function onAuthStateChanged(a,cb){cb({displayName:"Sara",emailVerified:${verified},getIdToken:async()=>${JSON.stringify(token)},getIdTokenResult:async()=>({claims:{}})})}export async function sendEmailVerification(){}` });
    if (url.origin !== origin) return route.abort();
    if (url.pathname === '/js/firebase-config.js') return route.fulfill({ contentType: 'text/javascript', body: 'export const auth={},functions={},authPersistenceReady=Promise.resolve();' });
    if (['/js/route-guard.js', '/js/reminders.js'].includes(url.pathname)) return route.fulfill({ contentType: 'application/javascript', body: '' });
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.png': 'image/png' };
    try { await route.fulfill({ contentType: types[extname(url.pathname)] || 'application/octet-stream', body: await readFile(resolve(root, url.pathname.slice(1))) }); } catch { await route.fulfill({ status: 404, body: 'nf' }); }
  });
  return { w, context, fnCalls };
}
async function page(context, file) { const p = await context.newPage(); const errors = []; p.on('pageerror', e => errors.push(String(e))); await p.goto(`${origin}/${file}`); return { p, errors }; }
async function fill(p) {
  await p.fill('#instructorForm [name=fullName]', 'سارة أحمد'); await p.check('#instructorForm [name=specialties][value=python]');
  await p.fill('#instructorForm [name=bio]', 'مدرسة برمجة للأطفال لديها خبرة سنتين في التدريس والمشاريع.');
}
test('worker ON: applicant submits through the Worker, reload shows pending and refills the form; admin approves; approved message does not promise classes', async t => {
  const a = await setup(t, { workerOn: true, token: 'tokV' });
  let { p, errors } = await page(a.context, 'academy-registration.html'); await p.waitForFunction(() => document.getElementById('accountState').textContent.includes('Sara'));
  await p.click('#instructorTab'); await fill(p); await p.click('#instructorForm button[type=submit]');
  await p.waitForFunction(() => /تم إرسال طلبك/.test(document.getElementById('instructorFeedback').textContent));
  assert.equal(await p.evaluate(() => (window.__fn || []).includes('submitInstructorApplication')), false, 'the Firebase callable was not used');
  assert.equal(Object.keys([...a.w.adirs.values()][0].m.get('dir').apps).join(), 'uidV');
  await p.reload(); await p.waitForFunction(() => document.getElementById('accountState').textContent.includes('Sara')); await p.click('#instructorTab');
  assert.match(await p.textContent('#instructorFeedback'), /قيد المراجعة/); assert.equal(await p.inputValue('#instructorForm [name=fullName]'), 'سارة أحمد');
  assert.deepEqual(errors, []);
  // admin on the same Worker store, admin token
  const b = await browser.newContext({ viewport: { width: 390, height: 1000 }, serviceWorkers: 'block' }); t.after(() => b.close());
  const dirs = a.w; const adminSetup = await setup(t, { workerOn: true, token: 'tokE' }); adminSetup.w.stores.set('svc:academy', a.w.stores.get('svc:academy'));
  const admin = await page(adminSetup.context, 'academy-admin.html'); await admin.p.waitForSelector('#pendingInstructors .admin-application');
  assert.match(await admin.p.textContent('#adminStats'), /طلبات قيد المراجعة/);
  assert.match(await admin.p.textContent('#adminStudents'), /لم يُنفَّذ بعد/); assert.match(await admin.p.textContent('#adminClasses'), /لم يُنفَّذ بعد/); assert.match(await admin.p.textContent('.academy-intro p'), /مراجعة طلبات المدربين فقط/); assert.doesNotMatch(await admin.p.textContent('.academy-intro p'), /في مكان واحد/); assert.match(await admin.p.textContent('#adminState'), /باقي الأقسام لم تُنفَّذ بعد/);
  await admin.p.screenshot({ path: path.join(artifactDir, 'academy-admin-worker.png'), fullPage: true });
  await admin.p.locator('#pendingInstructors .admin-action').first().click();
  await admin.p.waitForFunction(() => document.querySelector('#pendingInstructors').textContent.includes('لا توجد طلبات'));
  assert.equal(adminSetup.w.adirs.values().next().value.m.get('dir').apps.uidV.status, 'approved'); assert.deepEqual(admin.errors, []);
  await p.reload(); await p.waitForFunction(() => document.getElementById('accountState').textContent.includes('Sara')); await p.click('#instructorTab');
  assert.match(await p.textContent('#instructorFeedback'), /سنُعلمك/); assert.doesNotMatch(await p.textContent('#instructorFeedback'), /إنشاء الفصول مباشرة/);
});
test('worker ON: a non-admin sees the admin refusal and no applications', async t => {
  const a = await setup(t, { workerOn: true, token: 'tokA' });
  const { p } = await page(a.context, 'academy-admin.html'); await p.waitForFunction(() => document.getElementById('adminState').textContent.includes('مخصص لمسؤول'));
  assert.equal(await p.locator('#adminContent').isVisible(), false);
});
test('worker OFF: the page falls back to the Firebase callable (and reports its failure honestly)', async t => {
  const a = await setup(t, { workerOn: false, token: 'tokV' });
  const { p } = await page(a.context, 'academy-registration.html'); await p.waitForFunction(() => document.getElementById('accountState').textContent.includes('تعذر تحميل'));
  await p.click('#instructorTab'); await fill(p); await p.click('#instructorForm button[type=submit]');
  await p.waitForFunction(() => /callable unavailable/.test(document.getElementById('instructorFeedback').textContent));
  assert.equal(await p.evaluate(() => window.__fn.includes('submitInstructorApplication')), true); assert.equal(a.w.adirs.size, 0);
});

test('worker unreachable during submit: no fallback to the callable (no duplicate store), honest message', async t => {
  const a = await setup(t, { workerOn: true, token: 'tokV' });
  const { p } = await page(a.context, 'academy-registration.html'); await p.waitForFunction(() => document.getElementById('accountState').textContent.includes('Sara'));
  await a.context.route(WORKER + '/api/academy/instructor-application', r => r.abort());
  await p.click('#instructorTab'); await fill(p); await p.click('#instructorForm button[type=submit]');
  await p.waitForFunction(() => /لم نتأكد/.test(document.getElementById('instructorFeedback').textContent));
  assert.equal(await p.evaluate(() => (window.__fn || []).includes('submitInstructorApplication')), false);
});
