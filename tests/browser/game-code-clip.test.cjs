// Measured bidi check in the games: no single text node may mix Arabic with an operator-bearing code fragment (that is what reverses "17 // 5").
// Walks every question of game-quiz and game-speed on all three levels (stubbed account), scanning the rendered text at each step.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const origin='http://codequest.test';
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.json':'application/json','.webp':'image/webp'};

// Code lines must be fully visible (no clipped text) in the bug and build games at phone widths. Fixture only: earlier levels are marked cleared inside an isolated test browser.
(async()=>{const b=await chromium.launch();const rows=[];
for(const w of [390,320])for(const g of ['bug','build'])for(const lvl of ['easy','medium','hard']){
 const c=await b.newContext({viewport:{width:w,height:844},serviceWorkers:'block'});
 await c.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();if(u.pathname==='/js/auth.js')return r.fulfill({contentType:'text/javascript',body:'export async function requireUser(){return {uid:"fixtureA"}}'});if(u.pathname==='/js/firebase-config.js')return r.fulfill({contentType:'text/javascript',body:'export const functions={};'});if(['/js/route-guard.js','/js/reminders.js','/js/game-audio.js'].includes(u.pathname))return r.fulfill({contentType:'application/javascript',body:''});try{await r.fulfill({contentType:types[path.extname(u.pathname)]||'application/octet-stream',body:fs.readFileSync(path.join(root,u.pathname.slice(1)))})}catch{await r.fulfill({status:404,body:'nf'})}});
 const p=await c.newPage();await p.goto(`${origin}/game-${g}.html`);await p.waitForFunction(()=>window.CQGameStore&&window.CQGameStore.ready);
 await p.evaluate(([g,l])=>{const o=['easy','medium','hard'];for(const x of o.slice(0,o.indexOf(l)))CQGameStore.set('codequest-'+g+'-stars-'+x,'1')},[g,lvl]);
 await p.evaluate(l=>startGame(l),lvl);await p.waitForSelector('#gameScreen.active');await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const sel=document.querySelector('.line .code-text')?'.line .code-text':'.code-block';const bad=[];let n=0;document.querySelectorAll(sel).forEach(e=>{n++;if(e.scrollWidth>e.clientWidth+1)bad.push(e.textContent.slice(0,50)+' sw'+e.scrollWidth+'>cw'+e.clientWidth);const bx=e.getBoundingClientRect();if(bx.right>innerWidth+1||bx.left<-1)bad.push('offscreen '+e.textContent.slice(0,30))});const box=document.querySelector('.code-box');if(box){const bb=box.getBoundingClientRect();document.querySelectorAll(sel).forEach(e=>{const q=e.getBoundingClientRect();if(q.right>bb.right+1)bad.push('past box '+e.textContent.slice(0,30))})}return {n,bad,docOverflow:document.documentElement.scrollWidth>innerWidth+1}});
 rows.push({w,g,lvl,...r});await c.close()}
await b.close();console.log(JSON.stringify(rows.filter(r=>r.bad.length||r.docOverflow)));
const bad=rows.filter(r=>r.bad.length||r.docOverflow);assert.ok(rows.every(r=>r.n>0),'every state had code lines');assert.deepEqual(bad,[],'clipped or overflowing code lines');
console.log('game code lines fully visible at 390 and 320 (fixture progress, bug+build)');
})().catch(e=>{console.error(e.message||e);process.exit(1)});
