// A real student error (syntax error) in a quiz code task is graded wrong with the error shown, not reported as "service unavailable / not graded". Fixture: static server, stubbed sign-in, real browser JS sandbox.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const assert=require('assert/strict');const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
const c=await b.newContext({viewport:{width:390,height:844}});await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='localhost')return r.continue();if(/firebase|auth\.js/.test(u.href))return r.fulfill({contentType:'text/javascript',body:''});r.abort()});
async function attempt(code){const p=await c.newPage();await p.goto(L+'/learning-studio/quiz.html?lang=javascript&unit=2');await p.waitForSelector('.quiz-code');
 await p.fill('.quiz-code',code);await p.click('button.primary:has-text("سلّم")');await p.waitForFunction(()=>{const t=document.querySelector('.quiz-code').closest('*').parentElement.querySelector('.bubble.reply:last-of-type');return true});await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>{const ta=document.querySelector('.quiz-code');const card=ta.parentElement;const fb=[...card.querySelectorAll('.bubble.reply')].pop();return {fb:fb.textContent,hidden:fb.hidden,locked:ta.readOnly,btn:card.querySelector('button.primary').disabled}});
 if(process.env.SHOT){await p.screenshot({path:process.env.SHOT+'-'+(code.startsWith('Iet')?'syntax':code.startsWith('let')?'ok':'other')+'.png',fullPage:true})}await p.close();return r}
const syn=await attempt('Iet doorOpen = true;\nconsole.log(7 / 2);');
assert.ok(/SyntaxError/.test(syn.fb),syn.fb);assert.ok(!/الخدمة مش متاحة/.test(syn.fb),syn.fb);assert.ok(/اتحسبت غلط/.test(syn.fb),syn.fb);assert.equal(syn.locked,true);assert.equal(syn.btn,true);
const wrong=await attempt('let doorOpen = true;\nconsole.log(7 / 2);');assert.ok(/الناتج مش مطابق/.test(wrong.fb),wrong.fb);assert.ok(!/اتحسبت غلط|الخدمة/.test(wrong.fb));
const ok=await attempt('let doorOpen = true;\nconsole.log(doorOpen);\nconsole.log(5 > 7);');assert.ok(/^صح\./.test(ok.fb),ok.fb);
await b.close();srv.close();console.log('quiz syntax error graded as wrong, real sandbox (fixture) ok')})().catch(e=>{console.error(e.message||e);process.exit(1)});
