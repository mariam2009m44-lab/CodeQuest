// game-image-puzzle: real controls. Start, drag every tray piece to its board slot (mouse pointer events, and touch pointer events via CDP), reach the completion state, then restart. FIXTURE ONLY (stub sign-in, isolated browser, no learner data).
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const origin='http://codequest.test';const T={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg'};
async function ctx(b,w,touch){const c=await b.newContext({viewport:{width:w,height:844},serviceWorkers:'block',hasTouch:touch,isMobile:touch});
await c.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();if(u.pathname==='/js/auth.js')return r.fulfill({contentType:'text/javascript',body:'export async function requireUser(){return {uid:"fixtureA"}}'});if(u.pathname==='/js/firebase-config.js')return r.fulfill({contentType:'text/javascript',body:'export const functions={};'});if(['/js/route-guard.js','/js/reminders.js','/js/game-audio.js'].includes(u.pathname))return r.fulfill({contentType:'application/javascript',body:''});try{await r.fulfill({contentType:T[path.extname(u.pathname)]||'x',body:fs.readFileSync(path.join(root,decodeURIComponent(u.pathname.slice(1))))})}catch{await r.fulfill({status:404,body:'nf'})}});return c}
async function drag(p,cdp,from,to){
 if(cdp){const pt=(x,y)=>[{x,y,id:1}];await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pt(from.x,from.y)});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pt(from.x+(to.x-from.x)*i/8,from.y+(to.y-from.y)*i/8)});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
 else{await p.mouse.move(from.x,from.y);await p.mouse.down();await p.mouse.move((from.x+to.x)/2,(from.y+to.y)/2,{steps:4});await p.mouse.move(to.x,to.y,{steps:4});await p.mouse.up()}}
(async()=>{const b=await chromium.launch();const log=[];
for(const [w,touch,SZ] of [[390,false,''],[320,true,'4'],[390,true,'']]){const c=await ctx(b,w,touch);const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const cdp=touch?await c.newCDPSession(p):null;
 await p.goto(origin+'/game-image-puzzle.html');await p.waitForFunction(()=>window.CQGameStore&&window.CQGameStore.ready);await p.waitForSelector('#startBtn');
 if(SZ)await p.evaluate(v=>{document.getElementById('difficulty').value=v},SZ);await p.click('#startBtn');await p.waitForSelector('#tray .free-piece',{timeout:15000});
 const total=await p.evaluate(()=>size*size);const poolStart=await p.locator('#tray .free-piece').count();assert.equal(poolStart,total,`${w}: tray pieces ${poolStart} vs ${total}`);
 for(let k=0;k<total;k++){
  // always take the first tray piece; scroll so both tray piece and board slot are visible, measure geometry live
  if(process.env.GEO){console.log(JSON.stringify(await p.evaluate(()=>{const r=e=>{const b=document.querySelector(e).getBoundingClientRect();return [Math.round(b.top+scrollY),Math.round(b.height)]};return {board:r('#board'),tray:r('#tray'),vh:innerHeight,doc:document.documentElement.scrollHeight}})));process.exit(0)}
  const g=await p.evaluate(()=>{const el=document.querySelector('#tray .free-piece');const idx=Number(el.dataset.piece),pc=pieces[idx];const board=document.getElementById('board');window.scrollTo({top:board.getBoundingClientRect().top+scrollY-120,behavior:'instant'});return {idx,row:pc.row,col:pc.col}});
  // if tray and board cannot both be on screen, drag in two phases is not needed: the ghost follows the pointer, so scroll the board into view after pointer down is not possible; choose the scroll that shows both
  await p.waitForTimeout(120);
  const geo=await p.evaluate(({idx,row,col})=>{const el=document.querySelector('#tray .free-piece[data-piece="'+idx+'"]'),br=document.getElementById('board').getBoundingClientRect(),r=el.getBoundingClientRect();const sc=br.width/(cellW*size);return {from:{x:r.left+r.width/2,y:r.top+r.height/2},rect:{l:r.left,t:r.top,w:r.width,h:r.height},br:{l:br.left,t:br.top,w:br.width},sc,tx:(col*cellW-(tab+3))*sc,ty:(row*cellH-(tab+3))*sc,pw:(cellW+2*(tab+3))*sc,ph:(cellH+2*(tab+3))*sc,vh:innerHeight}},g);
  // pointer target so the ghost top-left lands on the slot: grab offset is scaled to ghost size
  const gx=(geo.from.x-geo.rect.l)*(geo.pw/geo.rect.w),gy=(geo.from.y-geo.rect.t)*(geo.ph/geo.rect.h);
  const to={x:geo.br.l+geo.tx+gx,y:geo.br.t+geo.ty+gy};
  assert.ok(to.y>=0&&to.y<=geo.vh&&geo.from.y>=0&&geo.from.y<=geo.vh,`${w}: piece ${k} source y ${Math.round(geo.from.y)} / target y ${Math.round(to.y)} not both on screen (vh ${geo.vh})`);
  const before=await p.evaluate(()=>pieces.filter(q=>q.state==='placed').length);
  await drag(p,cdp,geo.from,to);await p.waitForTimeout(150);
  const st=await p.evaluate(i=>({state:pieces[i].state,placed:pieces.filter(q=>q.state==='placed').length,tray:document.querySelectorAll('#tray .free-piece').length,count:document.getElementById('placedCount').textContent}),g.idx);
  assert.equal(st.state,'placed',`${w}: piece ${k} (r${g.row}c${g.col}) not placed by drag, state=${st.state}`);assert.equal(st.placed,before+1,`${w}: placed count piece ${k}`);assert.equal(st.tray,total-k-1,`${w}: tray left after piece ${k}`);assert.equal(st.count,String(before+1),`${w}: placedCount label after piece ${k}`)}
 await p.waitForSelector('#successBox.visible',{timeout:5000});
 const win=await p.evaluate(()=>({done:finished,placed:document.getElementById('placedCount').textContent,total:document.getElementById('totalCount').textContent,time:document.getElementById('winTime').textContent}));
 assert.equal(win.done,true,'finished flag');assert.equal(win.placed,win.total,'placed label vs total');
 // restart with the real control
 await p.evaluate(()=>document.getElementById('replayBtn').scrollIntoView({block:'center'}));await p.click('#replayBtn');await p.waitForSelector('#tray .free-piece');await p.waitForTimeout(400);
 const re=await p.evaluate(()=>({tray:document.querySelectorAll('#tray .free-piece').length,placed:document.getElementById('placedCount').textContent,fin:finished,success:document.getElementById('successBox').classList.contains('visible')}));
 assert.equal(re.tray,total,'restart tray');assert.equal(re.placed,'0','restart placed');assert.equal(re.fin,false,'restart finished');assert.equal(re.success,false,'restart success box');
 assert.deepEqual(errs,[]);log.push(`${w}px ${touch?'touch (CDP)':'mouse'}: ${total}/${total} placed by real drag, completion shown, after the win-screen replay button the tray has ${re.tray} pieces, placed 0`);await c.close()}
await b.close();console.log(log.join('\n'));
})().catch(e=>{console.error(e.message||e);process.exit(1)});
