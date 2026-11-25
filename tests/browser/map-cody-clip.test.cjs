// Cody on the current node must be fully visible: not cut by any ancestor's overflow and not covered by the unit header.
// Measured after the arrival/hop animations settle, on mobile and desktop widths, for the pending-test and the plain current-node states.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end()}});
await new Promise(r=>srv.listen(0,r));const L=process.env.BASE||('http://localhost:'+srv.address().port);const b=await chromium.launch();
try{
 async function check(w,h,seed,uid,shot,wait){const c=await b.newContext({viewport:{width:w,height:h}});
  await c.route('**/js/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const requireUser=async()=>({uid:${JSON.stringify(uid)}});export const getLessonProgress=async()=>[];export const getUserProfile=async()=>({xp:0,stars:0});`}));
  const p=await c.newPage();await p.addInitScript(()=>{for(const l of['javascript','python','cpp','java'])sessionStorage.setItem('cq_cody_intro_u1_'+l,'1')});
  await p.goto(L+'/learning-studio/index.html');await p.evaluate(s=>{for(const[k,v]of Object.entries(s))localStorage.setItem(k,v)},seed);
  await p.goto(L+'/course-path.html?lang=javascript');await p.waitForSelector('.cw-road-node.is-current .cw-cody--node');await p.waitForTimeout(wait||2600);
  const r=await p.evaluate(()=>{const cody=document.querySelector('.cw-road-node.is-current .cw-cody--node .cody-character')||document.querySelector('.cw-road-node.is-current .cw-cody--node');const cb=cody.getBoundingClientRect();
   const head=document.querySelector('.cw-unit-head').getBoundingClientRect();let clip=null;for(let e=cody.parentElement;e&&e!==document.body;e=e.parentElement){const o=getComputedStyle(e);if(o.overflow!=='visible'||o.overflowY!=='visible'){const eb=e.getBoundingClientRect();if(cb.top<eb.top-0.5||cb.bottom>eb.bottom+0.5||cb.left<eb.left-0.5||cb.right>eb.right+0.5)clip=e.className}}
   return {top:cb.top,bottom:cb.bottom,headBottom:head.bottom,clip,h:cb.height}});
  if(shot)await p.screenshot({path:shot});await c.close();return r}
 const pend={cq_lt_pending:JSON.stringify({lessonId:'js_ch1_l1',language:'javascript',unit:1,index:0,uid:'u1',fromMap:true})};
 for(const [name,seed] of [['pending',pend],['plain',{}]])for(const [w,h] of [[390,844],[1280,800]]){
  const r=await check(w,h,seed,'u1',process.env.SHOTDIR?process.env.SHOTDIR+'/cody-'+name+'-'+w+'.png':null);
  console.log(name,w,JSON.stringify(r));assert.equal(r.clip,null,name+' '+w+': an ancestor clips Cody ('+r.clip+')');assert.ok(r.top>=r.headBottom-0.5,name+' '+w+': unit header covers Cody (top '+r.top+' < header bottom '+r.headBottom+')');assert.ok(r.h>20)}
 console.log('map cody not clipped ok');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
