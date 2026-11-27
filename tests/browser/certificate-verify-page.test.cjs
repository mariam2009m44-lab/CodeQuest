const {chromium}=(()=>{try{return require('playwright')}catch{return require('playwright-core')}})(),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg'};
const ID='0123456789abcdef0123456789abcdef';
// The Worker is stubbed (fixture answers). The page must show track and date, never a name, and handle unknown, malformed and failing answers.
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));let d;try{d=fs.readFileSync(f)}catch{s.writeHead(404);return s.end()}s.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});s.end(d)});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;
const b=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}:{});
try{
 const run=async(query,reply)=>{const p=await (await b.newContext()).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));let hit=null;
  await p.route(/workers\.dev/,r=>{hit=r.request().url();r.fulfill(reply)});
  await p.goto(L+(process.env.VP||'/learning-studio/verify.html')+query);await p.waitForFunction(()=>document.getElementById('vfMsg').textContent!=='جاري التحقق...');
  return {text:await p.innerText('#vf'),hit,errs}};
 const ok=await run('?id='+ID,{status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({success:true,valid:true,track:'python',trackName:'Python',issuedAt:'2026-11-27T08:45:00.000Z'})});
 assert(ok.text.includes('شهادة صحيحة')&&ok.text.includes('Python')&&ok.text.includes('27 / 11 / 2026'),ok.text);assert(ok.hit.endsWith('/api/certificates/verify?id='+ID));assert.deepEqual(ok.errs,[]);
 const nf=await run('?id='+'f'.repeat(32),{status:404,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"success":false,"valid":false,"message":"not_found"}'});
 assert(nf.text.includes('لم تُسجَّل للتحقق')&&!nf.text.includes('صحيحة'));
 const bad=await run('?id=zzz',{status:500,body:''});assert.equal(bad.hit,null);assert(bad.text.includes('غير صحيح'));
 const down=await run('?id='+ID,{status:503,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"success":false}'});assert(down.text.includes('تعذر')&&!down.text.includes('صحيحة'));
 console.log('verify page regression ok (stubbed Worker fixtures)');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
