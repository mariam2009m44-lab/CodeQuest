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
const c=await b.newContext({viewport:{width:390,height:844}});await c.route('**/js/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:"export const auth={get currentUser(){return window.__cu?{uid:window.__cu,getIdToken:async()=>'t'}:null}};"}));await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
let verifyOk=true;let gate=null;await c.route('**/__local_verify',async r=>{if(gate)await gate;await r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,stdout:verifyOk?quiz.code[0].tests[0].expected:'wrong'})})});
const recs=[0,1,2,3].map(li=>({chapter:0,lesson:li,completed:true}));
const as=async uidv=>{await c.unroute('**/js/auth.js').catch(()=>{});await c.route('**/js/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const authError=null;export const requireUser=async()=>(${JSON.stringify(uidv?{uid:uidv}:null)});export const getLessonProgress=async()=>${JSON.stringify(uidv?recs:[])};export const getUserProfile=async()=>({xp:0,stars:0});`}))};
const map=async()=>{const p=await c.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message.slice(0,80)));await p.addInitScript(()=>{for(const u of ['u1','u2'])sessionStorage.setItem('cq_cody_intro_'+u+'_python','1')});await p.goto(L+'/course-path.html?lang=python');await p.waitForSelector('.cw-unit');await p.waitForTimeout(400);
 const r=await p.evaluate(()=>({exam:document.querySelector('.cw-road-node[data-ci="0"][data-li="4"]').className,next:document.querySelector('.cw-road-node[data-ci="1"][data-li="0"]').className,nextDisabled:document.querySelector('.cw-road-node[data-ci="1"][data-li="0"] button').disabled}));await p.close();return r};
const take=async(uid,correct)=>{const p=await c.newPage();await p.goto(L+'/learning-studio/quiz.html?lang=python&unit=1&uid='+uid);await p.waitForSelector('.quiz-item');
 for(let i=0;i<quiz.mcq.length;i++){const item=p.locator('.quiz-item').nth(i);const want=quiz.mcq[i].options[quiz.mcq[i].answer];const bs=item.locator('.choices button');const n=await bs.count();let pick;for(let k=0;k<n;k++){const t=(await bs.nth(k).innerText()).replace(/[\s\u200e\u200f\u2066-\u2069]+/g,' ').trim();const w=want.replace(/[\s\u200e\u200f\u2066-\u2069]+/g,' ').trim();if(correct?t===w:t!==w){pick=bs.nth(k);break}}await pick.click()}
 await p.locator('.quiz-item').nth(quiz.mcq.length).locator('button.primary').click();await p.waitForSelector('#quizResult:not([hidden]) .quiz-status',{timeout:8000});await p.waitForTimeout(300);
 const st=await p.evaluate(()=>document.querySelector('#quizResult .quiz-status').textContent);await p.close();return st};


const norm=t=>t.replace(/[\s\u200e\u200f\u2066-\u2069]+/g,' ').trim();
const posts=[];c.on('request',q=>{if(q.method()==='POST'&&/workers\.dev/.test(q.url()))posts.push(q.url())});
async function answerMcq(p){for(let i=0;i<quiz.mcq.length;i++){const bs=p.locator('.quiz-item').nth(i).locator('.choices button');const want=norm(quiz.mcq[i].options[quiz.mcq[i].answer]);for(let k=0;k<await bs.count();k++){if(norm(await bs.nth(k).innerText())===want){await bs.nth(k).click();break}}}}
async function scenario(name,action,mode){
 verifyOk=true;await as('u1');let release;gate=new Promise(r=>release=r);
 const p=await c.newPage();await p.addInitScript(()=>{window.__cu='u1'});await p.goto(L+'/learning-studio/quiz.html?lang=python&unit=1&uid=u1');await p.waitForSelector('.quiz-item');await answerMcq(p);
 const last=p.locator('.quiz-item').nth(quiz.mcq.length);
 if(mode==='try'){await last.locator('button',{hasText:'جرّب'}).click()}else{await last.locator('button.primary').click()}
 await p.evaluate(()=>{window.__seen=[];new MutationObserver(()=>{document.querySelectorAll('.quiz-out').forEach(o=>window.__seen.push(o.textContent))}).observe(document.body,{subtree:true,childList:true,characterData:true})});
 await p.waitForTimeout(300); // executor request is now held open
 await p.evaluate(action);release();gate=null;await p.waitForTimeout(800);
 const out=await p.evaluate(()=>({keys:Object.keys(localStorage).filter(x=>x.startsWith('codequest_studio_quiz_')),h2:!!document.querySelector('#quizResult h2'),pass:!!document.querySelector('#quizResult .quiz-status.pass'),hidden:document.getElementById('quizBody').hidden,note:document.querySelector('#quizResult .quiz-status')?.textContent||'',pre:(window.__seen||[]).join('|'),kids:document.getElementById('quizBody').children.length,prog:document.querySelectorAll('.quiz-progress').length}));
 assert.deepEqual(out.keys,[],name+': nothing stored');assert.equal(out.h2,false,name+': no score');assert.equal(out.pass,false);assert.equal(out.hidden,true,name+': quiz hidden');assert.equal(out.kids,0,name+': quiz content removed');assert.equal(out.prog,0,name+': progress removed');assert.match(out.note,/الحساب اتغيّر/);assert.ok(!out.pre.includes(quiz.code[0].tests[0].expected),name+': stale output never inserted at any time');
 if(process.env.SHOT&&name==='switch during grading')await p.screenshot({path:'/downloads/quiz-switch2.png'});await p.close();console.log('ok',name)}
await scenario('switch during grading',()=>{window.__cu='u2'},'submit');
await scenario('signout during grading',()=>{window.__cu=null},'submit');
await scenario('switch during try-run',()=>{window.__cu='u2'},'try');
assert.equal(posts.filter(u=>/progress\/exam/.test(u)).length,0,'no exam sync posted');

// Token retrieval: owner switches while the ID token is being fetched. Nothing may be posted with a replacement user's token.
await c.unroute('**/js/firebase-config.js');
await c.route('**/js/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:"export const auth={get currentUser(){return window.__cu?{uid:window.__cu,getIdToken:async()=>{if(window.__tokGate)await window.__tokGate;return 'tok-'+window.__cu}}:null}};"}));
await c.route('**/learning-studio/features.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({serverAssessment:true})}));
const auths=[];c.on('request',q=>{if(q.method()==='POST'&&/workers\.dev/.test(q.url()))auths.push(q.url()+' '+(q.headers()['authorization']||''))});
{verifyOk=true;await as('u1');const p=await c.newPage();await p.addInitScript(()=>{window.__cu='u1';let rel;window.__tokGate=new Promise(r=>rel=r);window.__rel=rel});await p.goto(L+'/learning-studio/quiz.html?lang=python&unit=1&uid=u1');await p.waitForSelector('.quiz-item');await answerMcq(p);
 await p.locator('.quiz-item').nth(quiz.mcq.length).locator('button.primary').click();await p.waitForTimeout(600);
 await p.evaluate(()=>{window.__cu='u2';window.__rel()});await p.waitForTimeout(800);
 assert.deepEqual(auths,[],'no POST was sent while the owner changed during token fetch');
 const o=await p.evaluate(()=>({keys:Object.keys(localStorage).filter(x=>x.startsWith('codequest_studio_quiz_')),pend:Object.keys(localStorage).filter(x=>x.startsWith('cq_pending_u2'))}));assert.ok(o.keys.every(k=>k.includes('_u1_')),'any pass flag belongs to u1 only (the owner of the page), never u2');assert.deepEqual(o.pend,[],'nothing queued under u2');console.log('ok token fetch owner switch');await p.close()}
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
