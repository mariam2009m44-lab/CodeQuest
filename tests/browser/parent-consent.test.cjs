// Parent-link consent text and unavailable-not-zero states. Stubbed Firebase/auth/functions (labelled: not real account data).
const { test } = require('node:test'), assert = require('node:assert/strict'), { chromium } = require('playwright'), fs = require('fs/promises'), path = require('path');
const root = path.resolve(__dirname, '../..');
async function open(file, children) {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.setDefaultTimeout(5000);
  await p.route('**/*', async r => { const u = new URL(r.request().url()), js = body => r.fulfill({ contentType: 'text/javascript', body });
    if (u.hostname === 'cdn.jsdelivr.net' || u.hostname.includes('fonts.g')) return r.abort();
    if (u.href.endsWith('firebase-functions.js')) return js(`export const httpsCallable=(f,n)=>async()=>{window.__calls=(window.__calls||[]).concat(n);if(n==="getParentDashboard")return{data:{success:true,children:${JSON.stringify(children || [])}}};if(n==="createParentLinkCode")return{data:{success:true,code:"0123456789abcdef",expiresAt:new Date(Date.now()+1800000).toISOString()}};return{data:{parents:[]}}}`);
    if (u.href.endsWith('firebase-auth.js')) return js('export const onAuthStateChanged=(a,cb)=>cb({uid:"u"});export const signOut=async()=>{}');
    if (u.pathname === '/js/firebase-config.js') return js('export const auth={currentUser:{uid:"u",getIdToken:async()=>"t"}},functions={},db={}');
    if (u.pathname === '/js/auth.js') return js('export const requireUser=async()=>({uid:"u"});export async function logoutUser(){}');
    if (['/js/reminders.js', '/js/route-guard.js', '/js/game-audio.js'].includes(u.pathname)) return js('');
    if (u.origin !== 'http://fixture') return r.abort();
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };
    try { return r.fulfill({ contentType: types[path.extname(u.pathname)] || 'text/plain', body: await fs.readFile(root + u.pathname) }); } catch { return r.fulfill({ status: 404 }); } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); await p.goto('http://fixture/' + file); return { b, p, errs };
}
test('settings: consent text names who can claim, what is shown, expiry and revocation; the code needs the checkbox', async () => {
  const { b, p } = await open('settings.html');
  try {
    const text = await p.textContent('#parentConsentText');
    for (const part of [/30 دقيقة/, /أي شخص يحصل على الرمز/, /اسمك/, /لا تعرض كلمة المرور ولا بريدك/, /تلغي الربط في أي وقت/]) assert.match(text, part);
    await p.click('#createParentCodeButton'); await p.waitForTimeout(200);
    assert.match(await p.textContent('#parentCodeStatus'), /وافق/); assert.equal(await p.evaluate(() => (window.__calls || []).includes('createParentLinkCode')), false, 'no code is created without consent');
    await p.check('#parentConsentCheck'); await p.click('#createParentCodeButton'); await p.waitForSelector('#parentCodeBox:not([hidden])');
    assert.equal(await p.textContent('#parentCodeValue'), '0123456789ABCDEF'); await p.locator('section[aria-labelledby=learnerLinkTitle]').screenshot({ path: path.join(require('node:os').tmpdir(), 'parent-consent-390.png') });
  } finally { await b.close(); }
});
test('parent dashboard: an unavailable source shows "غير متاح", never zero', async () => {
  const kid = { childUid: 'c1', displayName: 'ليلى', xp: 0, stars: 0, level: 1, completedLessons: 0, lessonsThisWeek: 0, projectsCount: 0, languageCounts: {}, dataAvailability: { progress: false, projects: true }, lastActivity: null };
  const { b, p } = await open('parent.html', [kid]);
  try {
    await p.waitForSelector('.child-card'); const stats = await p.locator('.child-card .stat strong').allTextContents();
    assert.deepEqual(stats, ['غير متاح', 'غير متاح', '0'], 'progress numbers unavailable, projects (available) shows its real 0');
    assert.match(await p.textContent('.child-card .language-list'), /غير متاح/); assert.doesNotMatch(await p.textContent('.child-card .language-list'), /0 درس/);
  } finally { await b.close(); }
});
