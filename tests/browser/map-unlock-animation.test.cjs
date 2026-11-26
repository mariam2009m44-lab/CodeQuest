// Map celebration after a finished lesson: the next station's lock opens (animated overlay) and Cody travels from the finished station to it, in every language. Fixtures: stubbed sign-in, a stored lesson-test pass and the celebration flag. Real browser at 390.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
const LANGS={python:'py-1-1',javascript:'js_ch1_l1',cpp:'cpp_l1',java:null};
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
const units=JSON.parse(fs.readFileSync(path.join(root,'learning-studio/units.json'),'utf8'));
try{for(const lang of Object.keys(LANGS)){
 const first=units.find(u=>u.language===lang&&u.unit===1).lessons[0].id;
 const c=await b.newContext({viewport:{width:390,height:844}});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
 await c.route('**/js/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const requireUser=async()=>({uid:'u1'});export const getLessonProgress=async()=>[{chapter:0,lesson:0,completed:true}];export const getUserProfile=async()=>({xp:0,stars:0});`}));
 const p=await c.newPage();p.on('pageerror',e=>console.log('PE',e.message.slice(0,100)));
 await p.addInitScript(([lang])=>{sessionStorage.setItem('cq_cody_intro_u1_'+lang,'1');localStorage.setItem('cq_map_celebrate',JSON.stringify({uid:'u1',language:lang,unit:1,index:0,at:Date.now()}))},[lang]);
 await p.goto(L+'/course-path.html?lang='+lang);await p.waitForSelector('.cw-road-node.is-current');
 await p.waitForTimeout(350);
 const s1=await p.evaluate(()=>{const n=document.querySelector('.cw-road-node.unlocking');return {unlocking:!!n,lock:!!n?.querySelector('.cw-lock-fx'),anim:(n?.querySelector('.cw-cody--node')?.getAnimations()||[]).length,li:n?.dataset.li,just:!!document.querySelector('.cw-road-node.just-done')}});
 assert.equal(s1.unlocking,true,lang+' unlocking class');assert.equal(s1.lock,true,lang+' lock overlay');assert.ok(s1.anim>=1,lang+' Cody animation running');assert.equal(s1.li,'1',lang+' next node is lesson 2');assert.equal(s1.just,true);
 if(lang==='python'){await p.screenshot({path:'/tmp/unlock-a.png'});await p.waitForTimeout(1000);await p.screenshot({path:'/tmp/unlock-b.png'});await p.waitForTimeout(1500);await p.screenshot({path:'/tmp/unlock-c.png'})}
 // Cody starts at the finished station: first sampled position is above/left of the next node, final position is on the next node
 await p.waitForTimeout(lang==='python'?400:2600);
 const fin=await p.evaluate(()=>{const n=document.querySelector('.cw-road-node.is-current');const cd=n.querySelector('.cw-cody--node').getBoundingClientRect(),bt=n.querySelector('.cw-node').getBoundingClientRect();return {cx:Math.round(cd.left+cd.width/2),bx:Math.round(bt.left+bt.width/2),cleaned:!document.querySelector('.cw-lock-fx')&&!document.querySelector('.unlocking'),flag:localStorage.getItem('cq_map_celebrate'),ov:document.documentElement.scrollWidth>innerWidth+1}});
 assert.ok(Math.abs(fin.cx-fin.bx)<=6,lang+' Cody ends on the next station '+JSON.stringify(fin));assert.equal(fin.flag,null);assert.equal(fin.ov,false);
 await c.close()}
 console.log('unlock animation + Cody travel ok in 4 languages (fixtures)')}finally{await b.close();srv.close()}})().catch(e=>{console.error(String(e.stack||e).slice(0,500));process.exit(1)});
