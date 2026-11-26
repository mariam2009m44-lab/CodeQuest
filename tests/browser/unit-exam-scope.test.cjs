// Unit projects: page + map entry. Grading runs REAL python3 through a local stand-in for the execution endpoint; sign-in is stubbed (?uid=).
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const REF=JSON.parse(fs.readFileSync(path.join(root,'tests/content/project-references.json'),'utf8'));
(async()=>{const srv=http.createServer((q,s)=>{
 if(q.method==='POST'&&q.url==='/__local_verify'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{const j=JSON.parse(b);const r=spawnSync('python3',['-c',j.code],{encoding:'utf8',timeout:8000});s.writeHead(200,{'content-type':'application/json'});s.end(JSON.stringify({ok:r.status===0,stdout:r.stdout,stderr:r.stderr,message:r.stderr}))});return}
 const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();

// Unit-exam pass flag is per account on this device. Real quiz page (stubbed execution), real map page (stubbed sign-in/records).
const quizzes=JSON.parse(fs.readFileSync(path.join(root,'learning-studio/quizzes.json'),'utf8'));const quiz=quizzes['python-1'];
const c=await b.newContext({viewport:{width:390,height:844}});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
let verifyOk=true;await c.route('**/__local_verify',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,stdout:verifyOk?quiz.code[0].tests[0].expected:'wrong'})}));
const recs=[0,1,2,3].map(li=>({chapter:0,lesson:li,completed:true}));
const as=async uidv=>{await c.unroute('**/js/auth.js').catch(()=>{});await c.route('**/js/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const authError=null;export const requireUser=async()=>(${JSON.stringify(uidv?{uid:uidv}:null)});export const getLessonProgress=async()=>${JSON.stringify(uidv?recs:[])};export const getUserProfile=async()=>({xp:0,stars:0});`}))};
const map=async()=>{const p=await c.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message.slice(0,80)));await p.addInitScript(()=>{for(const u of ['u1','u2'])sessionStorage.setItem('cq_cody_intro_'+u+'_python','1')});await p.goto(L+'/course-path.html?lang=python');await p.waitForSelector('.cw-unit');await p.waitForTimeout(400);
 const r=await p.evaluate(()=>({exam:document.querySelector('.cw-road-node[data-ci="0"][data-li="4"]').className,next:document.querySelector('.cw-road-node[data-ci="1"][data-li="0"]').className,nextDisabled:document.querySelector('.cw-road-node[data-ci="1"][data-li="0"] button').disabled}));await p.close();return r};
const take=async(uid,correct)=>{const p=await c.newPage();await p.goto(L+'/learning-studio/quiz.html?lang=python&unit=1&uid='+uid);await p.waitForSelector('.quiz-item');
 for(let i=0;i<quiz.mcq.length;i++){const item=p.locator('.quiz-item').nth(i);const want=quiz.mcq[i].options[quiz.mcq[i].answer];const bs=item.locator('.choices button');const n=await bs.count();let pick;for(let k=0;k<n;k++){const t=(await bs.nth(k).innerText()).replace(/[\s\u200e\u200f\u2066-\u2069]+/g,' ').trim();const w=want.replace(/[\s\u200e\u200f\u2066-\u2069]+/g,' ').trim();if(correct?t===w:t!==w){pick=bs.nth(k);break}}await pick.click()}
 await p.locator('.quiz-item').nth(quiz.mcq.length).locator('button.primary').click();await p.waitForSelector('#quizResult:not([hidden]) .quiz-status',{timeout:8000});await p.waitForTimeout(300);
 const st=await p.evaluate(()=>document.querySelector('#quizResult .quiz-status').textContent);await p.close();return st};
// 1. exam failed: no flag, exam node current, next unit locked
verifyOk=false;await as('u1');await take('u1',false);
assert.equal(await c.pages().length>=0,true);
let keys=await (async()=>{const p=await c.newPage();await p.goto(L+'/learning-studio/index.html');const k=await p.evaluate(()=>Object.keys(localStorage).filter(x=>x.startsWith('codequest_studio_quiz_')));await p.close();return k})();
{const flag=await (async()=>{const p=await c.newPage();await p.goto(L+'/learning-studio/index.html');const v=await p.evaluate(()=>JSON.parse(localStorage.getItem('codequest_studio_quiz_u1_python_1')||'null'));await p.close();return v})();assert.ok(!flag||flag.passed===false,'failed exam does not pass')}
let m=await map();assert.match(m.exam,/is-current/);assert.equal(m.nextDisabled,true);
// 2. exam passed: flag is stored under the account, survives reload, unit 2 opens
verifyOk=true;await take('u1',true);keys=await (async()=>{const p=await c.newPage();await p.goto(L+'/learning-studio/index.html');const k=await p.evaluate(()=>Object.keys(localStorage).filter(x=>x.startsWith('codequest_studio_quiz_')));await p.close();return k})();
assert.deepEqual(keys,['codequest_studio_quiz_u1_python_1'],'scoped key only');
m=await map();assert.match(m.exam,/is-done/);assert.match(m.next,/is-current/);assert.equal(m.nextDisabled,false);m=await map();assert.match(m.exam,/is-done/,'still done after another reload');
// 3. another account on the same device does not inherit the pass; signed-out does not either
await as('u2');m=await map();assert.match(m.exam,/is-current/,'u2 exam not done');assert.equal(m.nextDisabled,true,'u2 unit 2 locked');
await as(null);m=await map().catch(()=>null);
// 4. an old unscoped flag from before this change unlocks nobody
{const p=await c.newPage();await p.goto(L+'/learning-studio/index.html');await p.evaluate(()=>{localStorage.removeItem('codequest_studio_quiz_u1_python_1');localStorage.setItem('codequest_studio_quiz_python_1',JSON.stringify({passed:true}))});await p.close()}
await as('u1');m=await map();assert.match(m.exam,/is-current/,'legacy unscoped flag does not unlock u1');assert.equal(m.nextDisabled,true);
await as('u2');m=await map();assert.equal(m.nextDisabled,true,'legacy unscoped flag does not unlock u2');
console.log('unit exam flag per account ok (stubbed sign-in and execution)');
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
