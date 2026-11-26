// Unit projects: page + map entry. Grading runs REAL python3 through a local stand-in for the execution endpoint; sign-in is stubbed (?uid=).
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const REF=JSON.parse(fs.readFileSync(path.join(root,'tests/content/project-references.json'),'utf8'));
(async()=>{const srv=http.createServer((q,s)=>{
 if(q.method==='POST'&&q.url==='/__local_verify'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{const j=JSON.parse(b);const r=spawnSync('python3',['-c',j.code],{encoding:'utf8',timeout:8000});s.writeHead(200,{'content-type':'application/json'});s.end(JSON.stringify({ok:r.status===0,stdout:r.stdout,stderr:r.stderr,message:r.stderr}))});return}
 const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
async function page(url){const c=await b.newContext({viewport:{width:390,height:844}});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());await c.route('**/learning-studio/features.json',r=>r.fulfill({contentType:'application/json',body:'{"unitProjects":true}'}));const p=await c.newPage();p.__errs=[];p.on('pageerror',e=>p.__errs.push(e.message));await p.goto(L+url);await p.waitForLoadState('networkidle');return {c,p}}
const setCode=async(p,code)=>{await p.fill('textarea.quiz-code',code)};
const check=async p=>{await p.click('button.primary');await p.waitForFunction(()=>!/بنصحح/.test(document.querySelector('#pjResult')?.textContent||'x')&&document.querySelector('#pjResult').textContent.length>0,null,{timeout:20000});await p.waitForTimeout(200);return p.evaluate(()=>document.querySelector('#pjResult').innerText)};
try{
 // 1 starter fails, hint ladder
 let {c,p}=await page('/learning-studio/project.html?project=py-p1&uid=u1');
 assert.ok(await p.locator('.pj-reqs bdi[dir=ltr]').count()>0,'code fragments in requirements are isolated LTR');assert.match(await p.textContent('#pjTitle'),/مؤشر وقود/);assert.equal(await p.locator('.pj-hint').count(),0,'no hint before the learner asks');
 let t=await check(p);assert.match(t,/لسه في حالات فاشلة/);assert.match(t,/المتوقع/);
 await p.click('.pj-hint-btn');assert.equal(await p.locator('.pj-hint').count(),1);await p.click('.pj-hint-btn');assert.equal(await p.locator('.pj-hint').count(),2);
 await p.reload();await p.waitForLoadState('networkidle');assert.equal(await p.locator('.pj-hint').count(),2,'hint count survives reload for this account');
 // 2 boundary bug is caught (visible 50 case + hidden)
 await setCode(p,'if fuel > 50:\n    print("Ready")\nelif fuel > 20:\n    print("Low")\nelse:\n    print("Refuel")\n');t=await check(p);
 assert.match(t,/فشلت الحالة 2/);assert.match(t,/حالات مخفية فشلت/);
 // 3 syntax error is "not graded", not a failure verdict
 await setCode(p,'if fuel >= 50\n    print("Ready")');t=await check(p);assert.match(t,/ما اتحسبش/);
 // 4 try-run uses the editable setup
 await setCode(p,REF['py-p1']);await p.fill('textarea.pj-try','fuel = 30');await p.click('button:has-text("جرّب")');await p.waitForFunction(()=>document.querySelector('.quiz-out').textContent.includes('Low'),null,{timeout:15000});
 await p.screenshot({path:process.env.SHOT_TRY||'/tmp/pj-try.png'});
 // 5 correct passes, local-only note, saved per account
 t=await check(p);assert.match(t,/نجح في كل الحالات/);assert.match(t,/كل الحالات المخفية/);assert.match(t,/مش بتتحسب في الشهادة/);
 await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(200);await p.screenshot({path:process.env.SHOT_PASS||'/tmp/pj-pass.png'});
 assert.deepEqual(p.__errs,[]);
 {const p2=await c.newPage();await p2.goto(L+'/learning-studio/project.html?project=py-p1&uid=u1');await p2.waitForLoadState('networkidle');p=p2}assert.match(await p.textContent('#pjStatus'),/الكود الحالي نجح في كل الحالات/);await p.fill('textarea.quiz-code',REF['py-p1']+'# edit');assert.match(await p.textContent('#pjStatus'),/نجحت قبل كده بنسخة تانية/,'an edit makes the old pass stale');assert.equal(await p.locator('#pjResult').innerText(),'','old test list is cleared on edit');await p.fill('textarea.quiz-code',REF['py-p1']);assert.match(await p.textContent('#pjStatus'),/الكود الحالي نجح/);assert.equal(await p.inputValue('textarea.quiz-code'),REF['py-p1'],'code resumes');
 {const p3=await c.newPage();await p3.goto(L+'/learning-studio/project.html?project=py-p1&uid=u2');await p3.waitForLoadState('networkidle');p=p3}assert.equal(await p.textContent('#pjStatus'),'','another account has no pass status');assert.equal(await p.locator('.pj-hint').count(),0,'hints do not carry over');assert.match(await p.inputValue('textarea.quiz-code'),/fuel بتتحدد/,'code is the starter, not the other account code');await c.close();
 // 6 the other two projects accept their reference solutions
 for(const id of ['py-p2','py-p3']){({c,p}=await page('/learning-studio/project.html?project='+id+'&uid=u1'));await setCode(p,REF[id]);t=await check(p);assert.match(t,/نجح في كل الحالات/,id);await c.close()}
 ({c,p}=await page('/learning-studio/project.html?project=nope&uid=u1'));assert.match(await p.textContent('#pjTitle'),/مش موجود/);await c.close();
 // 6b service unavailable and slow states (stubbed 503 / delay), nothing is graded
 {const c3=await b.newContext({viewport:{width:390,height:844}});await c3.route(/^https?:\/\/(?!localhost)/,r=>r.abort());await c3.route('**/learning-studio/features.json',r=>r.fulfill({contentType:'application/json',body:'{"unitProjects":true}'}));await c3.route('**/__local_verify',async r=>{await new Promise(x=>setTimeout(x,1200));r.fulfill({status:503,body:'x'})});
  const p3=await c3.newPage();await p3.goto(L+'/learning-studio/project.html?project=py-p1&uid=u1');await p3.waitForLoadState('networkidle');await p3.fill('textarea.quiz-code',REF['py-p1']);
  await p3.click('button.primary');await p3.waitForTimeout(300);assert.match(await p3.locator('#pjResult').innerText(),/بنصحح/,'loading state is shown');
  await p3.waitForFunction(()=>!/بنصحح/.test(document.getElementById('pjResult').innerText),null,{timeout:15000});assert.match(await p3.locator('#pjResult').innerText(),/ما اتحسبش/);assert.doesNotMatch(await p3.locator('#pjResult').innerText(),/نجح في كل الحالات/);
  assert.equal(await p3.evaluate(()=>JSON.parse(localStorage.getItem('codequest_studio_project_u1_py-p1')||'{}').passed||false),false,'an unavailable service never records a pass');
  await p3.click('button:has-text("مش بيتحسب")');await p3.waitForFunction(()=>/تعذر/.test(document.querySelector('.quiz-out').textContent),null,{timeout:15000});
  await p3.screenshot({path:process.env.SHOT_ERR||'/tmp/pj-unavailable.png'});await c3.close()}
 // 7 map entry: only completed units 4/8/12 show the link; an unfinished unit shows none
 for(const [done,expect] of [[20,0],[40,0],[60,0],[3,0]]){
  const c2=await b.newContext({viewport:{width:390,height:844}});await c2.route(/^https?:\/\/(?!localhost)/,r=>r.abort());await c2.route('**/learning-studio/features.json',r=>r.fulfill({contentType:'application/json',body:'{"unitProjects":true}'}));
  await c2.route('**/js/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const requireUser=async()=>({uid:'u1'});export const getLessonProgress=async()=>${JSON.stringify((()=>{const a=[];let n=0;for(let ci=0;ci<12;ci++)for(let li=0;li<5;li++){if(n++<done)a.push({chapter:ci,lesson:li,completed:true})}return a})())};export const getUserProfile=async()=>({xp:0,stars:0});`}));
  const p2=await c2.newPage();await p2.addInitScript(()=>{sessionStorage.setItem('cq_cody_intro_u1_python','1')});await p2.goto(L+'/course-path.html?lang=python');await p2.waitForSelector('.cw-unit',{timeout:8000});await p2.waitForTimeout(400);
  const ids=await p2.evaluate(()=>[...document.querySelectorAll('.cw-project-link')].map(a=>a.id));
  if(done===20)assert.deepEqual(ids,['cwProject4']);if(done===40)assert.deepEqual(ids,['cwProject4','cwProject8']);if(done===60)assert.deepEqual(ids,['cwProject4','cwProject8','cwProject12']);if(done===3)assert.deepEqual(ids,[]);
  if(done===20){await p2.evaluate(()=>{const e=document.getElementById('cwProject4');window.scrollTo(0,e.getBoundingClientRect().top+scrollY-200)});await p2.waitForTimeout(400);assert.ok(await p2.locator('#cwProject4').isVisible());await p2.screenshot({path:process.env.SHOT_MAP||'/tmp/pj-map.png'})}
  await c2.route('**/learning-studio/features.json',r=>r.fulfill({contentType:'application/json',body:'{"unitProjects":false}'}));await p2.reload();await p2.waitForLoadState('networkidle');await p2.waitForSelector('.cw-unit,.cw-node,#cwMap *',{timeout:8000}).catch(()=>{});assert.equal(await p2.locator('.cw-project-link').count(),0,'OFF: no map project link');
  await c2.close()}
  {const c4=await b.newContext({viewport:{width:390,height:844}});await c4.route(/^https?:\/\/(?!localhost)/,r=>r.abort());let hits=0;await c4.route('**/__local_verify',r=>{hits++;r.abort()});
   const p4=await c4.newPage();await p4.goto(L+'/learning-studio/project.html?project=py-p1&uid=u1');await p4.waitForLoadState('networkidle');await p4.waitForSelector('#pjOff');assert.equal(await p4.locator('textarea.quiz-code').count(),0,'OFF: no editor');assert.equal(await p4.locator('button:has-text("تحقق")').count(),0);assert.equal(hits,0);
   await p4.screenshot({path:'/tmp/pj-off.png'});await c4.close()}
 console.log('unit projects ok (real python3 grading, stubbed sign-in)');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
