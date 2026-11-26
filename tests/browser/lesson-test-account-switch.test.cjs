// Lesson-test page (lesson-test.mjs + progress-api pending queue) with stubbed sign-in on a non-localhost origin. The Worker is stubbed and records every request. Proves a token that belongs to another account is never sent for this account's queued lesson-test record, and the record stays queued for its owner: normal control, switch before flush, and a token fetch that is still pending when the account switches. FIXTURE ONLY: stub accounts "uidA"/"uidB", flag serverAssessment forced on in this test's routed features.json only.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const origin='http://codequest.test';const W='https://codequest.mariam2009m44.workers.dev';const T={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.mjs':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg'};
const jwt=sub=>'h.'+Buffer.from(JSON.stringify({sub})).toString('base64url')+'.s';
async function run(scenario){
 const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const reqs=[];
 await c.route('**/*',async r=>{const rq=r.request(),u=new URL(rq.url());
  if(u.origin===W){reqs.push({path:u.pathname,auth:rq.headers()['authorization']||''});return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify({ok:true,saved:true})})}
  if(u.href==='https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js')return r.fulfill({contentType:'text/javascript',body:'export function httpsCallable(){return async()=>({data:{}})}'});
  if(u.href==='https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js')return r.fulfill({contentType:'text/javascript',body:'export const onAuthStateChanged=()=>()=>{};'});
  if(u.origin!==origin)return r.abort();
  if(u.pathname==='/js/auth.js')return r.fulfill({contentType:'text/javascript',body:'export const requireUser=async()=>({uid:"uidA"});export const getUserProfile=async()=>({xp:0,stars:0});export const getLessonProgress=async()=>[];'});
  if(u.pathname==='/js/firebase-config.js')return r.fulfill({contentType:'text/javascript',body:`const jwt=s=>'h.'+btoa(JSON.stringify({sub:s})).replace(/=/g,'').replace(/\\+/g,'-').replace(/\\//g,'_')+'.s';window.__cu=window.__cu||'uidA';export const auth={get currentUser(){const id=window.__cu;return id?{uid:id,getIdToken:async()=>{if(window.__gate)await window.__gate;return jwt(window.__cu)}}:null}};export const functions={};`});
  if(u.pathname==='/learning-studio/features.json')return r.fulfill({contentType:'application/json',body:JSON.stringify({accountEvidence:false,serverAssessment:true,unitProjects:false})});
  if(['/js/route-guard.js','/js/reminders.js'].includes(u.pathname))return r.fulfill({contentType:'application/javascript',body:''});
  try{await r.fulfill({contentType:T[path.extname(u.pathname)]||'x',body:fs.readFileSync(path.join(root,decodeURIComponent(u.pathname.slice(1))))})}catch{await r.fulfill({status:404,body:'nf'})}});
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(sc=>{window.__cu=sc==='switch-before-load'?'uidB':'uidA';if(sc==='switch-during-token')window.__gate=new Promise(r=>{window.__open=r});localStorage.setItem('cq_pending_uidA',JSON.stringify({'lt:python:py-1-1':{path:'/api/progress/lesson-test',payload:{language:'python',lessonId:'py-1-1',answers:[0]},attempts:0,id:'rfixture1'}}))},scenario);
 await p.goto(origin+'/learning-studio/lesson-test.html?lang=python&lesson=py-1-1');await p.waitForLoadState('load');await p.waitForTimeout(1200);
 if(scenario==='switch-during-token'){await p.evaluate(()=>{window.__cu='uidB';window.__open()})}
 await p.waitForTimeout(1500);
 const left=await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('cq_pending_uidA')||'{}')).length);const other=await p.evaluate(()=>localStorage.getItem('cq_pending_uidB'));
 await b.close();return {reqs:reqs.filter(r=>/\/api\/progress\//.test(r.path)),left,other,errs}}
(async()=>{
 const A=jwt('uidA'),B=jwt('uidB');
 const ctl=await run('control');assert.ok(ctl.reqs.length>=1,'control: queued lesson-test record was sent: '+JSON.stringify(ctl));assert.ok(ctl.reqs.every(r=>r.auth==='Bearer '+A),'control: only uidA token');assert.equal(ctl.left,0,'control: record removed after save');
 const dt=await run('switch-during-token');assert.ok(!dt.reqs.some(r=>r.auth.includes(B)),'switch-during-token: uidB token sent: '+JSON.stringify(dt.reqs));assert.equal(dt.left,1,'switch-during-token: uidA record must stay queued for its owner');
 const sb=await run('switch-before-load');assert.equal(sb.left,1,'switch-before-load: uidA record untouched while uidB is signed in');assert.ok(!sb.reqs.some(r=>r.auth.includes(B)&&r.path==='/api/progress/lesson-test'),'switch-before-load: uidB token must not carry uidA payload');
 console.log('lesson-test queue account switch (fixture): control sent',ctl.reqs.length,'with owner token; token pending across a switch sent',dt.reqs.length,'and kept the record queued; account already switched at load sent',sb.reqs.length,'lesson-test requests and kept the record');
})().catch(e=>{console.error(e.message||e);process.exit(1)});
