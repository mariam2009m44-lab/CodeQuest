const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const assert=require('assert/strict');const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
(async()=>{const srv=http.createServer((q,s)=>{
 if(q.method==='POST'&&q.url==='/__local_verify'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{const j=JSON.parse(b);const r=spawnSync('python3',['-c',j.code],{encoding:'utf8',timeout:8000});setTimeout(()=>{s.writeHead(200,{'content-type':'application/json'});s.end(JSON.stringify({ok:r.status===0,stdout:r.stdout,stderr:r.stderr,message:r.stderr}))},900)});return}
 const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
// Slow executor (900 ms): a run that is still in flight must not mark an edited, unsubmitted answer as passed, and a stale result must not advance the lesson.
const units=JSON.parse(fs.readFileSync(path.join(root,'learning-studio/units.json'),'utf8'));
const lesson=units.find(x=>x.language==='python'&&x.unit===2).lessons[3];const pr=lesson.steps.find(s=>s.type==='practice'),pred=lesson.steps.find(s=>s.type==='prediction');
const p=await b.newPage({viewport:{width:390,height:844}});p.setDefaultTimeout(8000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(L+'/learning.html?from=map&lang=python&unit=2&index=3');await p.waitForSelector('#dialogue .chatlog');
for(const [k,t] of lesson.dialogue.entries()){await p.locator('#dialogue .choices button').nth(t.options.findIndex(o=>o.fit)).click();await p.waitForTimeout(150)}
await p.locator('#question button').nth(pred.correctIndex).click();await p.click('#runWorked');await p.waitForFunction(()=>/٣/.test(document.getElementById('stageLabel').textContent));
const stage=()=>p.evaluate(()=>document.getElementById('stageLabel').textContent);
await p.waitForFunction(()=>!document.getElementById('run').disabled);
// 1. wrong code submitted, learner edits to the correct answer while the run is in flight, never presses run again
await p.fill('#code','print("5")');await p.click('#run');await p.fill('#code',pr.referenceSolution);
await p.waitForFunction(()=>!document.getElementById('run').disabled);await p.waitForTimeout(300);
assert.match(await stage(),/٣/,'in-flight wrong run + unsubmitted edit does not advance');
// 2. submitting the correct code does advance
await p.click('#run');await p.waitForFunction(()=>/٤/.test(document.getElementById('stageLabel').textContent));
// 3. leaving the lesson mid-run (lesson list visible, no from=map): the stale result must not touch the next lesson
const q=await b.newPage({viewport:{width:390,height:844}});q.setDefaultTimeout(8000);const qerrs=[];q.on('pageerror',e=>qerrs.push(e.message));
await q.goto(L+'/learning.html?lang=python&unit=2&index=3');await q.waitForSelector('#dialogue .chatlog');
for(const t of lesson.dialogue){await q.locator('#dialogue .choices button').nth(t.options.findIndex(o=>o.fit)).click();await q.waitForTimeout(150)}
await q.locator('#question button').nth(pred.correctIndex).click();await q.click('#runWorked');await q.waitForFunction(()=>/٣/.test(document.getElementById('stageLabel').textContent));await q.waitForFunction(()=>!document.getElementById('run').disabled);
await q.fill('#code',pr.referenceSolution);await q.click('#run');
await q.locator('#lessons button').first().click();await q.waitForTimeout(1500);
assert.match(await q.evaluate(()=>document.getElementById('stageLabel').textContent),/١/,'next lesson starts at its first stage');
assert.equal(await q.evaluate(()=>document.getElementById('output').textContent.trim()),'لم تشغّل الكود بعد.','stale output not shown in next lesson');
assert.deepEqual(qerrs,[]);
assert.deepEqual(errs,[]);
console.log('run race ok');
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
