const {chromium}=(()=>{try{return require('playwright')}catch{return require('playwright-core')}})(),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png'};
const out=process.env.CERT_OUT||'/tmp/cert-out';fs.mkdirSync(out,{recursive:true});
// Endpoint flag forced on in the served copy only (test fixture); auth and /api/certificates are stubbed. No live backend.
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));let d;try{d=fs.readFileSync(f)}catch{s.writeHead(404);return s.end()}s.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});s.end(d)});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;
const b=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}:{});
const JS={'content-type':'text/javascript'};
const rec={track:'java',trackName:'Java',issuedAt:'2026-11-25T10:00:00Z',lessonsCompleted:30,lessonsTotal:30,unitExamsPassed:6,unitExamsTotal:6,codeTasksVerified:true,recordId:'FIXTURE-JAVA-1'};
async function scenario({base='https://cert-api.test',uid='u1',switchTo,fetchMode='ok',body,id='FIXTURE-JAVA-1',query,name='طالبة تجريبية'}){
 const c=await b.newContext({viewport:{width:1280,height:900}}),p=await c.newPage();let apiHits=0,auth=null;
 await p.route('**/learning-studio/certificate-records.mjs',r=>r.fulfill({status:200,headers:JS,body:fs.readFileSync(root+'/learning-studio/certificate-records.mjs','utf8').replace('CERT_ENDPOINT_ENABLED=false','CERT_ENDPOINT_ENABLED=true')}));
 await p.route('**/learning-studio/certificate-config.mjs',r=>r.fulfill({status:200,headers:JS,body:fs.readFileSync(root+'/learning-studio/certificate-config.mjs','utf8').replace(/CERT_API_BASE='[^']*'/,'CERT_API_BASE='+(base?JSON.stringify(base):'null'))}));
 await p.route('**/js/auth.js',r=>r.fulfill({status:200,headers:JS,body:`let u=${uid?JSON.stringify(uid):'null'};export function getCurrentUser(){return u?{uid:u,getIdToken:async()=>"tok"}:null};export async function getUserProfile(){return {name:${JSON.stringify(name)}}};window.__sw=x=>{u=x}`}));
 await p.route('https://cert-api.test/api/certificates',async r=>{apiHits++;auth=r.request().headers().authorization;if(switchTo!==undefined)await p.evaluate(x=>window.__sw(x),switchTo);
  if(fetchMode==='fail')return r.fulfill({status:500,body:'x'});r.fulfill({status:200,headers:{'content-type':'application/json'},body:JSON.stringify(body||{certificates:[rec]})})});
 await p.goto(L+'/learning-studio/certificate.html?id='+id+(query||''));
 await p.waitForFunction(()=>!document.getElementById('certNone').hidden||!document.getElementById('certCanvas').hidden);
 const r={shown:!(await p.locator('#certCanvas').isHidden()),none:await p.textContent('#certNone'),noneVisible:!(await p.locator('#certNone').isHidden()),apiHits,auth,p,c};return r}
try{
 // real record selected by id through the adapter
 let r=await scenario({});assert(r.shown,'valid record renders');assert.equal(r.auth,'Bearer tok');assert.equal(r.apiHits,1);
 assert.equal((await r.p.textContent('#certNote')).trim(),'','no demo note on a real record');
 const info=await r.p.evaluate(()=>document.getElementById('certActions').hidden);assert.equal(info,false);await r.p.screenshot({path:out+'/real-record-page.png'});await r.c.close();
 // unknown id
 r=await scenario({id:'NOPE-0000'});assert(!r.shown&&r.noneVisible);assert.match(r.none,/لا توجد شهادة بهذا المعرّف/);await r.c.close();
 // data in the URL is never trusted
 r=await scenario({id:'NOPE-0000',query:'&name=X&lang=python&date=2026-01-01&certId=FIXTURE-JAVA-1'});assert(!r.shown,'url data cannot create a record');await r.c.close();
 // account switched while loading
 r=await scenario({switchTo:'u2'});assert(!r.shown&&r.noneVisible);await r.c.close();
 // endpoint not configured: error state, not empty, no request
 r=await scenario({base:null});assert(!r.shown);assert.match(r.none,/تعذر تحميل/);assert.doesNotMatch(r.none,/لا توجد/);assert.equal(r.apiHits,0);await r.c.close();
 // signed out
 r=await scenario({uid:null});assert(!r.shown);assert.match(r.none,/سجّلي الدخول/);assert.equal(r.apiHits,0);await r.c.close();
 // server error: can't load, not "no certificate"
 r=await scenario({fetchMode:'fail'});assert(!r.shown);assert.match(r.none,/تعذر تحميل/);assert.doesNotMatch(r.none,/لا توجد/);await r.c.close();
 // invalid record (code tasks unverified) rejects whole response
 r=await scenario({body:{certificates:[{...rec,codeTasksVerified:false}]}});assert(!r.shown);assert.match(r.none,/تعذر تحميل/);await r.c.close();
 // loading button state: hold the download and capture contrast
 const c=await b.newContext({viewport:{width:1280,height:900}}),p=await c.newPage();
 await p.goto(L+'/learning-studio/certificate.html?demo=1');await p.waitForSelector('#certCanvas:not([hidden])');
 await p.evaluate(()=>{const o=URL.createObjectURL;window.__hold=1;document.getElementById('certPdf').addEventListener('click',()=>{},{capture:true})});
 await p.evaluate(()=>{const b=document.getElementById('certPdf');b.disabled=true;b.textContent='جاري تجهيز الملف...'}); // state the handler sets while busy
 const cs=await p.evaluate(()=>{const s=getComputedStyle(document.getElementById('certPdf'));return [s.backgroundColor,s.color,s.opacity]});
 const lum=c=>{const v=c.match(/\d+/g).slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4});return .2126*v[0]+.7152*v[1]+.0722*v[2]};
 const ratio=(lum(cs[0])>lum(cs[1])?lum(cs[0])+.05:lum(cs[1])+.05)/(Math.min(lum(cs[0]),lum(cs[1]))+.05);assert(ratio>=7,'disabled button contrast '+ratio.toFixed(1));assert.equal(cs[2],'1');
 await p.locator('.cert-actions').screenshot({path:out+'/button-loading.png'});console.log('loading button contrast',ratio.toFixed(1));await c.close();
 console.log('certificate real-record browser regression ok');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
