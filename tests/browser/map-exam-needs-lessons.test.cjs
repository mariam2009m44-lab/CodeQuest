// Reported by the owner (phone screenshot): the unit 1 exam node showed done while its lessons were locked. A stored exam pass must not mark the exam node done until the unit's lessons are done. Fixture records and a device quiz flag; stubbed sign-in.
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
const hdr=(p,ci)=>p.evaluate(ci=>document.querySelectorAll('.cw-unit')[ci].querySelector('.cw-unit-title p').textContent,ci);
// exam pass stored, NO lessons done
{const {c,p}=await mk(0,0,[1]);const ex=await st(p,0,4),l1=await st(p,0,0),l2=await st(p,0,1);
 assert.doesNotMatch(ex.cls,/is-done/,'exam not done without lessons');assert.equal(ex.disabled,true,'exam node locked');assert.match(l1.cls,/is-current/);assert.equal(l2.disabled,true);
 assert.match(await hdr(p,0),/0 مكتمل/,await hdr(p,0));await c.close()}
// exam pass stored, only 2 of 4 lessons done
{const {c,p}=await mk(0,2,[1]);const ex=await st(p,0,4);assert.doesNotMatch(ex.cls,/is-done/);assert.equal(ex.disabled,true);assert.match(await hdr(p,0),/2 مكتمل/,await hdr(p,0));await c.close()}
// a pass stored for unit 3 only does not touch unit 1 or 2
{const {c,p}=await mk(0,0,[3]);for(const [ci,li] of [[0,4],[1,4],[2,4]]){const ex=await st(p,ci,li);assert.doesNotMatch(ex.cls,/is-done/,'unit '+(ci+1))}await c.close()}
// all 4 lessons done and exam pass: exam done (unchanged behaviour)
{const {c,p}=await mk(0,4,[1]);const ex=await st(p,0,4);assert.match(ex.cls,/is-done/);await c.close()}
console.log('exam node needs lessons done (fixture)');
await b.close();srv.close()})().catch(e=>{console.error(String(e.message||e).slice(0,300));process.exit(1)});
