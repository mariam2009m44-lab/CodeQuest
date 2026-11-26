// Python quiz code tasks run in the browser (Pyodide) without the server runner. Fixture: static server, stubbed sign-in, Pyodide files served from the local npm package through a route (skipped when the package is not installed). The server runner endpoint must receive ZERO calls.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
let pyDir;try{pyDir=path.dirname(require.resolve('pyodide/package.json'))}catch{try{pyDir=path.dirname(require.resolve('/tmp/pyo/node_modules/pyodide/package.json'))}catch{console.log('SKIP python-in-browser: pyodide npm package not installed');process.exit(0)}}
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const quiz=JSON.parse(fs.readFileSync(path.join(root,'learning-studio/quizzes.json'),'utf8'))['python-1'];const item=quiz.code[0];
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{const d=fs.readFileSync(f);s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(d)}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
let serverCalls=0;
async function attempt(code,{cdn=true}={}){const c=await b.newContext({viewport:{width:390,height:844}});
 await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='localhost'){if(u.pathname==='/__local_verify'){serverCalls++;return r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,stdout:item.tests[0].expected})})}return r.continue()}
  if(/firebase|auth\.js/.test(u.href))return r.fulfill({contentType:'text/javascript',body:''});
  if(cdn&&u.hostname==='cdn.jsdelivr.net'&&u.pathname.startsWith('/pyodide/v314.0.8/full/')){const f=path.join(pyDir,u.pathname.split('/').pop());if(!fs.existsSync(f))return r.fulfill({status:404,body:''});return r.fulfill({body:fs.readFileSync(f),headers:{'access-control-allow-origin':'*','content-type':f.endsWith('.wasm')?'application/wasm':f.endsWith('.js')||f.endsWith('.mjs')?'text/javascript':'application/octet-stream'}})}
  r.abort()});
 const p=await c.newPage();await p.goto(L+'/learning-studio/quiz.html?lang=python&unit=1');await p.waitForSelector('.quiz-code');
 const it=p.locator('.quiz-item').nth(quiz.mcq.length);await it.locator('.quiz-code').fill(code);await it.locator('button.primary').click();
 await p.waitForFunction(()=>{const fb=[...document.querySelectorAll('.quiz-code')].pop().parentElement.querySelectorAll('.bubble.reply');const t=fb[fb.length-1];return t&&!t.hidden&&t.textContent&&t.textContent!=='بنصحح...'},null,{timeout:70000});
 const fb=await p.evaluate(()=>{const f=[...document.querySelectorAll('.quiz-code')].pop().parentElement.querySelectorAll('.bubble.reply');return f[f.length-1].textContent});await c.close();return fb}
const ok=await attempt(item.reference);assert.ok(ok.replace(/[\u2060\u200f\u200e]/g,"").includes("الناتج مطابق في كل"),ok);
const syn=await attempt('Iet x = 1');assert.match(syn,/اتحسبت غلط/,syn);assert.match(syn,/SyntaxError/,syn);
const wrong=await attempt('print(0)');assert.match(wrong,/الناتج مش مطابق/,wrong);
assert.equal(serverCalls,0,'server runner must not be called when Pyodide loads');
const loop=await attempt('while True:\n    pass');assert.match(loop,/وقت طويل|اتحسبت غلط/,loop);
// Fallback: CDN blocked -> server runner answers (counted), page still grades
const fall=await attempt(item.reference,{cdn:false});assert.match(fall,/الناتج مطابق في كل/,fall);assert.ok(serverCalls>=1,'fallback used the server runner');
await b.close();srv.close();console.log('python quiz in browser (Pyodide fixture), student errors, timeout kill, fallback ok')})().catch(e=>{console.error(String(e.stack||e).slice(0,500));process.exit(1)});
