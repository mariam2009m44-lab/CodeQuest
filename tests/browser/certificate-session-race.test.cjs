const {chromium}=(()=>{try{return require('playwright')}catch{return require('playwright-core')}})(),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'};
// Regression: Firebase restores the saved session AFTER the page's modules run. The certificate page must wait for it,
// not read currentUser once. The auth layer is stubbed (fixture): getCurrentUser() is null until requireUser() resolves, 300ms later.
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));let d;try{d=fs.readFileSync(f)}catch{s.writeHead(404);return s.end()}s.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});s.end(d)});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;
const b=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}:{});
const JS={'content-type':'text/javascript'};
const rec={track:'javascript',trackName:'JavaScript',issuedAt:'2026-11-27T08:00:00Z',lessonsCompleted:26,lessonsTotal:26,unitExamsPassed:8,unitExamsTotal:8,codeTasksVerified:true,recordId:'FIXTURE-JS-0001'};
async function run(restores){
 const c=await b.newContext({viewport:{width:390,height:844}}),p=await c.newPage();
 const auth=`let u=null;const user={uid:"fixture-u1",getIdToken:async()=>"t"};
 export async function requireUser(){await new Promise(r=>setTimeout(r,300));if(${restores}){u=user;return user}throw new Error("no")}
 export function getCurrentUser(){return u}
 export async function getUserProfile(){return {name:"Fixture Learner"}}`;
 await p.route('**/js/auth.js',r=>r.fulfill({status:200,headers:JS,body:auth}));
 await p.route('**/api/certificates**',r=>r.fulfill({status:200,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:JSON.stringify({certificates:[rec]})}));
 await p.goto(L+'/learning-studio/certificate.html?id=FIXTURE-JS-0001');
 await p.waitForTimeout(1500);if(restores)await p.screenshot({path:(process.env.CERT_OUT||'/tmp')+'/cert-session-ok.png'});
 const r={canvas:await p.evaluate(()=>!document.getElementById('certCanvas').hidden),text:await p.evaluate(()=>document.body.innerText)};
 await c.close();return r}
try{
 const ok=await run(true);assert(ok.canvas,'a restored session must show the certificate');assert(!/سجّل الدخول لعرض/.test(ok.text));
 const out=await run(false);assert(!out.canvas);assert.match(out.text,/سجّل الدخول لعرض/,'a truly signed-out visitor still sees the sign-in message');
 console.log('certificate session-race regression ok (fixture)');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
