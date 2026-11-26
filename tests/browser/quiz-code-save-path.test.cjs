// Save path of a JS unit quiz with the server flag ON in a FIXTURE (mock sign-in, mock Worker that records POSTs; nothing real is touched):
// a graded-wrong code answer (syntax error) still finishes the quiz and posts the code task and the exam; a passing unit posts both too.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const quiz=JSON.parse(fs.readFileSync(path.join(root,'learning-studio/quizzes.json'),'utf8'))['javascript-2'];
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
async function run(code,shot){const posts=[];const c=await b.newContext({viewport:{width:390,height:844}});
 await c.route('**/learning-studio/features.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({serverAssessment:true})}));
 await c.route('**/js/firebase-config.js',r=>r.fulfill({contentType:'text/javascript',body:`export const auth={currentUser:{uid:'u1',getIdToken:async()=>'mock-token'}};`}));
 await c.route('https://codequest.mariam2009m44.workers.dev/**',r=>{const q=r.request();if(q.method()==='POST')posts.push(new URL(q.url()).pathname);r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:'{"success":true}'})});
 await c.route(/^https?:\/\/(?!localhost)(?!codequest\.mariam)/,r=>r.abort());
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(L+'/learning-studio/quiz.html?lang=javascript&unit=2&uid=u1');await p.waitForSelector('.quiz-item');
 for(let i=0;i<quiz.mcq.length;i++){await p.locator('.quiz-item').nth(i).locator('.choices button',{hasText:new RegExp('^\\s*'+esc(quiz.mcq[i].options[quiz.mcq[i].answer]).replace(/\\n/g,'\\s*')+'\\s*$')}).first().click()}
 const it=p.locator('.quiz-item').nth(quiz.mcq.length);await it.locator('.quiz-code').fill(code);await it.locator('button.primary').click();
 await p.waitForSelector('#quizResult:not([hidden]) h2',{timeout:8000});await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>({h:document.querySelector('#quizResult h2').textContent,st:document.querySelector('#quizResult .quiz-status').textContent}));
 if(shot){await p.screenshot({path:shot,fullPage:true})}
 assert.deepEqual(errs,[]);await c.close();return {...r,posts}}
const bad=await run('Iet doorOpen = true;\nconsole.log(7 / 2);',process.env.SHOT&&process.env.SHOT+'-wrong.png');
console.log(bad.h,'|',bad.st,'|',bad.posts.join(','));
assert.ok(bad.posts.some(x=>/code-task/.test(x)),'code task posted');assert.ok(bad.posts.some(x=>/\/exam/.test(x)),'exam posted');assert.match(bad.st,/ناجح/);assert.match(bad.h,/\(3 من 5\)/);
const good=await run('let doorOpen = true;\nconsole.log(doorOpen);\nconsole.log(5 > 7);');
assert.ok(good.posts.some(x=>/code-task/.test(x))&&good.posts.some(x=>/\/exam/.test(x)));assert.match(good.h,/100%/);
await b.close();srv.close();console.log('JS unit quiz save path ok (fixture, mock Worker)')})().catch(e=>{console.error(e.message||e);process.exit(1)});
