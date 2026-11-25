const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const bank=JSON.parse(fs.readFileSync(root+'/learning-studio/lesson-tests.json','utf8'))['py-1-1'];
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end()}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
try{
async function run(uid,nright){const c=await b.newContext({viewport:{width:390,height:900}}),p=await c.newPage();
await p.goto(L+'/learning-studio/index.html');
await p.evaluate(u=>localStorage.setItem('cq_lt_pending',JSON.stringify({lessonId:'py-1-1',language:'python',unit:1,index:0,uid:u,fromMap:true})),uid);
await p.goto(L+'/learning-studio/lesson-test.html?lang=python&lesson=py-1-1');await p.waitForSelector('#ltBody .choices button');
for(let i=0;i<4;i++){const want=bank[i].options[bank[i].answer];const bs=p.locator('#ltBody .choices button');const n=await bs.count();let t;for(let k=0;k<n;k++){const x=(await bs.nth(k).innerText()).trim();if(i<nright?x===want:x!==want){t=bs.nth(k);break}}await t.click();await p.locator('#ltBody button.primary').click()}
await p.waitForSelector('#ltResult:not([hidden])');
const st=await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));await c.close();return st}
const keys=o=>Object.keys(o);
const fail=await run('u1',1);
assert(keys(fail).some(k=>k==='codequest_studio_lessontest_u1_python_py-1-1'),'uid-keyed result');
assert(!keys(fail).some(k=>k.startsWith('codequest_lesson_progress')),'failed test must not record the map node');
assert(fail.cq_lt_pending,'pending stays after fail');
const pass=await run('u1',2);
assert(keys(pass).some(k=>k.startsWith('codequest_lesson_progress_u1_python')),'pass records the map node for uid u1');
assert(!pass.cq_lt_pending,'pending cleared on pass');
assert(!keys(pass).some(k=>k.includes('_u2_')),'no other uid keys');
console.log('lesson-test gate ok');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
