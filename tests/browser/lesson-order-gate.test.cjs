// Order gate on the lesson page: a later lesson opened by URL or from the lesson list is blocked until the earlier lesson tests are passed (and the previous unit exam, across units). Fixtures: stored passes under the anonymous localhost account; ?gate=1 turns the gate on for localhost.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const units=JSON.parse(fs.readFileSync(root+'/learning-studio/units.json','utf8'));
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end()}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
const pass=(lang,unit,n)=>Object.fromEntries(units.find(u=>u.language===lang&&u.unit===unit).lessons.slice(0,n).map(l=>['codequest_studio_lessontest_anon_'+lang+'_'+l.id,JSON.stringify({passed:true,percent:100})]));
const go=async(lang,unit,idx,seed,gate=true)=>{const c=await b.newContext({viewport:{width:390,height:844}});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());const p=await c.newPage();p.on('pageerror',e=>console.log('PE',e.message.slice(0,100)));
 await p.goto(L+'/learning-studio/index.html');await p.evaluate(s=>{for(const [k,v] of Object.entries(s))localStorage.setItem(k,v)},seed);
 const lid=units.find(u=>u.language===lang&&u.unit===unit).lessons[idx].id;
 await p.goto(L+'/learning-studio/index.html?lang='+lang+'&unit='+unit+'&lesson='+lid+(gate?'&gate=1':''),{waitUntil:'load'}).catch(()=>{});await p.waitForTimeout(900);
 return {c,p,lid,url:p.url()}};
try{
for(const lang of ['python','javascript','cpp','java']){
 let o=await go(lang,1,0,{});assert.match(o.url,/learning-studio\/index\.html/,lang+' lesson 1 always opens');assert.equal(await o.p.evaluate(()=>document.querySelectorAll('#lessons button:disabled').length),units.find(u=>u.language===lang&&u.unit===1).lessons.length-1,lang+' list: only lesson 1 enabled');if(lang==='python')await o.p.screenshot({path:'/tmp/lessonlist.png'});await o.c.close();
 const k=Math.min(2,units.find(u=>u.language===lang&&u.unit===1).lessons.length-1);o=await go(lang,1,k,{});assert.match(o.url,/course-path\.html\?lang=/,lang+' lesson 3 by URL goes to the map: '+o.url);await o.c.close();
 o=await go(lang,1,k,pass(lang,1,k));assert.match(o.url,/learning-studio\/index\.html/,lang+' lesson 3 opens after lessons 1-2 are passed');const dis=await o.p.evaluate(()=>[...document.querySelectorAll('#lessons button')].map(x=>x.disabled));assert.deepEqual(dis.slice(0,k+1),Array(k+1).fill(false));if(dis.length>k+1)assert.equal(dis[k+1],true,lang+' next lesson still locked');await o.c.close();
 o=await go(lang,1,k,{},false);assert.match(o.url,/learning-studio\/index\.html/,lang+' fixture bypass');await o.c.close();
}
// across units: unit 2 lesson 1 needs the unit 1 exam
{const lang='python',n=units.find(u=>u.language===lang&&u.unit===1).lessons.length;let o=await go(lang,2,0,pass(lang,1,n));assert.match(o.url,/course-path\.html/,'unit 2 closed without unit 1 exam');await o.c.close();
 o=await go(lang,2,0,{...pass(lang,1,n),codequest_studio_quiz_anon_python_1:JSON.stringify({passed:true})});assert.match(o.url,/learning-studio\/index\.html/,'unit 2 opens after exam');await o.c.close()}
console.log('lesson order gate ok (fixtures)')}finally{await b.close();srv.close()}})().catch(e=>{console.error(String(e.stack||e).slice(0,500));process.exit(1)});
