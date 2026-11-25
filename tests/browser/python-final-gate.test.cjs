// Python final exam entry + gate. Stubbed sign-in and stubbed Worker responses (mock tokens): proves page logic only, not a real account.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const units=JSON.parse(fs.readFileSync(path.join(root,'learning-studio/units.json'),'utf8')).filter(u=>u.language==='python');
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
const recs=[];for(let ci=0;ci<12;ci++)for(let li=0;li<12;li++)recs.push({chapter:ci,lesson:li,completed:true});
async function ctx(){const c=await b.newContext({viewport:{width:390,height:844}});
 await c.route('**/js/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const requireUser=async()=>({uid:'u1'});export const getLessonProgress=async()=>${JSON.stringify(recs)};export const saveLessonProgress=async()=>{};export const getUserProfile=async()=>({xp:0,stars:0});`}));
 await c.route('**/js/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:`export const auth={currentUser:{getIdToken:async()=>'mock-token'}};`}));
 await c.route('**/*cdn*/**',r=>r.abort());return c}
async function exam({server,worker,legacy,shot}){const c=await ctx();
 await c.route('**/learning-studio/features.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({serverAssessment:server})}));
 let hits=0;await c.route('https://codequest.mariam2009m44.workers.dev/**',r=>{hits++;if(worker==='net')return r.abort();r.fulfill({status:worker.status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(worker.body)})});
 const p=await c.newPage();await p.goto(L+'/learning-studio/index.html');
 await p.evaluate(l=>{if(l){const a=[];for(let i=1;i<=12;i++)a.push(i);localStorage.setItem('codequest_u1_cody_python_progress',JSON.stringify({completed:a}))}},legacy);
 await p.goto(L+'/python-exam.html');await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>({status:document.getElementById('statusMessage').hidden?'':document.getElementById('statusMessage').textContent.trim(),content:!document.getElementById('examContent').hidden}));
 if(shot)await p.screenshot({path:shot});await c.close();return {...r,hits}}
const exams=n=>{const e={};for(let i=1;i<=12;i++)e['python-'+i]={passed:i<=n,percent:90};return {status:200,body:{success:true,exams:e,lessons:{},finals:{}}}};
try{
 let r=await exam({server:true,worker:exams(12)});assert.equal(r.content,true,'all 12 server-passed opens the exam');
 r=await exam({server:true,worker:exams(11),shot:process.env.SHOT_INC||'/tmp/final-incomplete.png'});assert.equal(r.content,false);assert.match(r.status,/امتحانات الوحدات/);
 r=await exam({server:true,worker:exams(11),legacy:true});assert.equal(r.content,false,'legacy local chapter records never open it in server mode');
 r=await exam({server:true,worker:{status:503,body:{success:false}},legacy:true,shot:process.env.SHOT_UNK||'/tmp/final-unknown.png'});assert.equal(r.content,false);assert.match(r.status,/تعذّر التحقق/);
 r=await exam({server:true,worker:'net',legacy:true});assert.equal(r.content,false);assert.match(r.status,/تعذّر التحقق/);
 r=await exam({server:true,worker:{status:200,body:{success:true}},legacy:true});assert.equal(r.content,false,'malformed state is unknown, not passed');
 r=await exam({server:false,worker:'net',legacy:true});assert.equal(r.content,true,'legacy mode (server assessment OFF) keeps its existing behaviour');assert.equal(r.hits,0,'legacy mode does not call the Worker gate');
 // map: after the last lesson the end link appears (last unit exam, then the Python final)
 for(const [passed,re] of [[false,/quiz\.html\?lang=python&unit=12/],[true,/\/python-exam\.html$/]]){
  const c=await ctx();const p=await c.newPage();await p.addInitScript(()=>{sessionStorage.setItem('cq_cody_intro_u1_python','1')});await p.goto(L+'/learning-studio/index.html');
  await p.evaluate(ps=>{if(ps)localStorage.setItem('codequest_studio_quiz_python_'+ps,JSON.stringify({passed:true}))},passed?'12':null);
  await p.goto(L+'/course-path.html?lang=python');await p.waitForSelector('.cw-unit',{timeout:8000});await p.waitForTimeout(500);
  const href=await p.evaluate(()=>document.getElementById('cwExamGate')?.getAttribute('href')||null);
  assert.match(href||'',re);if(passed){await p.evaluate(()=>document.getElementById('cwExamGate').scrollIntoView({block:'center'}));await p.waitForTimeout(400)}if(passed)await p.screenshot({path:process.env.SHOT_MAP||'/tmp/final-map.png'});await c.close()}
 console.log('python final gate + map entry ok (stubbed)');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
