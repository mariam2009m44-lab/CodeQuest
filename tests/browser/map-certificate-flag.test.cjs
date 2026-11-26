// End-of-path certificate on the map: OFF unless features.json has serverAssessment AND certificateIssue. The server decides; the page shows only what it returns. Stubbed Worker and sign-in (fixtures, not production).
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const cur=JSON.parse(fs.readFileSync(path.join(root,'json/python_curriculum.json'),'utf8'));
const recs=[];cur.chapters.forEach((ch,ci)=>(ch.lessons||[]).forEach((_,li)=>recs.push({chapter:ci,lesson:li,completed:true})));
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
const jwt='h.'+Buffer.from(JSON.stringify({sub:'u1'})).toString('base64url')+'.s';
async function scene({flags,complete=true,reply,shot}){
 const c=await b.newContext({viewport:{width:390,height:844}});await c.route(/^https?:\/\/(?!localhost)(?!codequest\.mariam)/,r=>r.abort());
 await c.route('**/learning-studio/features.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(flags)}));
 await c.route('**/js/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const requireUser=async()=>({uid:'u1'});export const getLessonProgress=async()=>${JSON.stringify(complete?recs:recs.slice(0,3))};export const getUserProfile=async()=>({xp:0,stars:0});`}));
 await c.route('**/js/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:`export const auth={currentUser:{uid:'u1',getIdToken:async()=>'${jwt}'}};`}));
 const calls=[];await c.route('https://codequest.mariam2009m44.workers.dev/**',async r=>{const u=r.request().url();calls.push(u.split('.dev')[1]);if(u.includes('/api/progress/get'))return r.fulfill({status:500,headers:{'access-control-allow-origin':'*'},body:'x'});await reply(r)});
 const p=await c.newPage();p.on('pageerror',e=>console.log('PAGEERR',e.message.slice(0,80)));
 await p.addInitScript(()=>sessionStorage.setItem('cq_cody_intro_u1_python','1'));
 await p.addInitScript(n=>{for(let u=1;u<=n;u++)localStorage.setItem('codequest_studio_quiz_u1_python_'+u,JSON.stringify({passed:true,percent:90}))},cur.chapters.length);
 await p.goto(L+'/course-path.html?lang=python');await p.waitForSelector('.cw-unit');await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>({finish:!document.getElementById('cwFinish').hidden,box:!!document.getElementById('cwCertBox'),text:document.getElementById('cwCertBox')?.textContent||'',href:document.getElementById('cwCertificate')?.getAttribute('href')||null}));
 if(shot){await p.locator('#cwFinish').scrollIntoViewIfNeeded();await p.screenshot({path:shot})}
 await c.close();return {...r,calls}}
const ok=(o)=>r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)});
const st=(n,o={})=>r=>r.fulfill({status:n,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)});
let r=await scene({flags:{serverAssessment:true,certificateIssue:false},reply:ok({})});assert.equal(r.finish,true,'fixture reaches 100%');assert.equal(r.box,false,'issue flag OFF: nothing shown');assert.ok(!r.calls.some(x=>x.includes('certificates')),'issue flag OFF: no certificate request');
r=await scene({flags:{serverAssessment:false,certificateIssue:true},reply:ok({})});assert.equal(r.box,false,'server assessment OFF: nothing');assert.equal(r.calls.length,0);
r=await scene({flags:{serverAssessment:true,certificateIssue:true},complete:false,reply:ok({})});assert.equal(r.finish,false);assert.ok(!r.calls.some(x=>x.includes('certificates')),'path not complete: never asks');
r=await scene({flags:{serverAssessment:true,certificateIssue:true},reply:ok({success:true,certificates:[{track:'python',recordId:'abcDEF1234567890abcdef1234567890'}]}),shot:'/tmp/cert-map-ok.png'});assert.ok(r.calls.includes('/api/certificates/issue'));assert.equal(r.href,'/learning-studio/certificate.html?id=abcDEF1234567890abcdef1234567890');
r=await scene({flags:{serverAssessment:true,certificateIssue:true},reply:ok({success:true,certificates:[{track:'java',recordId:'abcDEF1234567890abcdef1234567890'}]})});assert.equal(r.href,null,'record of another track ignored');
r=await scene({flags:{serverAssessment:true,certificateIssue:true},reply:ok({success:true,certificates:[{track:'python',recordId:'bad id!'}]})});assert.equal(r.href,null,'malformed record id ignored');
r=await scene({flags:{serverAssessment:true,certificateIssue:true},reply:st(409,{success:false,message:'not_eligible',blockers:[{code:'lesson_tests'}]}),shot:'/tmp/cert-map-409.png'});assert.equal(r.href,null);assert.match(r.text,/جزء ناقص/,'not eligible on the server: honest message, no link');
r=await scene({flags:{serverAssessment:true,certificateIssue:true},reply:st(503,{success:false,message:'certificate_issuance_off'})});assert.equal(r.href,null);assert.match(r.text,/مش متاحة/);
console.log('map end-of-path certificate flag ok (stubbed Worker and sign-in; fixtures)');
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
