const {chromium}=(()=>{try{return require('playwright')}catch{return require('playwright-core')}})(),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
// Regression: the profile badges counted only cloud lesson records, so a learner who finished lessons on the map (account-scoped device records)
// saw 0 / all locked. FIXTURE: Firebase layer stubbed with an EMPTY cloud snapshot; the real readLocalLessonProgress source is served from js/app.js.
const appSrc=fs.readFileSync(root+'/js/app.js','utf8');const m=appSrc.match(/export function readLocalLessonProgress[\s\S]*?\n}\n/);assert(m,'readLocalLessonProgress is exported');
const units=JSON.parse(fs.readFileSync(root+'/learning-studio/units.json','utf8')).filter(u=>u.language==='javascript');
const recs=units.flatMap(u=>u.lessons.map((_,i)=>({chapter:u.unit-1,lesson:i,completed:true})));
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));let d;try{d=fs.readFileSync(f)}catch{s.writeHead(404);return s.end()}s.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});s.end(d)});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;
const b=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}:{});
const JS={'content-type':'text/javascript'};
const c=await b.newContext({viewport:{width:390,height:844}}),p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await c.addInitScript(r=>{localStorage.setItem('codequest_lesson_progress_fixture-u1_javascript',JSON.stringify(r))},recs);
const stubs={'**/js/auth.js':'export async function requireUser(){return {uid:"fixture-u1"}};export function getCurrentUser(){return {uid:"fixture-u1",getIdToken:async()=>"t"}}',
 '**/js/firebase-config.js':'export const db={},auth={}','**/js/reminders.js':'',
 '**/js/app.js*':m[0],
 'https://www.gstatic.com/**':'export const collection=()=>({}),onSnapshot=(q,ok)=>{setTimeout(()=>ok({forEach(){}}),50);return ()=>{}}'};
for(const [g,body] of Object.entries(stubs))await p.route(g,r=>r.fulfill({status:200,headers:JS,body}));
await p.goto(L+'/profile.html');await p.waitForFunction(()=>/أكملت \d+ درسًا/.test(document.body.innerText),null,{timeout:8000});
const note=await p.evaluate(()=>document.body.innerText.match(/أكملت \d+ درسًا/)[0]);
assert.equal(note,'أكملت '+recs.length+' درسًا','map lessons count on the profile: '+note);
const unlocked=await p.evaluate(()=>document.querySelectorAll('.badge-card.unlocked, .is-unlocked').length);
await p.locator('#badgesGrid').scrollIntoViewIfNeeded();await p.screenshot({path:(process.env.CERT_OUT||'/tmp')+'/profile-map-progress.png'});
assert.deepEqual(errs.filter(e=>/profile|app\.js|readLocal/i.test(e)),[]);
console.log('profile map-progress regression ok (fixture):',note);
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
