// Studio lesson page (ui.mjs + resume-sync + progress-api) with stubbed sign-in on a non-localhost origin. The Worker is stubbed and records every request. Proves a token that belongs to another account is never sent for this account's resume record: normal control, switch before flush, and a token fetch that is still pending when the account switches. FIXTURE ONLY: stub accounts "uidA"/"uidB", flag resumeSync forced on in this test's routed features.json only.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const origin='http://codequest.test';const W='https://codequest.mariam2009m44.workers.dev';const T={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.mjs':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg'};
const jwt=sub=>'h.'+Buffer.from(JSON.stringify({sub})).toString('base64url')+'.s';
async function run(scenario){
 const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const reqs=[];
 await c.route('**/*',async r=>{const rq=r.request(),u=new URL(rq.url());
  if(u.origin===W&&u.pathname==='/api/code/run'){if(rq.method()==='OPTIONS')return r.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true,stdout:(()=>{const m=/print\(\\?"([^"\\]*)/.exec(rq.postData()||'');return (m?m[1]:'1')+'\n'})(),stderr:'',status:'Accepted'})})}
  if(u.origin===W){reqs.push({path:u.pathname,auth:rq.headers()['authorization']||''});return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify({ok:true,rev:1})})}
  if(u.href==='https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js')return r.fulfill({contentType:'text/javascript',body:'export function httpsCallable(){return async()=>({data:{}})}'});
  if(u.href==='https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js')return r.fulfill({contentType:'text/javascript',body:'export const onAuthStateChanged=()=>()=>{};'});
  if(u.origin!==origin)return r.abort();
  if(u.pathname==='/js/auth.js')return r.fulfill({contentType:'text/javascript',body:'export const requireUser=async()=>({uid:"uidA"});export const getUserProfile=async()=>({xp:0,stars:0});export const getLessonProgress=async()=>[];'});
  if(u.pathname==='/js/firebase-config.js')return r.fulfill({contentType:'text/javascript',body:`const jwt=s=>'h.'+btoa(JSON.stringify({sub:s})).replace(/=/g,'').replace(/\\+/g,'-').replace(/\\//g,'_')+'.s';window.__cu=window.__cu||'uidA';export const auth={get currentUser(){const id=window.__cu;return id?{uid:id,getIdToken:async()=>{if(window.__gate)await window.__gate;return jwt(window.__cu)}}:null}};export const functions={};`});
  if(u.pathname==='/learning-studio/features.json')return r.fulfill({contentType:'application/json',body:JSON.stringify({accountEvidence:false,serverAssessment:false,unitProjects:false,resumeSync:true})});
  if(['/js/route-guard.js','/js/reminders.js'].includes(u.pathname))return r.fulfill({contentType:'application/javascript',body:''});
  try{await r.fulfill({contentType:T[path.extname(u.pathname)]||'x',body:fs.readFileSync(path.join(root,decodeURIComponent(u.pathname.slice(1))))})}catch{await r.fulfill({status:404,body:'nf'})}});
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));if(process.env.DBG)p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,160))});
 await p.addInitScript(()=>{window.__cu='uidA'});
 await p.goto(origin+'/learning-studio/index.html?lang=python');await p.waitForSelector('#code',{state:'attached',timeout:15000});await p.waitForTimeout(1500);
 // reach the practice phase with the real controls (stub execution)
 for(let i=0;i<14;i++){const ro=await p.evaluate(()=>document.getElementById('code').readOnly);if(!ro)break;const clicked=await p.evaluate(i=>{const vis=e=>e&&e.offsetParent!==null&&!e.disabled;if(i===0){const sk=document.getElementById('skipStory');if(vis(sk)){sk.click();return 'skipStory'}}const cand=[...document.querySelectorAll('button,[role=button]')].filter(e=>vis(e)&&e.id!=='skipStory'&&e.offsetParent!==null&&e.getBoundingClientRect().height>0&&!e.closest('nav,header,#languages,#units,#lessons'));const t=cand.find(e=>e.id==='runWorked')||cand.find(e=>e.id==='next')||cand.find(e=>e.textContent.trim()==='Hello')||cand[0];if(t){t.click();return (t.id||t.textContent.trim().slice(0,20))+' of ['+cand.map(e=>e.id||e.textContent.trim().slice(0,14)).join('|')+']'}return null},i);if(process.env.DBG)console.log('click',clicked);await p.waitForTimeout(500)}
 if(process.env.DBG)console.log('workedOutput',await p.evaluate(()=>document.getElementById('workedOutput').textContent),'feedback',await p.evaluate(()=>document.getElementById('feedback').textContent),'errs',errs.join(';'));
 if(process.env.DBG)console.log('readonly',await p.evaluate(()=>document.getElementById('code').readOnly),await p.evaluate(()=>document.getElementById('stageLabel').textContent));
 // edit the draft so the page checkpoints a pending resume record for uidA
 const type=async v=>{await p.evaluate(v=>{const el=document.getElementById('code');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))},v)};
 await type('print(1)  # '+scenario);await p.waitForTimeout(300);
 const pend=await p.evaluate(()=>Object.keys(localStorage).filter(k=>/resume/i.test(k)));
 if(scenario==='switch-before-flush'){await p.evaluate(()=>{window.__cu='uidB'})}
 if(scenario==='switch-during-token'){await p.evaluate(()=>{window.__gate=new Promise(r=>{window.__open=r})});
   await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await p.waitForTimeout(200);await p.evaluate(()=>{window.__cu='uidB';window.__open()});}
 else await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
 await p.waitForTimeout(1500);
 const resume=reqs.filter(r=>r.path==='/api/progress/resume');const own=await p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>/resume/i.test(k)).map(k=>[k,(localStorage.getItem(k)||'').slice(0,60)])));
 await b.close();return {reqs:resume,pend,errs,own}}
(async()=>{
 const A=jwt('uidA'),B=jwt('uidB');
 const ctl=await run('control');assert.ok(ctl.pend.length>0,'a pending resume record was written: '+JSON.stringify(ctl.pend));assert.ok(ctl.reqs.length>=1,'control: resume request reached the stub Worker');assert.ok(ctl.reqs.every(r=>r.auth==='Bearer '+A),'control: only uidA token sent');
 const sw=await run('switch-before-flush');assert.ok(!sw.reqs.some(r=>r.auth.includes(B)),'switch-before-flush: uidB token was sent for uidA record: '+JSON.stringify(sw.reqs));
 const dt=await run('switch-during-token');assert.ok(!dt.reqs.some(r=>r.auth.includes(B)),'switch-during-token: uidB token was sent for uidA record: '+JSON.stringify(dt.reqs));
 console.log('resume-sync account switch (fixture): control sent',ctl.reqs.length,'request(s) with the owner token only; switch before flush sent',sw.reqs.length,'; token fetch pending across a switch sent',dt.reqs.length,'; no request carried the other account token');
})().catch(e=>{console.error(e.message||e);process.exit(1)});
