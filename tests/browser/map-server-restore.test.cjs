// Unit projects: page + map entry. Grading runs REAL python3 through a local stand-in for the execution endpoint; sign-in is stubbed (?uid=).
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const REF=JSON.parse(fs.readFileSync(path.join(root,'tests/content/project-references.json'),'utf8'));
(async()=>{const srv=http.createServer((q,s)=>{
 if(q.method==='POST'&&q.url==='/__local_verify'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{const j=JSON.parse(b);const r=spawnSync('python3',['-c',j.code],{encoding:'utf8',timeout:8000});s.writeHead(200,{'content-type':'application/json'});s.end(JSON.stringify({ok:r.status===0,stdout:r.stdout,stderr:r.stderr,message:r.stderr}))});return}
 const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();


// Cross-device restore of a unit-exam pass from the ACCOUNT record (stubbed Worker, stubbed sign-in). Device has NO local flag.
const jwt=sub=>'h.'+Buffer.from(JSON.stringify({sub})).toString('base64url')+'.s';
const recs=[0,1,2,3].map(li=>({chapter:0,lesson:li,completed:true}));
async function scene({flag=true,uid='u1',authUid=uid,tokenSub=authUid,reply}){
 const c=await b.newContext({viewport:{width:390,height:844}});await c.route(/^https?:\/\/(?!localhost)(?!codequest\.mariam)/,r=>r.abort());
 await c.route('**/learning-studio/features.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({serverAssessment:flag})}));
 await c.route('**/js/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const requireUser=async()=>({uid:'${uid}'});export const getLessonProgress=async()=>${JSON.stringify(recs)};export const getUserProfile=async()=>({xp:0,stars:0});`}));
 await c.route('**/js/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:`export const auth={currentUser:{uid:'${authUid}',getIdToken:async()=>'${jwt(tokenSub)}'}};`}));
 const calls=[];await c.route('https://codequest.mariam2009m44.workers.dev/**',async r=>{calls.push(r.request().url()+' '+(r.request().headers().authorization?'auth':'noauth'));await reply(r)});
 const p=await c.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message.slice(0,80)));await p.addInitScript(u=>sessionStorage.setItem('cq_cody_intro_'+u+'_python','1'),uid);
 await p.goto(L+'/course-path.html?lang=python');await p.waitForSelector('.cw-unit');await p.waitForTimeout(1200);
 const r=await p.evaluate(()=>({exam:document.querySelector('.cw-road-node[data-ci="0"][data-li="4"]').className,next:document.querySelector('.cw-road-node[data-ci="1"][data-li="0"]').className,dis:document.querySelector('.cw-road-node[data-ci="1"][data-li="0"] button').disabled,local:Object.keys(localStorage).filter(k=>k.startsWith('codequest_studio_quiz_'))}));
 await c.close();return {...r,calls}}
const ok=(extra={})=>({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({success:true,exams:{'python-1':{passed:true,percent:80}},...extra})});
const send=o=>r=>r.fulfill(o);
let r=await scene({reply:send(ok())});assert.match(r.exam,/is-done/);assert.match(r.next,/is-current/);assert.equal(r.dis,false);assert.deepEqual(r.local,[],'restore does not write a device flag');assert.equal(r.calls.length,1);assert.match(r.calls[0],/progress\/get auth$/);
r=await scene({flag:false,reply:send(ok())});assert.match(r.exam,/is-current/,'flag OFF: account record ignored');assert.equal(r.dis,true);assert.equal(r.calls.length,0,'flag OFF: no request');
r=await scene({reply:send({status:500,headers:{'access-control-allow-origin':'*'},body:'x'})});assert.match(r.exam,/is-current/,'Worker 500: unknown, locked');assert.equal(r.dis,true);
r=await scene({reply:r=>r.abort()});assert.equal(r.dis,true,'Worker unreachable: locked');
r=await scene({reply:send(ok({success:false}))});assert.equal(r.dis,true,'success:false ignored');
r=await scene({reply:send({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({success:true,exams:{'javascript-1':{passed:true}}})})});assert.equal(r.dis,true,'other language record ignored');
r=await scene({reply:send({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({success:true,exams:{'python-1':{passed:false,percent:40}}})})});assert.equal(r.dis,true,'failed attempt does not unlock');
r=await scene({uid:'u2',tokenSub:'u1',reply:send(ok())});assert.equal(r.calls.length,0,'token of another account is never sent');assert.equal(r.dis,true);
r=await scene({uid:'u2',authUid:'u1',reply:send(ok())});assert.equal(r.calls.length,0,'signed-in account differs from page owner: no request');assert.equal(r.dis,true);
r=await scene({uid:'u2',reply:send(ok({exams:{}}))});assert.equal(r.dis,true,'second account on the device: its own record has no pass');
console.log('server unit-exam restore ok (stubbed Worker and sign-in; not production)');
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
