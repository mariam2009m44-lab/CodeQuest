// Parent-link UI against a STUBBED Worker (mock responses, not real account data) and stubbed Firebase auth.
const { test } = require('node:test'), assert = require('node:assert/strict'), { chromium } = require('playwright'), fs = require('fs/promises'), path = require('path');
const root = path.resolve(__dirname, '../..');
async function open(file, handler) {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.setDefaultTimeout(5000); const reqs = [];
  await p.route('**/*', async r => { const u = new URL(r.request().url()), js = body => r.fulfill({ contentType: 'text/javascript', body });
    if (u.hostname === 'cdn.jsdelivr.net' || u.hostname.includes('fonts.g')) return r.abort();
    if (u.hostname === 'codequest.mariam2009m44.workers.dev') { const cors = { 'access-control-allow-origin': 'http://fixture', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' }; if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors }); const body = JSON.parse(r.request().postData() || '{}'), act = u.pathname.split('/').pop(); reqs.push({ act, body, cache: r.request().headers()['cache-control'], auth: r.request().headers().authorization }); const o = handler(act, body); return r.fulfill({ status: o.status, headers: cors, contentType: 'application/json', body: JSON.stringify(o.data) }); }
    if (u.href.endsWith('firebase-auth.js')) return js('export const onAuthStateChanged=(a,cb)=>{window.__authcb=cb;cb({uid:"u",getIdToken:async()=>"t"})};export const signOut=async()=>{}');
    if (u.pathname === '/js/firebase-config.js') return js('export const auth={currentUser:{uid:"u",getIdToken:async()=>"t"}},functions={},db={}');
    if (u.pathname === '/js/auth.js') return js('export const requireUser=async()=>({uid:"u",getIdToken:async()=>"t"});export const getCurrentUser=()=>({uid:"u"});export const updateCurrentUserName=async()=>{};export async function logoutUser(){}');
    if (['/js/reminders.js', '/js/route-guard.js', '/js/game-audio.js'].includes(u.pathname)) return js('');
    if (u.origin !== 'http://fixture') { if (process.env.DBG) console.log('ABORT', u.href); return r.abort(); }
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };
    try { return r.fulfill({ contentType: types[path.extname(u.pathname)] || 'text/plain', body: await fs.readFile(root + u.pathname) }); } catch { return r.fulfill({ status: 404 }); } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); if (process.env.DBG) p.on('requestfailed', q => console.log('RF', q.url(), q.failure().errorText)); if (process.env.DBG) p.on('console', m => console.log('CONSOLE', m.text())); await p.goto('http://fixture/' + file); return { b, p, errs, reqs };
}
const ok = data => ({ status: 200, data });
test('settings: consent names who can claim, the exact two counts, expiry, code format and revocation; no code without the checkbox', async () => {
  const { b, p, reqs, errs } = await open('settings.html', (a, body) => a === 'create' ? ok({ success: true, code: 'K7M2QX4PR9TD', expiresAt: new Date(Date.now() + 1800000).toISOString() }) : ok({ success: true, parents: [{ parentUid: 'p1' }] }));
  try {
    const text = await p.textContent('#parentConsentText');
    for (const part of [/30 دقيقة/, /أي شخص يحصل على الرمز/, /شيئين فقط/, /اختبارات الدروس/, /امتحانات الوحدات/, /لا تعرض اسمك ولا بريدك/, /12 حرفًا/, /فورًا/]) assert.match(text, part);
    assert.doesNotMatch(text, /النقاط والنجوم|عدد المشاريع|آخر نشاط:/);
    await p.click('#createParentCodeButton'); await p.waitForTimeout(200);
    assert.equal(reqs.some(r => r.act === 'create'), false, 'no create call without consent');
    await p.check('#parentConsentCheck'); await p.click('#createParentCodeButton'); await p.waitForSelector('#parentCodeBox:not([hidden])');
    assert.equal(await p.textContent('#parentCodeValue'), 'K7M2QX4PR9TD');
    const c = reqs.find(r => r.act === 'create'); assert.equal(c.body.consent, true); assert.equal(c.auth, 'Bearer t');
    await p.waitForSelector('#linkedParentsList button'); await p.locator('section[aria-labelledby=learnerLinkTitle]').screenshot({ path: path.join(require('node:os').tmpdir(), 'parent-consent-390.png') });
    p.once('dialog', d => d.accept()); await p.click('#linkedParentsList button'); await p.waitForTimeout(300); assert.deepEqual(reqs.find(r => r.act === 'unlink').body, { parent: 'p1' });
    assert.equal(await p.locator('.toast, [role=alert]').filter({ hasText: 'تعذر' }).count(), 0, 'no error toast');
    assert.deepEqual(errs, []);
  } finally { await b.close(); }
});
test('settings: service off shows a clear message and no code', async () => {
  const { b, p } = await open('settings.html', () => ({ status: 503, data: { success: false, message: 'parent_off' } }));
  try { await p.check('#parentConsentCheck'); await p.click('#createParentCodeButton'); await p.waitForFunction(() => /غير مفعّلة/.test(document.querySelector('#parentCodeStatus').textContent)); assert.equal(await p.locator('#parentCodeBox').isHidden(), true); } finally { await b.close(); }
});
test('parent dashboard: unknown sync is "غير متاح", never zero; assessed counts show; refused child renders nothing; logout clears everything', async () => {
  const { b, p, reqs } = await open('parent.html', (a, body) => a === 'children' ? ok({ success: true, children: [{ uid: 'c1' }, { uid: 'c2' }, { uid: 'c3' }] }) : a === 'dashboard' ? (body.child === 'c1' ? ok({ success: true, available: true, syncState: 'assessed', lessonTestsPassed: 4, unitExamsPassed: 1 }) : body.child === 'c2' ? ok({ success: true, available: false, syncState: 'unknown' }) : { status: 403, data: { success: false } }) : ok({ success: true }));
  try {
    await p.waitForSelector('.child-card'); const cards = p.locator('.child-card'); assert.equal(await cards.count(), 2, 'the refused child (403) renders no card');
    assert.deepEqual(await cards.nth(0).locator('.stat strong').allTextContents(), ['4', '1']);
    assert.deepEqual(await cards.nth(1).locator('.stat strong').allTextContents(), ['غير متاح', 'غير متاح']);
    assert.match(await cards.nth(1).textContent(), /لا يعني أنه لم يتعلم/);
    const html = await p.content(); assert.doesNotMatch(html, /XP|نجمة|آخر نشاط/);
    assert.ok(reqs.every(r => r.act !== 'x'));
    await p.locator('#childrenContainer').screenshot({ path: path.join(require('node:os').tmpdir(), 'parent-dashboard-390.png') });
    await p.evaluate(() => window.__authcb(null)); await p.waitForTimeout(200);
    assert.equal(await p.locator('.child-card').count(), 0, 'logout clears child data');
  } finally { await b.close(); }
});
test('parent dashboard: claim validates the 12-char code, then reloads; wrong code gives a clear error', async () => {
  let claims = 0;
  const { b, p, reqs } = await open('parent.html', a => a === 'children' ? ok({ success: true, children: [] }) : a === 'claim' ? (++claims === 1 ? { status: 404, data: { success: false } } : ok({ success: true })) : ok({}));
  try {
    await p.fill('#parentLinkCode', 'abc'); await p.click('#claimLinkButton'); assert.match(await p.textContent('#claimStatus'), /12/); assert.equal(reqs.some(r => r.act === 'claim'), false);
    await p.fill('#parentLinkCode', 'k7m2-qx4p r9td'); assert.equal(await p.inputValue('#parentLinkCode'), 'K7M2QX4PR9TD');
    await p.click('#claimLinkButton'); await p.waitForFunction(() => /غير صحيح/.test(document.querySelector('#claimStatus').textContent));
    await p.click('#claimLinkButton'); await p.waitForFunction(() => /تم ربط/.test(document.querySelector('#claimStatus').textContent));
    assert.equal(reqs.filter(r => r.act === 'claim')[0].body.code, 'K7M2QX4PR9TD');
  } finally { await b.close(); }
});
