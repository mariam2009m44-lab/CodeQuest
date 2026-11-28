// game-bug: pressing an already ruled-out line again is not a new attempt (local page, no network).
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.mjs':'text/javascript'};
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
try{const c=await b.newContext({viewport:{width:390,height:844}});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());const p=await c.newPage();await p.goto(L+'/game-bug.html');
 await p.evaluate(()=>startGame('easy'));
  {const w=await p.evaluate(()=>{const e=document.querySelectorAll('#codeContainer .code-text')[1];const r=document.createRange();r.selectNodeContents(e);const full=r.getBoundingClientRect().width;e.textContent=e.textContent.trim();r.selectNodeContents(e);return [full,r.getBoundingClientRect().width,getComputedStyle(e).whiteSpace]});assert.match(w[2],/^pre/);assert.ok(w[0]>w[1]+15,'leading spaces occupy width (indentation kept)');}
 await p.evaluate(()=>startGame('easy'));
 const lines=p.locator('#codeContainer .line');
 await lines.nth(0).click();await p.waitForTimeout(900);await lines.nth(0).click();await lines.nth(0).click();
 assert.equal((await p.textContent('#attemptStatus')).trim(),'المحاولات: 1','repeat presses are not extra attempts');
 assert.match(await p.textContent('#msg'),/تم اختبار هذا السطر سابقًا/);
 await lines.nth(1).click();assert.equal((await p.textContent('#attemptStatus')).trim(),'المحاولات: 2');
 await p.screenshot({path:process.env.SHOT||'/tmp/bug-repeat.png'});
 await lines.nth(2).click();assert.match(await p.textContent('#msg'),/صحيح/);
 console.log('game-bug repeat attempt ok');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
