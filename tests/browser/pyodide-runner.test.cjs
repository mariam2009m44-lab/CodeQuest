// Experimental in-browser Python (default OFF). Proves: correct results, no network from learner code, 4 s kill, loading message.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.wasm':'application/wasm','.zip':'application/zip','.png':'image/png'};
const cases=[
 ['print("hi")','hi'],['x=3\nprint(x*2)','6'],['for i in range(3):\n    print(i)','0\n1\n2'],
 ['print(sum([1,2,3,4]))','10'],['def f(a):\n    return a+1\nprint(f(4))','5'],['print("a"+"b")','ab'],
 ['d={"k":2}\nprint(d["k"])','2'],['print(len("كودي"))','4']];
(async()=>{let external=[];
 const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('')}});
 await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
 try{const c=await b.newContext();await c.route(u=>!u.hostname.includes('localhost')&&u.protocol.startsWith('http'),r=>{external.push(r.request().url());r.abort()});
  const p=await c.newPage();await p.goto(L+'/learning-studio/index.html');
  const res=await p.evaluate(async([cases,probes])=>{const {runPython}=await import('/learning-studio/py-sandbox.mjs');let loading=0;const out=[];
   for(const [code] of cases)out.push(await runPython(code,{onLoading:()=>loading++}));
   const pr={};for(const [k,v] of Object.entries(probes))pr[k]=await runPython(v);
   const t0=Date.now();const loop=await runPython('while True:\n    pass');const dt=Date.now()-t0;
   const after=await runPython('print("again")');
   return {out,pr,loading,loop,dt,after}},[cases,{
   fetch:"import js\nasync def f():\n    try:\n        await js.fetch('https://example.com/probe-fetch')\n        print('FETCH-OK')\n    except Exception:\n        print('fetch blocked')\nawait f()",
   xhr:"import js\ntry:\n    x=js.XMLHttpRequest.new()\n    x.open('GET','https://example.com/probe-xhr',False)\n    x.send()\n    print('XHR-OK',x.status)\nexcept Exception:\n    print('xhr blocked')",
   imp:"import js\ntry:\n    js.importScripts('https://example.com/probe-import.js')\n    print('IMPORT-OK')\nexcept Exception:\n    print('import blocked')"}]);
  cases.forEach(([,want],i)=>{assert.equal(res.out[i].ok,true,'case '+i+' ran');assert.equal(res.out[i].stdout.trim(),want,'case '+i)});
  assert.equal(res.loading,1,'loading callback fires once, on first run only');
  for(const k of ['fetch','xhr','imp']){const o=res.pr[k];assert(!/OK/.test(o.stdout||''),k+' must not succeed: '+JSON.stringify(o))}
  assert.equal(res.loop.ok,false);assert(res.dt<8000,'loop stopped near 4 s: '+res.dt);assert.equal(res.after.stdout.trim(),'again','runner recovers after a kill');
  assert.deepEqual(external,[],'no request to any external host: '+external.join(','));
  console.log('pyodide runner ok');
 }finally{await b.close();srv.close()}
})().catch(e=>{console.error(e);process.exit(1)});
