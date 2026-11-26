const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const assert=require('assert/strict');const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
(async()=>{const srv=http.createServer((q,s)=>{
 if(q.method==='POST'&&q.url==='/__local_verify'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{const j=JSON.parse(b);const r=spawnSync('python3',['-c',j.code],{encoding:'utf8',timeout:8000});s.writeHead(200,{'content-type':'application/json'});s.end(JSON.stringify({ok:r.status===0,stdout:r.stdout,stderr:r.stderr,message:r.stderr}))});return}
 const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
// Walks Python lessons end to end with correct answers (real python3 behind a stand-in, stubbed sign-in) and expects the completion state with no page errors.
const units=JSON.parse(fs.readFileSync(path.join(root,'learning-studio/units.json'),'utf8')),expl=JSON.parse(fs.readFileSync(path.join(root,'learning-studio/explanations.json'),'utf8'));
const from=+(process.env.FROM_UNIT||1),to=+(process.env.TO_UNIT||12);let n=0;const bad=[];
for(const pack of units.filter(x=>x.language==='python'&&x.unit>=from&&x.unit<=to))for(const [index,lesson] of pack.lessons.entries()){
 const p=await b.newPage({viewport:{width:390,height:844}});p.setDefaultTimeout(5000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
 try{await p.goto(L+`/learning.html?from=map&lang=python&unit=${pack.unit}&index=${index}`);await p.waitForSelector('#dialogue .chatlog');
  for(const t of lesson.dialogue){const o=t.options.find(o=>o.fit);const k=t.options.indexOf(o);await p.locator('#dialogue .choices button').nth(k).click();await p.waitForTimeout(150)}
  const pred=lesson.steps.find(s=>s.type==='prediction');await p.locator('#question button').nth(pred.correctIndex).click();
  await p.click('#runWorked');
  const pr=lesson.steps.find(s=>s.type==='practice');await p.fill('#code',pr.referenceSolution);await p.click('#run');
  await p.locator('#question button').nth(expl[lesson.id].answer).click();
  const tr=lesson.steps.find(s=>s.type==='transfer');await p.fill('#code',tr.referenceSolution);await p.click('#run');
  await p.waitForFunction(()=>/اكتملت/.test(document.getElementById('stageLabel').textContent));n++;
 }catch(e){bad.push(lesson.id+': '+e.message.split('\n')[0].slice(0,80))}
 if(errs.length)bad.push(lesson.id+' pageerror '+errs[0].slice(0,60));await p.close()}
assert.deepEqual(bad,[],'lessons that did not complete');
console.log('walked',n,'python lessons to completion');
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
