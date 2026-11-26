// game-image-puzzle: win rewards (device-local points, stars, best time record, plays) across two wins, and the learning card (wrong choice, right choice, answer toggle). Real drags. FIXTURE ONLY (stub sign-in, isolated browser, no learner data).
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const origin='http://codequest.test';const T={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg'};
async function ctx(b,w,touch){const c=await b.newContext({viewport:{width:w,height:844},serviceWorkers:'block',hasTouch:touch,isMobile:touch});
await c.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();if(u.pathname==='/js/auth.js')return r.fulfill({contentType:'text/javascript',body:'export async function requireUser(){return {uid:"fixtureA"}}'});if(u.pathname==='/js/firebase-config.js')return r.fulfill({contentType:'text/javascript',body:'export const functions={};'});if(['/js/route-guard.js','/js/reminders.js','/js/game-audio.js'].includes(u.pathname))return r.fulfill({contentType:'application/javascript',body:''});try{await r.fulfill({contentType:T[path.extname(u.pathname)]||'x',body:fs.readFileSync(path.join(root,decodeURIComponent(u.pathname.slice(1))))})}catch{await r.fulfill({status:404,body:'nf'})}});return c}
async function drag(p,cdp,from,to){
 if(cdp){const pt=(x,y)=>[{x,y,id:1}];await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pt(from.x,from.y)});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pt(from.x+(to.x-from.x)*i/8,from.y+(to.y-from.y)*i/8)});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
 else{await p.mouse.move(from.x,from.y);await p.mouse.down();await p.mouse.move((from.x+to.x)/2,(from.y+to.y)/2,{steps:4});await p.mouse.move(to.x,to.y,{steps:4});await p.mouse.up()}}
const geoOf=async(p,idx,row,col)=>{await p.evaluate(()=>{const board=document.getElementById('board');window.scrollTo({top:board.getBoundingClientRect().top+scrollY-120,behavior:'instant'})});await p.waitForTimeout(120);
 return p.evaluate(({idx,row,col})=>{const el=document.querySelector('[data-piece="'+idx+'"]'),br=document.getElementById('board').getBoundingClientRect(),r=el.getBoundingClientRect();const sc=br.width/(cellW*size);const pw=(cellW+2*(tab+3))*sc,ph=(cellH+2*(tab+3))*sc;const fromBoard=pieces[idx].state==='loose';const gx=(r.left+r.width/2-r.left)*((fromBoard?r.width:pw)/r.width),gy=(r.height/2)*((fromBoard?r.height:ph)/r.height);return {from:{x:r.left+r.width/2,y:r.top+r.height/2},to:{x:br.left+(col*cellW-(tab+3))*sc+gx,y:br.top+(row*cellH-(tab+3))*sc+gy},vh:innerHeight}},{idx,row,col})};
const win=async(p,wait)=>{await p.waitForSelector('#tray .free-piece');const total=await p.evaluate(()=>size*size);if(wait)await p.waitForTimeout(wait);
 for(let k=0;k<total;k++){const idx=await p.evaluate(()=>Number(document.querySelector('#tray .free-piece').dataset.piece));const r=await p.evaluate(i=>({row:pieces[i].row,col:pieces[i].col}),idx);const gg=await geoOf(p,idx,r.row,r.col);await drag(p,null,gg.from,gg.to);await p.waitForTimeout(120)}
 await p.waitForSelector('#successBox.visible',{timeout:5000});
 return p.evaluate(()=>({text:document.getElementById('successText').textContent,time:document.getElementById('winTime').textContent,points:Number(document.getElementById('winPoints').textContent),best:document.getElementById('bestTime').textContent,stars:document.getElementById('puzzleStars').textContent,total:Number(CQGameStore.get('codyTotalScore')||0),rec:JSON.parse(CQGameStore.get(bestKey())||'{}'),seconds,moves}))};
(async()=>{const b=await chromium.launch();const log=[];
 const c=await ctx(b,390,false);const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(origin+'/game-image-puzzle.html');await p.waitForFunction(()=>window.CQGameStore&&window.CQGameStore.ready);await p.evaluate(()=>{document.getElementById('difficulty').value='3'});
 assert.ok(await p.evaluate(()=>[...document.querySelectorAll('.mobile-nav span')].every(e=>parseFloat(getComputedStyle(e).fontSize)>=12)),'bottom-nav labels are at least 12px');
 const before=await p.evaluate(()=>Number(CQGameStore.get('codyTotalScore')||0));assert.equal(before,0,'fixture starts with no points');
 await p.click('#startBtn');const w1=await win(p,0);
 assert.match(w1.text,/^رقم قياسي جديد/,'first win is a new record');assert.equal(w1.rec.plays,1);assert.equal(w1.total,w1.points,'device points go up by exactly the earned points');assert.ok(w1.points>=30&&w1.points<=100,'earned points in the 3x3 range: '+w1.points);assert.equal(w1.stars,'★★★','a clean 9-move win gives 3 stars (moves '+w1.moves+')');assert.equal(w1.rec.time,w1.seconds);
 // learning card
 const lc=await p.evaluate(()=>{const card=document.getElementById('learningCard');return {hidden:card.hidden,choices:document.querySelectorAll('#learningChoices button').length,title:document.getElementById('learningTitle').textContent}});
 assert.equal(lc.hidden,false,'learning card shows after a win');
 const lcd=await p.evaluate(()=>({title:document.getElementById('learningTitle').textContent.trim(),intro:document.getElementById('learningIntro').textContent.trim(),facts:document.querySelectorAll('#learningFacts .learning-fact').length,q:document.getElementById('learningQuestion').textContent.trim(),ansHidden:document.getElementById('learningAnswer').hidden,choiceBtns:document.querySelectorAll('#learningChoices button').length}));
 assert.ok(lcd.title&&lcd.intro&&lcd.q&&lcd.facts>=1,'learning card has title, intro, facts and a question');assert.equal(lcd.ansHidden,true,'answer starts hidden');
 await p.evaluate(()=>document.getElementById('showAnswerBtn').scrollIntoView({block:'center'}));await p.click('#showAnswerBtn');assert.equal(await p.evaluate(()=>document.getElementById('learningAnswer').hidden),false);assert.ok((await p.evaluate(()=>document.getElementById('learningAnswer').textContent.trim())).length>0);await p.click('#showAnswerBtn');assert.equal(await p.evaluate(()=>document.getElementById('learningAnswer').hidden),true);
 log.push('learning card: title/intro/'+lcd.facts+' facts/question shown, answer hidden then toggles (no artwork has multiple-choice data, so the choice branch is not exercised; choiceBtns='+lcd.choiceBtns+')');
 // second win, deliberately slower: not a record, best time kept, points added, plays 2
 await p.evaluate(()=>document.getElementById('replayBtn').scrollIntoView({block:'center'}));await p.click('#replayBtn');const w2=await win(p,3500);
 assert.match(w2.text,/^أحسنت/,'slower second win is not a record');assert.equal(w2.rec.plays,2);assert.equal(w2.rec.time,w1.seconds,'best time stays the faster first time');assert.equal(w2.best,w1.time);assert.equal(w2.total,w1.points+w2.points,'points accumulate: '+w1.points+' + '+w2.points);assert.ok(w2.seconds>w1.seconds);
 assert.deepEqual(errs,[]);log.push('win 1: new record, '+w1.points+' pts, '+w1.stars+', plays 1; win 2 (slower, '+w2.seconds+'s vs '+w1.seconds+'s): not a record, best time kept, +'+w2.points+' pts, plays 2, total '+w2.total);

 // ?return= handling: same-origin target gets the lesson button with gameDone=1; a foreign origin is ignored.
 for(const [ret,ok] of [['/lecture.html?lesson=1',true],['https://evil.example/steal',false]]){
  const q=await c.newPage();await q.goto(origin+'/game-image-puzzle.html?return='+encodeURIComponent(ret));await q.waitForFunction(()=>window.CQGameStore&&window.CQGameStore.ready);await q.evaluate(()=>{document.getElementById('difficulty').value='3'});await q.click('#startBtn');
  await win(q,0);const r=await q.evaluate(()=>document.getElementById('newPictureBtn').textContent.trim());
  if(ok){assert.equal(r,'العودة إلى الدرس');let nav='';await q.route('**/lecture.html*',rt=>{nav=rt.request().url();rt.fulfill({contentType:'text/html',body:'<p>lesson</p>'})});await q.evaluate(()=>document.getElementById('newPictureBtn').scrollIntoView({block:'center'}));await q.click('#newPictureBtn');await q.waitForURL(/lecture\.html/);assert.match(q.url(),/lesson=1/);assert.match(q.url(),/gameDone=1/)}
  else assert.notEqual(r,'العودة إلى الدرس','foreign-origin return is ignored');
  await q.close()}
 log.push('?return=: same-origin gives "back to lesson" with gameDone=1 and navigates; foreign origin ignored');

 // 5x5: its own best-record key, points in the 5x5 range, separate from the 3x3 record.
 {const q=await c.newPage();await q.goto(origin+'/game-image-puzzle.html');await q.waitForFunction(()=>window.CQGameStore&&window.CQGameStore.ready);await q.evaluate(()=>{document.getElementById('difficulty').value='5'});await q.click('#startBtn');
  const w5=await win(q,0);assert.match(w5.text,/^رقم قياسي جديد/);assert.equal(w5.rec.plays,1);assert.ok(w5.points>=30&&w5.points<=280);assert.ok(w5.total>=w5.points);
  const keys=await q.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('codeQuestPuzzleBest_')));assert.ok(keys.some(k=>k.endsWith('_5')),'5x5 has its own best key');
  log.push('5x5: new record, '+w5.points+' pts, own best key '+keys.filter(k=>k.endsWith('_5')).length);await q.close()}
 await b.close();console.log(log.join('\n'));
})().catch(e=>{console.error(e.message||e);process.exit(1)});
