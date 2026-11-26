// A first pass of a lesson test sets the map celebration even when the lesson was not opened from the map, and the primary result button goes to the map. A fail or a repeat pass does not. Fixtures: real lesson-test page, localhost uid.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css'};
const bank=JSON.parse(fs.readFileSync(root+'/learning-studio/lesson-tests.json','utf8'))['py-1-1'];
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end()}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
try{
const c=await b.newContext({viewport:{width:390,height:900}});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());const p=await c.newPage();
async function take(url,nright){await p.goto(L+url);await p.waitForSelector('#ltBody .choices button');
 for(let i=0;i<4;i++){const want=bank[i].options[bank[i].answer];const bs=p.locator('#ltBody .choices button');const n=await bs.count();let t;for(let k=0;k<n;k++){const x=(await bs.nth(k).innerText()).trim();if(i<nright?x===want:x!==want){t=bs.nth(k);break}}await t.click();await p.locator('#ltBody button.primary').click()}
 await p.waitForSelector('#ltResult:not([hidden])');return p.evaluate(()=>({flag:localStorage.getItem('cq_map_celebrate'),first:document.querySelector('#ltResult .lt-actions a')?.getAttribute('href')||'',firstText:document.querySelector('#ltResult .lt-actions a')?.textContent||'',links:[...document.querySelectorAll('#ltResult .lt-actions a')].map(a=>a.textContent)}))}
const u='/learning-studio/lesson-test.html?lang=python&lesson=py-1-1&uid=u1';
const f=await take(u,1);assert.equal(f.flag,null,'fail sets no celebration');
const ok=await take(u+'&retake=1',2);const j=JSON.parse(ok.flag);assert.equal(j.uid,'u1');assert.equal(j.language,'python');assert.equal(j.unit,1);assert.equal(j.index,0);
assert.match(ok.first,/course-path\.html\?lang=python/,'primary goes to the map: '+ok.first);assert.match(ok.firstText,/كودي/);assert.ok(ok.links.some(t=>/التالي/.test(t)),'next lesson still offered: '+ok.links);
await p.evaluate(()=>localStorage.removeItem('cq_map_celebrate'));
const again=await take(u+'&retake=1',4);assert.equal(again.flag,null,'a repeat pass does not celebrate again');
console.log('lesson test celebration flag ok (fixture)')}finally{await b.close();srv.close()}})().catch(e=>{console.error(String(e.stack||e).slice(0,500));process.exit(1)});
