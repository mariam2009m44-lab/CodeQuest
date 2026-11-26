// game-match: assembled code per lesson (indent, wrapping, overflow). game-memory: every card face at every level (text inside the card, not under the label). 390 and 320px.
// FIXTURE ONLY: memory levels are unlocked via CQGameStore stars inside an isolated test browser; nothing touches learner data.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const origin='http://codequest.test';const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg'};
async function ctx(b,w){const c=await b.newContext({viewport:{width:w,height:844},serviceWorkers:'block'});
await c.route('**/*',async r=>{const u=new URL(r.request().url());if(u.href==='https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js')return r.fulfill({contentType:'text/javascript',body:'export function httpsCallable(){return async()=>({data:{}})}'});if(u.origin!==origin)return r.abort();if(u.pathname==='/js/auth.js')return r.fulfill({contentType:'text/javascript',body:'export async function requireUser(){return {uid:"fixtureA"}}'});if(u.pathname==='/js/firebase-config.js')return r.fulfill({contentType:'text/javascript',body:'export const functions={};'});if(['/js/route-guard.js','/js/reminders.js','/js/game-audio.js'].includes(u.pathname))return r.fulfill({contentType:'application/javascript',body:''});try{await r.fulfill({contentType:types[path.extname(u.pathname)]||'x',body:fs.readFileSync(path.join(root,u.pathname.slice(1)))})}catch{await r.fulfill({status:404,body:'nf'})}});return c}
const src=fs.readFileSync(path.join(root,'game-match.html'),'utf8');const LESSONS=eval('('+src.match(/const lessons = (\[[\s\S]*?\n    \]);/)[1]+')').map(l=>l.pieces);
(async()=>{const b=await chromium.launch();const bad=[];const stats={match:0,mem:0};let minPx=99;
for(const w of [390,320]){const c=await ctx(b,w);
 let p=await c.newPage();await p.goto(origin+'/game-match.html');await p.waitForFunction(()=>window.CQGameStore&&window.CQGameStore.ready);
 await p.waitForSelector('#piecesContainer .piece');const n=LESSONS.length;assert.ok(n>=4);
 for(let li=0;li<n;li++){
  const r=await p.evaluate(async ([li,PIECES])=>{const sel=document.getElementById('matchLesson');sel.value=String(li);sel.dispatchEvent(new Event('change'));
   for(const code of PIECES){const el=[...document.querySelectorAll('#piecesContainer .piece')].find(e=>e.textContent===code);el.click();}
   const items=[...document.querySelectorAll('#targetZone .piece')];
   return items.map(e=>{const t=e.firstChild,lead=(t.data.match(/^ */)||[''])[0].length;const rg=document.createRange();rg.setStart(t,lead);rg.setEnd(t,Math.min(lead+1,t.length));const q=rg.getClientRects()[0],bb=e.getBoundingClientRect();const all=document.createRange();all.selectNodeContents(e);const ar=[...all.getClientRects()];return {text:t.data,lead,off:Math.round(q.left-bb.left),lines:new Set(ar.map(z=>Math.round(z.top))).size,px:parseFloat(getComputedStyle(e).fontSize),ws:getComputedStyle(e).whiteSpace,over:e.scrollWidth>e.clientWidth+1||bb.right>innerWidth+1||Math.max(...ar.map(z=>z.right))>bb.right-2}})},[li,LESSONS[li]]);
  stats.match++;const by={};for(const x of r){(by[x.lead]=by[x.lead]||new Set()).add(x.off);if(x.lines!==1)bad.push(`match L${li}@${w}: "${x.text}" on ${x.lines} lines`);if(x.over)bad.push(`match L${li}@${w}: "${x.text}" overflows`);if(x.px<12)bad.push(`match L${li}@${w}: font ${x.px}px`)}
  for(const [k,v] of Object.entries(by))if(Math.max(...v)-Math.min(...v)>1)bad.push(`match L${li}@${w}: indent ${k} offsets differ ${[...v]}`);
  const ls=Object.keys(by).map(Number).sort((a,b)=>a-b);for(let i=1;i<ls.length;i++)if(!([...by[ls[i]]][0]>[...by[ls[i-1]]][0]+3))bad.push(`match L${li}@${w}: indent ${ls[i]} not visibly deeper`);
  await p.evaluate(()=>document.getElementById('resetButton').click());
 }
 p=await c.newPage();await p.goto(origin+'/game-memory.html');await p.waitForFunction(()=>window.CQGameStore&&window.CQGameStore.ready);
 for(const n of [6,10,15]){
  const r=await p.evaluate(async n=>{if(n>=10)CQGameStore.set('codequest-memory-stars-6','1');if(n>=15)CQGameStore.set('codequest-memory-stars-10','1');startGame(n);await new Promise(r=>setTimeout(r,200));
   const cards=[...document.querySelectorAll('#gameGrid .card')];cards.forEach(c=>c.classList.add('flipped'));await new Promise(r=>setTimeout(r,800));
   return cards.map(c=>{const back=c.querySelector('.card-back'),br=back.getBoundingClientRect();const rg=document.createRange();rg.selectNodeContents(back);const rs=[...rg.getClientRects()];const tb={l:Math.min(...rs.map(z=>z.left)),r:Math.max(...rs.map(z=>z.right)),t:Math.min(...rs.map(z=>z.top)),b:Math.max(...rs.map(z=>z.bottom))};const M=(window.__cqFaceMetrics||{})[back.textContent];const cw=c.getBoundingClientRect().width;return {metric:M?{size:M.size,lines:M.lines,shownPx:+(M.size*cw/M.canvasW).toFixed(1)}:null,text:back.textContent,kind:back.dataset.kind,inside:tb.l>=br.left-0.5&&tb.r<=br.right+0.5&&tb.t>=br.top+13&&tb.b<=br.bottom+0.5,px:parseFloat(getComputedStyle(back).fontSize),lines:new Set(rs.map(z=>Math.round(z.top))).size,w:br.width,h:br.height,off:br.right>innerWidth+1||br.left<-1}})},n);
  stats.mem++;for(const x of r){if(!x.inside)bad.push(`memory ${n}@${w}: "${x.text}" not inside card face / under label (${Math.round(x.w)}x${Math.round(x.h)})`);if(!x.metric)bad.push(`memory ${n}@${w}: no drawn-face metrics for "${x.text}" (3D face not drawn)`);else{if(x.metric.shownPx<11)bad.push(`memory ${n}@${w}: "${x.text}" drawn at ${x.metric.shownPx}px (<11)`);if(x.metric.lines>3)bad.push(`memory ${n}@${w}: ${x.metric.lines} lines`);minPx=Math.min(minPx,x.metric.shownPx)}if(x.off)bad.push(`memory ${n}@${w}: card off-screen`);}
  await p.evaluate(()=>{try{showMemoryLevels()}catch{}});
 }
 await c.close()}
await b.close();
assert.deepEqual(bad,[]);console.log('match lessons and memory faces measured (fixture):',JSON.stringify(stats),'min drawn memory label px',minPx,'x 2 widths');
})().catch(e=>{console.error(e.message||e);process.exit(1)});
