const {chromium}=(()=>{try{return require('playwright')}catch{return require('playwright-core')}})(),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const out=process.env.CERT_OUT||'/tmp/cert-out';fs.mkdirSync(out,{recursive:true});
// Real profile.html with the Firebase layer stubbed: no login, no network, synthetic fixtures only.
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));let d;try{d=fs.readFileSync(f)}catch{s.writeHead(404);return s.end()}s.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});s.end(d)});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;
const b=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}:{});
const JS={'content-type':'text/javascript'};
const stubs={'**/js/auth.js':'export async function requireUser(){return {uid:"fixture-u1"}};export function getCurrentUser(){return {uid:"fixture-u1",getIdToken:async()=>"t"}}',
 '**/js/firebase-config.js':'export const db={},auth={}','**/js/app.js':'','**/js/reminders.js':'','https://www.gstatic.com/**':'export const collection=()=>({}),onSnapshot=()=>()=>{}'};
async function open(theme,vp){const c=await b.newContext({viewport:vp}),p=await c.newPage();const errs=[],reqs=[];
 p.on('pageerror',e=>errs.push(String(e)));p.on('request',r=>reqs.push(r.url()));
 await c.addInitScript(t=>{try{localStorage.setItem('cq_theme',t)}catch{}},theme);
 for(const [g,body] of Object.entries(stubs))await p.route(g,r=>r.fulfill({status:200,headers:JS,body}));
 await p.goto(L+'/profile.html');await p.waitForSelector('#profileCerts');await p.waitForFunction(()=>document.getElementById('certsEmpty').textContent.includes('غير مفعّل'));
 return {p,errs,reqs,c};}
const rec={track:'python',trackName:'Python',issuedAt:'2026-11-25T10:00:00Z',lessonsCompleted:48,lessonsTotal:48,unitExamsPassed:12,unitExamsTotal:12,codeTasksVerified:true,recordId:'FIXTURE-0001'};
// runs a state through the real module on the real profile DOM
const run=(p,mode)=>p.evaluate(async(a)=>{const m=await import('/learning-studio/profile-certificates.mjs');
 let uid='fixture-u1';const mk=(f,o={})=>m.initProfileCertificates({deps:{enabled:true,getUid:()=>uid,fetchCertificates:f,...o}});
 const ok=async()=>({certificates:[a.rec]});
 if(a.mode==='ok')await mk(ok).refresh();
 if(a.mode==='error')await mk(async()=>{throw new Error('x')}).refresh();
 if(a.mode==='signedout')await mk(ok,{getUid:()=>null}).refresh();
 if(a.mode==='invalid')await mk(async()=>({certificates:[{...a.rec,codeTasksVerified:false}]})).refresh();
 if(a.mode==='wrong')await mk(async()=>{uid='other';return {certificates:[a.rec]}}).refresh();
 if(a.mode==='stale'){let n=0;const slow=()=>new Promise(r=>setTimeout(()=>r({certificates:[a.rec]}),150));const fast=async()=>({certificates:[]});
  const i=m.initProfileCertificates({deps:{enabled:true,getUid:()=>uid,fetchCertificates:()=>(n++?fast():slow())}});const p1=i.refresh(),p2=i.refresh();await Promise.all([p1,p2])}
 const l=document.getElementById('certsList'),e=document.getElementById('certsEmpty');return {listHidden:l.hidden,items:l.children.length,emptyHidden:e.hidden,empty:e.textContent,href:l.querySelector('a')?.getAttribute('href')||null}},{rec,mode});
try{
 let {p,errs,reqs,c}=await open('dark',{width:1280,height:900});
 assert(!reqs.some(u=>u.includes('/api/certificates')),'disabled: no certificate request');
 const dis=await p.evaluate(()=>({l:document.getElementById('certsList').hidden,t:document.getElementById('certsEmpty').textContent}));
 assert(dis.l);assert.match(dis.t,/غير مفعّل/);assert(!/^لا توجد/.test(dis.t));
 const mine=errs.filter(e=>/certific|profile-cert/i.test(e));assert.deepEqual(mine,[]);
 await p.screenshot({path:out+'/profile-full-desktop-dark.png',fullPage:true});await c.close();
 for(const theme of ['light','dark'])for(const [vpn,vp] of [['mobile',{width:390,height:844}],['desktop',{width:1280,height:900}]]){
  ({p,c}=await open(theme,vp));
  const sec=p.locator('#profileCerts');
  const r1=await run(p,'ok');assert.equal(r1.items,1);assert(!r1.listHidden&&r1.emptyHidden);assert.match(r1.href,/id=FIXTURE-0001$/);await sec.screenshot({path:`${out}/certs-ok-${vpn}-${theme}.png`});
  const r2=await run(p,'error');assert(r2.listHidden&&r2.items===0);assert.match(r2.empty,/تعذر تحميل/);await sec.screenshot({path:`${out}/certs-error-${vpn}-${theme}.png`});
  const r3=await run(p,'signedout');assert(r3.listHidden);assert.match(r3.empty,/سجّلي الدخول/);
  const r4=await run(p,'invalid');assert(r4.listHidden&&r4.items===0);assert.match(r4.empty,/تعذر تحميل/);
  const r5=await run(p,'wrong');assert(r5.listHidden&&r5.items===0,'wrong account drops response');
  const r6=await run(p,'stale');assert(r6.listHidden&&r6.items===0,'late old response must not overwrite newer one');
  const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert(!ov,'no horizontal overflow');
  if(vpn==='mobile'&&theme==='light')await p.screenshot({path:out+'/profile-full-mobile-light.png',fullPage:true});
  await c.close();
 }
 console.log('profile certificates browser regression ok');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
