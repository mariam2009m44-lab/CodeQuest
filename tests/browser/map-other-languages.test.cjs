// Unit projects: page + map entry. Grading runs REAL python3 through a local stand-in for the execution endpoint; sign-in is stubbed (?uid=).
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const REF=JSON.parse(fs.readFileSync(path.join(root,'tests/content/project-references.json'),'utf8'));
(async()=>{const srv=http.createServer((q,s)=>{
 if(q.method==='POST'&&q.url==='/__local_verify'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{const j=JSON.parse(b);const r=spawnSync('python3',['-c',j.code],{encoding:'utf8',timeout:8000});s.writeHead(200,{'content-type':'application/json'});s.end(JSON.stringify({ok:r.status===0,stdout:r.stdout,stderr:r.stderr,message:r.stderr}))});return}
 const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();


// JS / C++ / Java maps: walk every node in order on the real map page (stubbed sign-in + records). Each node must be the one current node, enabled, and navigate; the next node stays locked.
const lessonCount={};const QZ=JSON.parse(fs.readFileSync(path.join(root,'learning-studio/quizzes.json'),'utf8'));
for(const lang of ['javascript','cpp','java']){
 const open=async(done,passUnits=[])=>{const c=await b.newContext({viewport:{width:390,height:844}});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
  await c.route('**/js/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const requireUser=async()=>({uid:'u1'});export const getLessonProgress=async()=>${JSON.stringify(done)};export const getUserProfile=async()=>({xp:0,stars:0});`}));
  const p=await c.newPage();p.on('pageerror',e=>console.log('PAGEERR',lang,e.message.slice(0,80)));await p.addInitScript(([l,pu])=>{sessionStorage.setItem('cq_cody_intro_u1_'+l,'1');for(const u of pu)localStorage.setItem('codequest_studio_quiz_u1_'+l+'_'+u,JSON.stringify({percent:80,passed:true}))},[lang,passUnits]);await p.goto(L+'/course-path.html?lang='+lang);await p.waitForSelector('.cw-unit');await p.waitForTimeout(400);return {c,p}};
 const {c:c0,p:p0}=await open([]);const nodes=await p0.evaluate(()=>[...document.querySelectorAll('.cw-road-node')].map(n=>[+n.dataset.ci,+n.dataset.li]));await c0.close();
 lessonCount[lang]=nodes.length;const chapters=Math.max(...nodes.map(n=>n[0]))+1;const quizUnits=Object.keys(QZ).filter(k=>k.startsWith(lang+'-')).length;assert.ok(chapters<=quizUnits,lang+' map chapters '+chapters+' have a unit exam each ('+quizUnits+')');
 for(let k=0;k<nodes.length;k++){
  const done=nodes.slice(0,k).map(([ci,li])=>({chapter:ci,lesson:li,completed:true}));
  const passUnits=Array.from({length:nodes[k][0]},(_,i)=>i+1);const {c,p}=await open(done,passUnits);
  const info=await p.evaluate(([cur,nxt])=>{const q=a=>a&&document.querySelector(`.cw-road-node[data-ci="${a[0]}"][data-li="${a[1]}"]`);const n=q(cur),m=q(nxt);return {cls:n.className,dis:n.querySelector('button').disabled,nCur:document.querySelectorAll('.cw-road-node.is-current').length,nextCls:m?m.className:null}},[nodes[k],nodes[k+1]||null]);
  assert.match(info.cls,/is-current/,lang+' node '+k+' current: '+info.cls);assert.equal(info.dis,false,lang+' node '+k+' enabled');assert.equal(info.nCur,1,lang+' exactly one current node at '+k);
  if(info.nextCls)assert.match(info.nextCls,/is-locked/,lang+' node '+(k+1)+' locked before '+k+' is done');
  if(k%7===0||k===nodes.length-1){await p.locator(`.cw-road-node[data-ci="${nodes[k][0]}"][data-li="${nodes[k][1]}"] button`).click();await p.waitForURL(/learning\.html/,{timeout:6000})}
  await c.close()}
 {const ch=[...new Set(nodes.map(n=>n[0]))];for(const ci of ch.slice(1,3)){const done=nodes.filter(n=>n[0]<ci).map(([a,l])=>({chapter:a,lesson:l,completed:true}));const {c,p}=await open(done,Array.from({length:ci-1},(_,i)=>i+1));const g=await p.evaluate(()=>{const a=document.getElementById('cwExamGate');const n=document.querySelector('.cw-road-node.is-current');return {href:a?a.getAttribute('href'):null,cur:!!n}});assert.equal(g.cur,false,lang+' unit '+(ci+1)+' locked until unit '+ci+' exam is passed');assert.ok(g.href&&g.href.includes('lang='+lang)&&g.href.includes('unit='+ci),lang+' gate link: '+g.href);await c.close()}}
 {const n0=nodes.filter(n=>n[0]===0).map(([a,l])=>({chapter:a,lesson:l,completed:true}));for(const pass of [false,true]){const {c,p}=await open(n0,pass?[1]:[]);const foot=await p.evaluate(()=>document.querySelectorAll('.cw-unit-foot')[0].textContent);if(pass)assert.match(foot,/أنهيت الوحدة بنجاح/,lang+foot);else{assert.match(foot,/باقي امتحان الوحدة/,lang+foot);assert.doesNotMatch(foot,/أحسنت/,lang+foot)}await c.close()}}
 const {c:c9,p:p9}=await open(nodes.map(([ci,li])=>({chapter:ci,lesson:li,completed:true})),Array.from({length:Math.max(...nodes.map(n=>n[0]))+1},(_,i)=>i+1));const fin=await p9.evaluate(()=>({cur:document.querySelectorAll('.cw-road-node.is-current').length,done:document.querySelectorAll('.cw-road-node.is-done').length,all:document.querySelectorAll('.cw-road-node').length}));assert.equal(fin.done,fin.all,lang+' all done');await c9.close();
 console.log('ok',lang,nodes.length,'nodes');
}
console.log('other-language map navigation ok (stubbed records)',JSON.stringify(lessonCount));
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
