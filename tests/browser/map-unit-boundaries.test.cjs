// Unit projects: page + map entry. Grading runs REAL python3 through a local stand-in for the execution endpoint; sign-in is stubbed (?uid=).
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const REF=JSON.parse(fs.readFileSync(path.join(root,'tests/content/project-references.json'),'utf8'));
(async()=>{const srv=http.createServer((q,s)=>{
 if(q.method==='POST'&&q.url==='/__local_verify'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{const j=JSON.parse(b);const r=spawnSync('python3',['-c',j.code],{encoding:'utf8',timeout:8000});s.writeHead(200,{'content-type':'application/json'});s.end(JSON.stringify({ok:r.status===0,stdout:r.stdout,stderr:r.stderr,message:r.stderr}))});return}
 const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();

// Every Python unit boundary on the real map page (stubbed sign-in; records and the device quiz flag stand in for finished lessons / a passed unit exam).
const mk=async(lessonsDoneUnits,extraDone,passedUnits)=>{const c=await b.newContext({viewport:{width:390,height:844}});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
 const recs=[];for(let ci=0;ci<lessonsDoneUnits;ci++)for(let li=0;li<4;li++)recs.push({chapter:ci,lesson:li,completed:true});for(let li=0;li<extraDone;li++)recs.push({chapter:lessonsDoneUnits,lesson:li,completed:true});
 await c.route('**/js/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const requireUser=async()=>({uid:'u1'});export const getLessonProgress=async()=>${JSON.stringify(recs)};export const getUserProfile=async()=>({xp:0,stars:0});`}));
 const p=await c.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message.slice(0,80)));await p.addInitScript(([pu])=>{sessionStorage.setItem('cq_cody_intro_u1_python','1');for(const u of pu)localStorage.setItem('codequest_studio_quiz_u1_python_'+u,JSON.stringify({percent:80,passed:true,source:'studio-device-only'}))},[passedUnits]);
 await p.goto(L+'/course-path.html?lang=python');await p.waitForSelector('.cw-unit');await p.waitForTimeout(400);return {c,p}};
const st=(p,ci,li)=>p.evaluate(([ci,li])=>{const n=document.querySelector(`.cw-road-node[data-ci="${ci}"][data-li="${li}"]`);const bt=n.querySelector('button');return {cls:n.className.replace(/\s+/g,' '),disabled:bt.disabled,href:bt.dataset.href||''}},[ci,li]);
for(let u=0;u<12;u++){
 // lessons of unit u done, exam NOT passed: exam node current and opens the unit exam; next unit locked
 {const {c,p}=await mk(u,4,Array.from({length:u},(_,i)=>i+1));const ex=await st(p,u,4);
  assert.match(ex.cls,/is-current/,'unit '+(u+1)+' exam node is current');assert.ok(ex.href.includes('quiz.html')&&ex.href.includes('unit='+(u+1)),'exam node opens unit exam: '+ex.href);
  if(u<11){const nx=await st(p,u+1,0);assert.equal(nx.disabled,true,'next unit locked before exam pass')}
  const hdr=await p.evaluate(ci=>document.querySelectorAll('.cw-unit')[ci].querySelector('.cw-unit-title p').textContent,u);assert.match(hdr,/4 دروس \+ امتحان الوحدة/,hdr);const foot=await p.evaluate(ci=>document.querySelectorAll('.cw-unit-foot')[ci].textContent,u);assert.match(foot,/باقي امتحان الوحدة/,foot);assert.doesNotMatch(foot,/أحسنت/,foot);await c.close()}
 // exam passed: exam node done and the FIRST node of the next unit is open and navigates to that unit's first lesson
 {const {c,p}=await mk(u,4,Array.from({length:u+1},(_,i)=>i+1));const ex=await st(p,u,4);assert.match(ex.cls,/is-done/,'unit '+(u+1)+' exam node done after pass');{const foot=await p.evaluate(ci=>document.querySelectorAll('.cw-unit-foot')[ci].textContent,u);assert.match(foot,/أنهيت الوحدة بنجاح/,foot)}
  if(u<11){const nx=await st(p,u+1,0);assert.match(nx.cls,/is-current/,'unit '+(u+2)+' first node current');assert.equal(nx.disabled,false);
   await p.locator(`.cw-road-node[data-ci="${u+1}"][data-li="0"] button`).click();await p.waitForURL(/learning\.html/,{timeout:6000});assert.ok(p.url().includes('unit='+(u+2)),p.url());await p.waitForFunction(id=>location.search.includes(id),'py-'+(u+2)+'-1',{timeout:6000});assert.equal(await p.evaluate(()=>document.getElementById('title').textContent.length>0),true)}
  await c.close()}
 // clicking the exam node lands on the unit exam page, not on lesson 1
 if(u===0||u===11){const {c,p}=await mk(u,4,Array.from({length:u},(_,i)=>i+1));await p.locator(`.cw-road-node[data-ci="${u}"][data-li="4"] button`).click();await p.waitForURL(/quiz\.html/,{timeout:6000});assert.ok(p.url().includes('unit='+(u+1)));await c.close()}
}
console.log('python map unit boundaries ok (stubbed records/flags)');
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
