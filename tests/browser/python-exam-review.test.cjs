// python-exam result screen lists wrongly answered questions with the right answer and reason. Legacy gate OFF-mode (stubbed sign-in/progress).
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
try{const c=await b.newContext({viewport:{width:390,height:844}});
 await c.route('**/js/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const requireUser=async()=>({uid:'u1'});export const getLessonProgress=async()=>[];export const saveLessonProgress=async()=>{};`}));
 await c.route('**/learning-studio/features.json',r=>r.fulfill({contentType:'application/json',body:'{"serverAssessment":false}'}));
 await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(L+'/learning-studio/index.html');await p.evaluate(()=>localStorage.setItem('codequest_u1_cody_python_progress',JSON.stringify({completed:[1,2,3,4,5,6,7,8,9,10,11,12]})));
 await p.goto(L+'/python-exam.html');await p.waitForSelector('#examContent:not([hidden]) .opt-btn');
 for(let i=0;i<15;i++){await p.locator('#questionOptions .opt-btn').first().click();await p.locator('#nextButton').click()}
 await p.waitForSelector('#resultBox.active');await p.waitForTimeout(300);
 const r=await p.evaluate(()=>({score:document.getElementById('scoreText').textContent,n:document.querySelectorAll('#missedReview .missed-item').length,hidden:document.getElementById('missedReview').hidden,first:document.querySelector('#missedReview .missed-item')?.innerText||''}));
 const earned=Number(r.score.match(/^\d+/)[0]);
 assert.equal(r.n,15-earned,'one review entry per wrong answer');assert.equal(r.hidden,r.n===0);
 if(r.n){assert.match(r.first,/إجابتك:/);assert.match(r.first,/الإجابة الصحيحة:/)}
 await p.evaluate(()=>document.getElementById('missedReview').scrollIntoView({block:'start'}));await p.waitForTimeout(300);await p.screenshot({path:process.env.SHOT||'/tmp/exam-review.png'});
 assert.deepEqual(errs,[]);console.log('python exam missed review ok (stubbed), wrong answers:',r.n,'score',r.score);
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
