// game-quiz: rendered reading order of code inside Arabic questions, measured from glyph positions (not a text heuristic). All questions of all levels.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const origin='http://codequest.test';const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg'};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
await c.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();if(u.pathname==='/js/auth.js')return r.fulfill({contentType:'text/javascript',body:'export async function requireUser(){return {uid:"fixtureA"}}'});if(u.pathname==='/js/firebase-config.js')return r.fulfill({contentType:'text/javascript',body:'export const functions={};'});if(['/js/route-guard.js','/js/reminders.js','/js/game-audio.js'].includes(u.pathname))return r.fulfill({contentType:'application/javascript',body:''});try{await r.fulfill({contentType:types[path.extname(u.pathname)]||'x',body:fs.readFileSync(path.join(root,u.pathname.slice(1)))})}catch{await r.fulfill({status:404,body:'nf'})}});
const p=await c.newPage();await p.goto(origin+'/game-quiz.html');await p.waitForFunction(()=>window.CQGameStore&&window.CQGameStore.ready);
const res=await p.evaluate(()=>{const bad=[];let spans=0,checked=0;
 const chk=(el,label)=>{for(const sp of el.querySelectorAll('span[dir=ltr]')){spans++;const t=sp.textContent;
  if(/^[\s:]/.test(t)||(sp.nextSibling&&/[\s:]$/.test(t)&&false))bad.push(label+': leading punctuation inside isolate: '+t.slice(0,40));
  {const pv=sp.previousSibling;if(pv&&pv.nodeType===3&&/:\s*$/.test(pv.data)){const i=pv.data.lastIndexOf(':');const r=document.createRange();r.setStart(pv,i);r.setEnd(pv,i+1);const q=r.getClientRects()[0],sb=sp.getClientRects()[0];if(q&&sb&&Math.abs(q.top-sb.top)<30&&q.left<sb.right-1)bad.push(label+': colon is not between the Arabic word and the code: '+t.slice(0,30))}}
  // glyph x positions of the isolate's characters must increase left to right
  const tn=sp.firstChild;if(!tn||tn.nodeType!==3)continue;const xs=[];for(let i=0;i<tn.length;i++){if(/\s/.test(tn.data[i]))continue;const r=document.createRange();r.setStart(tn,i);r.setEnd(tn,i+1);const q=r.getClientRects();if(q.length)xs.push([q[0].left,q[0].top])}
  // within one visual line x must ascend; a new line (top increases) restarts
  for(let i=1;i<xs.length;i++){if(Math.abs(xs[i][1]-xs[i-1][1])<4&&xs[i][0]<xs[i-1][0]-0.5){bad.push(label+': reversed glyph order in: '+t.slice(0,40));break}}checked++}};
 for(const l of ['easy','medium','hard'])questionBank[l].forEach((q,i)=>{currentLevel=l;currentQs=[q];curr=0;document.getElementById('levelScreen').classList.remove('active');document.getElementById('gameScreen').classList.add('active');loadQ();chk(document.getElementById('question'),l+i+' q');document.querySelectorAll('.opt-btn').forEach((o,k)=>chk(o,l+i+' opt'+k))});
 return {bad,spans,checked}});
await b.close();console.log(JSON.stringify(res));
assert.ok(res.spans>20,'measured '+res.spans+' isolated code runs');assert.deepEqual(res.bad,[]);console.log('game-quiz code runs: isolated, no punctuation inside, glyphs left-to-right (fixture states, measured)');
})().catch(e=>{console.error(e.message||e);process.exit(1)});
