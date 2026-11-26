const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
try{

 async function open(uid,seed,{shot}={}){const c=await b.newContext({viewport:{width:390,height:844}});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
  await c.route('**/js/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const requireUser=async()=>({uid:${JSON.stringify(uid)}});export const getLessonProgress=async()=>[];export const getUserProfile=async()=>({xp:0,stars:0});`}));
  const p=await c.newPage();await p.addInitScript(()=>{sessionStorage.setItem('cq_cody_intro_'+(window.__u||'u1')+'_javascript','1');sessionStorage.setItem('cq_cody_intro_u2_javascript','1')});await p.goto(L+'/learning-studio/index.html');await p.evaluate(s=>{for(const [k,v] of Object.entries(s))localStorage.setItem(k,v)},seed);
  await p.goto(L+'/course-path.html?lang=javascript');p.on('pageerror',e=>console.log('PE',e.message));p.on('console',m=>m.type()==='error'&&console.log('CE',m.text().slice(0,150)));await p.waitForSelector('.cw-road-node',{timeout:8000});
  const r=await p.evaluate(()=>({needs:!!document.querySelector('.cw-road-node.needs-test'),href:document.querySelector('.cw-road-node.is-current .cw-node')?.dataset.href||null,sub:document.querySelector('.cw-road-node.is-current .cw-node-sub')?.textContent||'',just:!!document.querySelector('.cw-road-node.just-done'),burst:document.querySelectorAll('.cw-burst i').length,arrive:!!document.querySelector('.cw-road-node.cody-arrives'),speech:document.getElementById('cwSpeech')?.textContent||'',flag:localStorage.getItem('cq_map_celebrate'),done:document.querySelectorAll('.cw-road-node.is-done').length}));
  if(shot){await p.waitForTimeout(shot.wait||300);await p.screenshot({path:shot.path})}
  await c.close();return r}
 const pend=(uid)=>({cq_lt_pending:JSON.stringify({lessonId:'js_ch1_l1',language:'javascript',unit:1,index:0,uid,fromMap:true})});
 const a=await open('u1',pend('u1'),{shot:{path:process.env.SHOT_PENDING||'/tmp/map-pending.png'}});
 assert.equal(a.needs,true,'finished chat, test pending: node says so');assert.match(a.href,/lesson-test\.html\?lang=javascript&lesson=js_ch1_l1/);assert.match(a.sub,/الاختبار/);assert.match(a.speech,/اختبار/);
 const other=await open('u2',pend('u1'));assert.equal(other.needs,false,'another account never inherits the pending test');assert.match(other.href,/learning/);
 const pass=JSON.stringify({passed:true,score:4,total:4});
 const cel=(uid)=>({'codequest_studio_lessontest_u1_javascript_js_ch1_l1':pass,cq_map_celebrate:JSON.stringify({uid,language:'javascript',unit:1,index:0,at:Date.now()})});
 const c1=await open('u1',cel('u1'),{shot:{path:process.env.SHOT_CELEBRATE||'/tmp/map-celebrate.png',wait:700}});
 assert.equal(c1.just,true,'celebration plays for the just-completed lesson');assert.ok(c1.burst>=10);assert.equal(c1.arrive,true);assert.match(c1.speech,/عاشت/);assert.equal(c1.flag,null,'celebration is consumed once');assert.equal(c1.done,1);
 const c2=await open('u2',{'codequest_studio_lessontest_u2_javascript_js_ch1_l1':pass,cq_map_celebrate:JSON.stringify({uid:'u1',language:'javascript',unit:1,index:0,at:Date.now()})});
 assert.equal(c2.just,false,'another account never sees the celebration');
 const stale=await open('u1',{'codequest_studio_lessontest_u1_javascript_js_ch1_l1':pass,cq_map_celebrate:JSON.stringify({uid:'u1',language:'javascript',unit:1,index:0,at:Date.now()-3600000})});
 assert.equal(stale.just,false,'an old celebration flag is ignored');
 const none=await open('u1',{});assert.equal(none.just,false);assert.equal(none.needs,false);assert.match(none.sub,/ابدأ هنا/);
 console.log('map test-pending + celebration ok');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
