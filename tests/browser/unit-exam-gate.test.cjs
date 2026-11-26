// Unit exam gate (owner report: the unit exam could be opened from lesson 1). Opens only when every lesson test of the unit is passed on THIS account (and, from unit 2, the previous unit exam). Fixtures: stored passes, ?gate=1 turns the gate on for localhost. The lesson page link is hidden until the same condition.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const units=JSON.parse(fs.readFileSync(root+'/learning-studio/units.json','utf8'));
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end()}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
try{
const open=async(lang,unit,uid,seed,gate=true)=>{const c=await b.newContext({viewport:{width:390,height:844}});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());const p=await c.newPage();
 await p.goto(L+'/learning-studio/index.html');await p.evaluate(s=>{for(const [k,v] of Object.entries(s))localStorage.setItem(k,v)},seed);
 await p.goto(L+'/learning-studio/quiz.html?lang='+lang+'&unit='+unit+'&uid='+uid+(gate?'&gate=1':''));await p.waitForTimeout(700);
 const r=await p.evaluate(()=>({locked:!!document.getElementById('examLockedMap'),cards:document.querySelectorAll('#quizBody .quiz-card,#quizBody .card,#quizBody>*').length,title:document.getElementById('quizTitle').textContent,ov:document.documentElement.scrollWidth>innerWidth+1}));return {c,p,r}};
const passes=(lang,unit,uid)=>Object.fromEntries(units.find(u=>u.language===lang&&u.unit===unit).lessons.map(l=>['codequest_studio_lessontest_'+uid+'_'+lang+'_'+l.id,JSON.stringify({passed:true,percent:100})]));
for(const lang of ['python','javascript','cpp','java']){
 let o=await open(lang,1,'u1',{});assert.equal(o.r.locked,true,lang+' locked with no lesson passes');assert.equal(o.r.ov,false);if(lang==='python')await o.p.screenshot({path:'/tmp/examlocked.png'});await o.p.setViewportSize({width:1200,height:700});await o.p.screenshot({path:'/tmp/examlocked-wide.png'});await o.c.close();
 const all=passes(lang,1,'u1');const part={};Object.entries(all).slice(0,-1).forEach(([k,v])=>part[k]=v);
 o=await open(lang,1,'u1',part);assert.equal(o.r.locked,true,lang+' locked when one lesson test is missing');await o.c.close();
 o=await open(lang,1,'u2',all);assert.equal(o.r.locked,true,lang+' another account never inherits passes');await o.c.close();
 o=await open(lang,1,'u1',all);assert.equal(o.r.locked,false,lang+' opens when all lesson tests are passed');assert.ok(o.r.cards>0);await o.c.close();
 o=await open(lang,1,'u1',{},false);assert.equal(o.r.locked,false,lang+' fixture bypass is localhost-only without gate=1');await o.c.close();
}
// unit 2 needs unit 1 exam too
{const lang='python';const all=passes(lang,2,'u1');let o=await open(lang,2,'u1',all);assert.equal(o.r.locked,true,'unit 2 exam locked without unit 1 exam pass');await o.c.close();
 o=await open(lang,2,'u1',{...all,codequest_studio_quiz_u1_python_1:JSON.stringify({passed:true})});assert.equal(o.r.locked,false);await o.c.close()}
// lesson page: link to the exam stays hidden until every lesson test of the unit is passed
{const c=await b.newContext({viewport:{width:390,height:844}});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());const p=await c.newPage();
 await p.goto(L+'/learning-studio/index.html?lang=python&unit=1&uid=u1');await p.waitForSelector('#unitQuiz',{state:'attached'});await p.waitForTimeout(600);
 assert.equal(await p.evaluate(()=>document.getElementById('unitQuiz').hidden),true,'exam link hidden at lesson 1');await c.close()}
console.log('unit exam gate ok (fixtures)')}finally{await b.close();srv.close()}})().catch(e=>{console.error(String(e.stack||e).slice(0,500));process.exit(1)});
