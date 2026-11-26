// Python unit 12 exam result screen, features ON/OFF. Stubbed execution endpoint and sign-in (mock), real page code.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const quiz=JSON.parse(fs.readFileSync(path.join(root,'learning-studio/quizzes.json'),'utf8'))['python-12'];
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
async function run(flag,shot){const c=await b.newContext({viewport:{width:390,height:844}});
 await c.route('**/learning-studio/features.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({serverAssessment:flag})}));
 await c.route('**/js/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:`export const auth={currentUser:{uid:'u1',getIdToken:async()=>'mock-token'}};`}));
 await c.route('**/__local_verify',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,stdout:quiz.code[0].tests[0].expected})}));
 await c.route('https://codequest.mariam2009m44.workers.dev/**',r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"success":true}'}));
 await c.route(/^https?:\/\/(?!localhost)(?!codequest\.mariam)/,r=>r.abort());
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(L+'/learning-studio/quiz.html?lang=python&unit=12');await p.waitForSelector('.quiz-item');
 // answer every MCQ correctly by option text, then submit the code task
 for(let i=0;i<quiz.mcq.length;i++){const item=p.locator('.quiz-item').nth(i);await item.locator('.choices button',{hasText:new RegExp('^\\s*'+quiz.mcq[i].options[quiz.mcq[i].answer].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*$')}).first().click()}
 await p.locator('.quiz-item').nth(quiz.mcq.length).locator('button.primary').click();
 await p.waitForSelector('#quizResult:not([hidden]) .quiz-status',{timeout:8000});await p.waitForTimeout(500);
 const r=await p.evaluate(()=>({status:document.querySelector('#quizResult .quiz-status').textContent,link:document.querySelector('#quizResult a[href="/python-exam.html"]')?.textContent||null}));
 if(shot){await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(300);await p.screenshot({path:shot})}
 assert.deepEqual(errs,[]);await c.close();return r}
try{
 const on=await run(true,process.env.SHOT_ON||'/tmp/quiz-last-on.png');assert.match(on.status,/ناجح/);assert.match(on.link||'',/الامتحان الشامل/);
 const off=await run(false,process.env.SHOT_OFF||'/tmp/quiz-last-off.png');assert.match(off.status,/ناجح/);assert.equal(off.link,null);
 console.log('last-unit result screen ON/OFF ok (stubbed)');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
