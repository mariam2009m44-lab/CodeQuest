const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const assert=require('assert/strict');const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
(async()=>{const srv=http.createServer((q,s)=>{
 if(q.method==='POST'&&q.url==='/__local_verify'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{const j=JSON.parse(b);const r=spawnSync('python3',['-c',j.code],{encoding:'utf8',timeout:8000});s.writeHead(200,{'content-type':'application/json'});s.end(JSON.stringify({ok:r.status===0,stdout:r.stdout,stderr:r.stderr,message:r.stderr}))});return}
 const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
const units=JSON.parse(fs.readFileSync(path.join(root,'learning-studio/units.json'),'utf8'));
// The opening line of every lesson appears once (as Cody's first chat bubble), not also as a separate story box.
for(const [lang,unit,index] of [['python',1,0],['python',5,2],['javascript',1,0],['cpp',1,1],['java',1,0]]){
 const p=await b.newPage({viewport:{width:390,height:844}});await p.goto(L+`/learning.html?from=map&lang=${lang}&unit=${unit}&index=${index}`);await p.waitForSelector('#dialogue .chatlog');
 const l=units.find(x=>x.language===lang&&x.unit===unit).lessons[index];
 assert.equal(await p.locator('#story').isVisible(),false,lang+' story box hidden when chat is shown');
 const n=await p.evaluate(s=>{const N=t=>t.replace(/[\u200e\u200f\u2060]/g,'').trim();return [...document.querySelectorAll('main *')].filter(e=>e.offsetParent&&N(e.textContent).includes(N(s))&&![...e.children].some(c=>N(c.textContent).includes(N(s)))).length},l.story);
 assert.equal(n,1,lang+' opening line shown once, got '+n);
 if(lang==='python'&&unit===1)await p.screenshot({path:process.env.SHOT||'/tmp/story-once.png'});
 await p.close()}
console.log('story once ok');
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
