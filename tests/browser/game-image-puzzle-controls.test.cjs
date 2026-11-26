// game-image-puzzle: hint, select, wrong drop, return-to-tray, shuffle, and a full 5x5 completion with real controls. FIXTURE ONLY (stub sign-in, isolated browser, no learner data).
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const origin='http://codequest.test';const T={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg'};
async function ctx(b,w,touch){const c=await b.newContext({viewport:{width:w,height:844},serviceWorkers:'block',hasTouch:touch,isMobile:touch});
await c.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();if(u.pathname==='/js/auth.js')return r.fulfill({contentType:'text/javascript',body:'export async function requireUser(){return {uid:"fixtureA"}}'});if(u.pathname==='/js/firebase-config.js')return r.fulfill({contentType:'text/javascript',body:'export const functions={};'});if(['/js/route-guard.js','/js/reminders.js','/js/game-audio.js'].includes(u.pathname))return r.fulfill({contentType:'application/javascript',body:''});try{await r.fulfill({contentType:T[path.extname(u.pathname)]||'x',body:fs.readFileSync(path.join(root,decodeURIComponent(u.pathname.slice(1))))})}catch{await r.fulfill({status:404,body:'nf'})}});return c}
async function drag(p,cdp,from,to){
 if(cdp){const pt=(x,y)=>[{x,y,id:1}];await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pt(from.x,from.y)});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pt(from.x+(to.x-from.x)*i/8,from.y+(to.y-from.y)*i/8)});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
 else{await p.mouse.move(from.x,from.y);await p.mouse.down();await p.mouse.move((from.x+to.x)/2,(from.y+to.y)/2,{steps:4});await p.mouse.move(to.x,to.y,{steps:4});await p.mouse.up()}}
const geoOf=async(p,idx,row,col)=>{await p.evaluate(()=>{const board=document.getElementById('board');window.scrollTo({top:board.getBoundingClientRect().top+scrollY-120,behavior:'instant'})});await p.waitForTimeout(120);
 return p.evaluate(({idx,row,col})=>{const el=document.querySelector('[data-piece="'+idx+'"]'),br=document.getElementById('board').getBoundingClientRect(),r=el.getBoundingClientRect();const sc=br.width/(cellW*size);const pw=(cellW+2*(tab+3))*sc,ph=(cellH+2*(tab+3))*sc;const fromBoard=pieces[idx].state==='loose';const gx=(r.left+r.width/2-r.left)*((fromBoard?r.width:pw)/r.width),gy=(r.height/2)*((fromBoard?r.height:ph)/r.height);return {from:{x:r.left+r.width/2,y:r.top+r.height/2},to:{x:br.left+(col*cellW-(tab+3))*sc+gx,y:br.top+(row*cellH-(tab+3))*sc+gy},vh:innerHeight}},{idx,row,col})};
(async()=>{const b=await chromium.launch();const log=[];
 // A) controls on a 3x3 at 390 mouse
 {const c=await ctx(b,390,false);const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(origin+'/game-image-puzzle.html');await p.waitForFunction(()=>window.CQGameStore&&window.CQGameStore.ready);await p.evaluate(()=>{document.getElementById('difficulty').value='3'});await p.click('#startBtn');await p.waitForSelector('#tray .free-piece');
 const total=await p.evaluate(()=>size*size);assert.equal(total,9);
 // select by click: piece gets .chosen, return button stays disabled (still in the tray)
 await p.evaluate(()=>document.querySelector('#tray .free-piece').scrollIntoView({block:'center'}));const first=await p.evaluate(()=>Number(document.querySelector('#tray .free-piece').dataset.piece));
 await p.locator('#tray .free-piece').first().click();assert.equal(await p.evaluate(()=>document.querySelectorAll('.free-piece.chosen').length),1,'click selects one tray piece');
 // hint with a selected piece shows a target mark
 await p.evaluate(()=>document.getElementById('hintBtn').scrollIntoView({block:'center'}));await p.click('#hintBtn');await p.waitForTimeout(200);assert.ok(await p.evaluate(()=>!!document.querySelector('.target-hint')),'hint shows a target mark');
 // wrong drop: put piece 0's image onto the slot of the farthest cell
 const pc=await p.evaluate(i=>({row:pieces[i].row,col:pieces[i].col}),first);const wr={row:(pc.row+1)%3,col:(pc.col+1)%3};
 let g=await geoOf(p,first,wr.row,wr.col);await drag(p,null,g.from,g.to);await p.waitForTimeout(200);
 const st1=await p.evaluate(i=>({state:pieces[i].state,tray:document.querySelectorAll('#tray .free-piece').length,placed:document.getElementById('placedCount').textContent}),first);
 assert.equal(st1.state,'loose','a wrong drop leaves the piece loose on the board (not placed)');assert.equal(st1.placed,'0');assert.equal(st1.tray,total-1);
 // return to tray: select it on the board, press the return button
 await p.evaluate(i=>{document.querySelector('.board-piece[data-piece="'+i+'"]').scrollIntoView({block:'center'})},first);await p.locator('.board-piece[data-piece="'+await p.evaluate(()=>0)+'"]').count().catch(()=>0);
 await p.evaluate(i=>{const el=document.querySelector('.board-piece[data-piece="'+i+'"]');el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7,button:0,clientX:el.getBoundingClientRect().left+4,clientY:el.getBoundingClientRect().top+4}));window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7,clientX:el.getBoundingClientRect().left+4,clientY:el.getBoundingClientRect().top+4}))},first);await p.waitForTimeout(200);
 const sel=await p.evaluate(()=>({chosen:document.querySelectorAll('.chosen').length,dis:document.getElementById('returnPieceBtn').disabled}));
 assert.equal(sel.dis,false,'return button enabled for a loose piece');await p.evaluate(()=>document.getElementById('returnPieceBtn').scrollIntoView({block:'center'}));await p.click('#returnPieceBtn');await p.waitForTimeout(250);
 const st2=await p.evaluate(i=>({state:pieces[i].state,tray:document.querySelectorAll('#tray .free-piece').length}),first);assert.equal(st2.state,'pool','return puts the piece back in the tray');assert.equal(st2.tray,total);
 // place two correctly, then shuffle: everything returns to the tray and counters reset
 for(let k=0;k<2;k++){const idx=await p.evaluate(()=>Number(document.querySelector('#tray .free-piece').dataset.piece));const r=await p.evaluate(i=>({row:pieces[i].row,col:pieces[i].col}),idx);const gg=await geoOf(p,idx,r.row,r.col);await drag(p,null,gg.from,gg.to);await p.waitForTimeout(200);assert.equal(await p.evaluate(i=>pieces[i].state,idx),'placed')}
 assert.equal(await p.evaluate(()=>document.getElementById('placedCount').textContent),'2');
 await p.evaluate(()=>document.getElementById('shuffleBtn').scrollIntoView({block:'center'}));await p.click('#shuffleBtn');await p.waitForTimeout(400);
 const st3=await p.evaluate(()=>({tray:document.querySelectorAll('#tray .free-piece').length,placed:document.getElementById('placedCount').textContent,moves:moves,finished}));assert.equal(st3.tray,total);assert.equal(st3.placed,'0');assert.equal(st3.finished,false);
 assert.deepEqual(errs,[]);log.push('390px mouse 3x3: select, hint mark, wrong drop stays loose, return to tray, 2 correct placements, shuffle resets (tray '+st3.tray+', placed 0)');await c.close()}
 // B) 5x5 completion by touch at 320
 {const c=await ctx(b,320,true);const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const cdp=await c.newCDPSession(p);
 await p.goto(origin+'/game-image-puzzle.html');await p.waitForFunction(()=>window.CQGameStore&&window.CQGameStore.ready);await p.evaluate(()=>{document.getElementById('difficulty').value='5'});await p.click('#startBtn');await p.waitForSelector('#tray .free-piece');
 const total=await p.evaluate(()=>size*size);assert.equal(total,25);
 for(let k=0;k<total;k++){const idx=await p.evaluate(()=>Number(document.querySelector('#tray .free-piece').dataset.piece));const r=await p.evaluate(i=>({row:pieces[i].row,col:pieces[i].col}),idx);const gg=await geoOf(p,idx,r.row,r.col);assert.ok(gg.from.y>0&&gg.from.y<gg.vh&&gg.to.y>0&&gg.to.y<gg.vh,'5x5: tray piece and slot both on screen');await drag(p,cdp,gg.from,gg.to);await p.waitForTimeout(150);assert.equal(await p.evaluate(i=>pieces[i].state,idx),'placed','5x5 piece '+k)}
 await p.waitForSelector('#successBox.visible',{timeout:5000});assert.equal(await p.evaluate(()=>finished),true);assert.deepEqual(errs,[]);log.push('320px touch 5x5: 25/25 placed by real drag, completion shown');await c.close()}
 await b.close();console.log(log.join('\n'));
})().catch(e=>{console.error(e.message||e);process.exit(1)});
