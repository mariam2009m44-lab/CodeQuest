// Flag-ON browser behaviour of the lesson test against a MOCK Worker (Playwright route). The real Worker, real Firebase tokens and real DO storage are NOT involved.
// Covers: success, lost response (503) then reload retry with the SAME request id, network failure (also what an old Worker's failed CORS preflight looks like to the page),
// definitive rejection, 401 needs-login, and account isolation of the pending queue.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const bank=JSON.parse(fs.readFileSync(root+'/learning-studio/lesson-tests.json','utf8'))['py-1-1'];
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end()}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
const W='https://codequest.mariam2009m44.workers.dev';
try{
 async function ctxFor(uid,handler,{flag=true}={}){const c=await b.newContext({viewport:{width:390,height:900}}),seen=[];
  await c.route('**/learning-studio/features.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({accountEvidence:false,serverAssessment:flag})}));
  await c.route('**/js/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:`export const auth={currentUser:{uid:${JSON.stringify(uid)},getIdToken:async(force)=>'tok-${uid}'+(force?'-forced':'')}};`}));
  await c.route(W+'/**',async r=>{const q=r.request();if(q.method()==='OPTIONS')return r.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'Content-Type, Authorization, X-Request-Id'}});
   const rec={url:q.url().replace(W,''),auth:q.headers().authorization,rid:q.headers()['x-request-id'],body:q.postDataJSON()};seen.push(rec);
   const o=await handler(rec,seen.length);if(o==='abort')return r.abort('failed');
   r.fulfill({status:o.status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o.body||{success:o.status===200})})});
  return {c,seen}}
 async function takeTest(c,uid,nright){const p=await c.newPage();p.on('pageerror',e=>console.log('PE',e.message));
  await p.goto(L+'/learning-studio/index.html');
  await p.evaluate(([u])=>localStorage.setItem('cq_lt_pending',JSON.stringify({lessonId:'py-1-1',language:'python',unit:1,index:0,uid:u,fromMap:true})),[uid]);
  await p.goto(L+'/learning-studio/lesson-test.html?lang=python&lesson=py-1-1&uid='+uid);await p.waitForSelector('#ltBody .choices button');
  for(let i=0;i<4;i++){const want=bank[i].options[bank[i].answer];const bs=p.locator('#ltBody .choices button');const n=await bs.count();let t;for(let k=0;k<n;k++){const x=(await bs.nth(k).innerText()).trim();if(i<nright?x===want:x!==want){t=bs.nth(k);break}}await t.click();await p.locator('#ltBody button.primary').click()}
  await p.waitForSelector('#ltResult:not([hidden])');await p.waitForTimeout(700);return p}
 const queue=(p,uid)=>p.evaluate(u=>JSON.parse(localStorage.getItem('cq_pending_'+u)||'{}'),uid);
 const lt=r=>r.url.startsWith('/api/progress/lesson-test');

 // 1. success: one authenticated post with a request id, nothing left pending, no "not on your account" notice.
 {const {c,seen}=await ctxFor('u1',()=>({status:200}));const p=await takeTest(c,'u1',3);const posts=seen.filter(lt);
  assert.equal(posts.length,1,'exactly one post');assert.equal(posts[0].auth,'Bearer tok-u1');assert.match(posts[0].rid,/^[A-Za-z0-9_-]{8,64}$/);
  assert.deepEqual(Object.keys(await queue(p,'u1')),[],'nothing pending after success');assert.equal(await p.locator('#pendingNotice').count(),0);await c.close()}

 // 2. lost response (503): result stays on the device, honest notice, reload retries with the SAME id, then clears.
 {let mode='down';const {c,seen}=await ctxFor('u1',()=>mode==='down'?{status:503}:{status:200});const p=await takeTest(c,'u1',3);
  const q1=await queue(p,'u1');assert.equal(Object.keys(q1).length,1,'kept pending');const id=Object.values(q1)[0].id;assert.ok(id);
  assert.equal(await p.locator('#pendingNotice').count(),1,'honest notice shown');const txt=await p.locator('#pendingNotice').innerText();assert.match(txt,/على الجهاز/);assert.doesNotMatch(txt,/تم الحفظ على حسابك/);
  const local=await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('codequest_studio_lessontest_u1_')));assert.equal(local.length,1,'local result intact');
  mode='up';await p.reload();await p.waitForSelector('#ltResult:not([hidden])');await p.waitForTimeout(900);
  const rids=seen.filter(lt).map(x=>x.rid);assert.ok(rids.length>=2);assert.ok(rids.every(x=>x===id),'every retry reuses the stored request id: '+rids.join(','));
  assert.deepEqual(Object.keys(await queue(p,'u1')),[],'cleared after the retry succeeded');await c.close()}

 // 3. network failure (also how a failed CORS preflight on an old Worker looks): UI still works, result kept, stays pending.
 {const {c}=await ctxFor('u1',()=>'abort');const p=await takeTest(c,'u1',3);
  assert.equal(Object.keys(await queue(p,'u1')).length,1);assert.ok(await p.locator('#ltResult').isVisible());assert.equal(await p.locator('#pendingNotice').count(),1);await c.close()}

 // 4. definitive rejection (400): discarded, not retried forever, local result intact, no notice.
 {const {c,seen}=await ctxFor('u1',()=>({status:400,body:{success:false,message:'bad_request'}}));const p=await takeTest(c,'u1',3);
  assert.deepEqual(Object.keys(await queue(p,'u1')),[]);assert.equal(seen.filter(lt).length,1);assert.equal(await p.locator('#pendingNotice').count(),0);await c.close()}

 // 5. 401 twice: kept as needs-login with the sign-in wording, forced token refresh attempted.
 {const {c,seen}=await ctxFor('u1',()=>({status:401}));const p=await takeTest(c,'u1',3);
  assert.ok(seen.filter(lt).some(x=>/forced/.test(x.auth||'')),'a forced token refresh was tried');
  const q=await queue(p,'u1');assert.equal(Object.keys(q).length,1);assert.equal(Object.values(q)[0].needsLogin,true);assert.match(await p.locator('#pendingNotice').innerText(),/سجّل الدخول/);await c.close()}

 // 6. account isolation: u1's pending result is never sent or shown for u2.
 {const {c,seen}=await ctxFor('u1',()=>({status:503}));const p=await takeTest(c,'u1',3);const store=await p.evaluate(()=>({...localStorage}));await c.close();
  const two=await ctxFor('u2',()=>({status:200}));const p2=await two.c.newPage();await p2.goto(L+'/learning-studio/index.html');
  await p2.evaluate(s=>{for(const[k,v]of Object.entries(s))localStorage.setItem(k,v)},store);
  await p2.goto(L+'/learning-studio/lesson-test.html?lang=python&lesson=py-1-1&uid=u2');await p2.waitForSelector('#ltBody .choices button');await p2.waitForTimeout(900);
  assert.equal(two.seen.filter(lt).length,0,'u2 never posts u1 payload');assert.equal(await p2.locator('#pendingNotice').count(),0,'u2 sees no notice about u1');
  assert.equal(Object.keys(await queue(p2,'u2')).length,0);assert.equal(Object.keys(await queue(p2,'u1')).length,1,'u1 entry preserved untouched');await two.c.close()}

 // 7. flag OFF: no request at all and no notice.
 {const {c,seen}=await ctxFor('u1',()=>({status:200}),{flag:false});const p=await takeTest(c,'u1',3);assert.equal(seen.length,0);assert.equal(await p.locator('#pendingNotice').count(),0);await c.close()}
 console.log('server-assessment flag-on (mock worker) ok');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
