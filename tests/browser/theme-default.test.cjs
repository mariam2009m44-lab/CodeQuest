const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const assert=require('assert/strict');const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
(async()=>{const srv=http.createServer((q,s)=>{
 if(q.method==='POST'&&q.url==='/__local_verify'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{const j=JSON.parse(b);const r=spawnSync('python3',['-c',j.code],{encoding:'utf8',timeout:8000});s.writeHead(200,{'content-type':'application/json'});s.end(JSON.stringify({ok:r.status===0,stdout:r.stdout,stderr:r.stderr,message:r.stderr}))});return}
 const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
// Default is the platform dark theme even when the device prefers light; a saved choice persists across reload.
for(const url of ['/learning.html?from=map&lang=python&unit=1&index=0','/learning-studio/quiz.html?lang=python&unit=1','/learning-studio/project.html?project=py-p1&uid=u1']){
 const c=await b.newContext({viewport:{width:390,height:844},colorScheme:'light'});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());const p=await c.newPage();await p.goto(L+url);await p.waitForSelector('#themeToggle');
 assert.equal(await p.evaluate(()=>document.documentElement.dataset.theme),'dark',url+' default dark under light device');
 assert.equal(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(9, 15, 37)',url+' navy background');
 await p.click('#themeToggle');assert.equal(await p.evaluate(()=>document.documentElement.dataset.theme),'light');
 await p.reload();await p.waitForSelector('#themeToggle');assert.equal(await p.evaluate(()=>document.documentElement.dataset.theme),'light',url+' saved light persists');
 await p.click('#themeToggle');await p.reload();await p.waitForSelector('#themeToggle');assert.equal(await p.evaluate(()=>document.documentElement.dataset.theme),'dark',url+' saved dark persists');
 await c.close()}
console.log('theme default ok');
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
