// Store page: honest empty state and unavailable (not 0) coins. Stubbed Firebase (mock, not real account data).
const { test } = require('node:test'), assert = require('node:assert/strict'), { chromium } = require('playwright'), fs = require('fs/promises'), path = require('path');
const root = path.resolve(__dirname, '../..');
async function open(userDoc) {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.setDefaultTimeout(5000);
  await p.route('**/*', async r => { const u = new URL(r.request().url()), js = body => r.fulfill({ contentType: 'text/javascript', body });
    if (u.hostname === 'cdn.jsdelivr.net' || u.hostname.includes('fonts.g')) return r.abort();
    if (u.href.endsWith('firebase-auth.js')) return js('export const onAuthStateChanged=(a,cb)=>cb({uid:"u"});export const signOut=async()=>{}');
    if (u.href.endsWith('firebase-firestore.js')) return js(`const snap={exists:()=>true,data:()=>(${JSON.stringify(userDoc)})};export const doc=()=>({});export const getDoc=async()=>snap;export const onSnapshot=(r,cb)=>{setTimeout(()=>cb(snap),0);return()=>{}};export const collection=()=>({});export const getDocs=async()=>({docs:[]});`);
    if (u.href.endsWith('firebase-functions.js')) return js('export const httpsCallable=()=>async()=>({data:{}});export const getFunctions=()=>({})');
    if (u.pathname === '/js/firebase-config.js') return js('export const auth={currentUser:{uid:"u"}},db={},functions={}');
    if (u.pathname === '/js/ui.js') return js('export const showToast=()=>{};export const showLoading=()=>{};export const hideLoading=()=>{}');
    if (['/js/reminders.js', '/js/route-guard.js', '/js/game-audio.js'].includes(u.pathname)) return js('');
    if (u.origin !== 'http://fixture') return r.abort();
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };
    try { return r.fulfill({ contentType: types[path.extname(u.pathname)] || 'text/plain', body: await fs.readFile(root + u.pathname) }); } catch { return r.fulfill({ status: 404 }); } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); await p.goto('http://fixture/store.html'); return { b, p, errs };
}
test('empty store: honest wording, no claim about saved balances, existing characters stay free; valid coins shown', async () => {
  const { b, p, errs } = await open({ coins: 12, inventory: [] });
  try { await p.waitForSelector('.store-message'); const t = await p.textContent('#storeGrid'); assert.match(t, /لسه مفيش عناصر/); assert.match(t, /متاحة لك مجانًا/); assert.doesNotMatch(t, /محفوظ/); assert.equal((await p.textContent('#userCoins')).trim(), '12'); assert.deepEqual(errs, []); } finally { await b.close(); }
});
test('missing or invalid coins field shows "غير متاح", never 0', async () => {
  for (const doc of [{}, { coins: -3 }, { coins: 'x' }]) { const { b, p } = await open(doc); try { await p.waitForSelector('.store-message'); assert.equal((await p.textContent('#userCoins')).trim(), 'غير متاح', JSON.stringify(doc)); } finally { await b.close(); } }
});
