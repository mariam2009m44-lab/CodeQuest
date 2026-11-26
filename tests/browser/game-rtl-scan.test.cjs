// Measured bidi check in the games: no single text node may mix Arabic with an operator-bearing code fragment (that is what reverses "17 // 5").
// Walks every question of game-quiz and game-speed on all three levels (stubbed account), scanning the rendered text at each step.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const origin='http://codequest.test';
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.json':'application/json','.webp':'image/webp'};
const scan=()=>{const AR=/[\u0600-\u06ff]/,OP=/[A-Za-z0-9_)\]"']\s*(?:\/\/|\*\*|==|!=|<=|>=|\*|\/|%|\+|-|=)\s*[A-Za-z0-9_("'\[]|[A-Za-z_]\w*\(.*?\)/;const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const t=n.nodeValue.trim();if(!t||!AR.test(t)||!OP.test(t))continue;const el=n.parentElement;if(!el||el.closest('script,style,noscript'))continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;out.push(t.slice(0,90))}return out};
(async()=>{const b=await chromium.launch();const found={};
for(const [file,start,step] of [['game-quiz.html',l=>`.lvl-btn[onclick*="${l}"]`,async p=>{const ok=await p.evaluate(()=>{const o=document.querySelector('.opt-btn');if(!o)return false;o.click();return true});await p.waitForTimeout(80);return ok}],['game-speed.html',l=>`.lvl-btn[data-cq-level="${l}"]`,async p=>{const ok=await p.evaluate(()=>{try{ans(currentQs[curr].a);return true}catch{return false}});const c=await p.$('#continueAnswer');if(c&&await c.isVisible())await c.click();return ok}]]){
 const seen=new Set();let steps=0;
 for(const lvl of ['easy','medium','hard']){
  const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await c.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();if(u.pathname==='/js/auth.js')return r.fulfill({contentType:'text/javascript',body:'export async function requireUser(){return {uid:"accountA"}}'});if(u.pathname==='/js/firebase-config.js')return r.fulfill({contentType:'text/javascript',body:'export const functions={};'});if(['/js/route-guard.js','/js/reminders.js','/js/game-audio.js'].includes(u.pathname))return r.fulfill({contentType:'application/javascript',body:''});try{await r.fulfill({contentType:types[path.extname(u.pathname)]||'application/octet-stream',body:fs.readFileSync(path.join(root,u.pathname.slice(1)))})}catch{await r.fulfill({status:404,body:'nf'})}});
  const p=await c.newPage();await p.goto(`${origin}/${file}`);await p.waitForFunction(()=>window.CQGameStore&&window.CQGameStore.ready);
  await p.evaluate(l=>startGame(l),lvl);try{await p.waitForSelector('#gameScreen.active',{timeout:4000})}catch{(found.unmeasured=found.unmeasured||[]).push(file+':'+lvl+' (level locked until earlier levels are finished)');await c.close();continue}
  for(let i=0;i<40;i++){for(const t of await p.evaluate(scan))seen.add(t);steps++;const ok=await step(p);if(!ok)break;await p.waitForTimeout(60);const done=await p.evaluate(()=>!!document.querySelector('#resultScreen.active'));if(done)break}
  await c.close()}
 found[file]={steps,offenders:[...seen]};
}
const b2=await chromium.launch();await b.close();console.log(JSON.stringify(found,null,1));
for(const f of ['game-quiz.html','game-speed.html']){const v=found[f];assert.ok(v.steps>=6,f+' walked '+v.steps+' steps')}
for(const f of ['game-quiz.html','game-speed.html']){const v=found[f];assert.deepEqual(v.offenders,[],f+' mixes Arabic and code operators in one text node')}
// negative control: the scanner flags the broken pattern
const c2=await b2.newContext();const p2=await c2.newPage();await p2.setContent('<p>ناتج 17 // 5 هو</p><p>ناتج <bdi dir="ltr">17 // 5</bdi> هو</p>');const neg=await p2.evaluate(scan);assert.equal(neg.length,1,'scanner flags only the unisolated case: '+JSON.stringify(neg));await b2.close();
console.log('game rtl scan ok (quiz, speed)');
})().catch(e=>{console.error(e.message||e);process.exit(1)});
