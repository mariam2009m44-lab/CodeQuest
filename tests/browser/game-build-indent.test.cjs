// game-build: the assembled program shows meaningful Python indentation (measured glyph offsets), not just the right piece order. All 3 levels, 390 and 320px.
// FIXTURE ONLY: earlier levels are marked cleared inside an isolated test browser.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const origin='http://codequest.test';const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg'};
(async()=>{const b=await chromium.launch();const rows=[];
for(const w of [390,320])for(const lvl of ['easy','medium','hard']){
 const c=await b.newContext({viewport:{width:w,height:844},serviceWorkers:'block'});
 await c.route('**/*',async r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();if(u.pathname==='/js/auth.js')return r.fulfill({contentType:'text/javascript',body:'export async function requireUser(){return {uid:"fixtureA"}}'});if(u.pathname==='/js/firebase-config.js')return r.fulfill({contentType:'text/javascript',body:'export const functions={};'});if(['/js/route-guard.js','/js/reminders.js','/js/game-audio.js'].includes(u.pathname))return r.fulfill({contentType:'application/javascript',body:''});try{await r.fulfill({contentType:types[path.extname(u.pathname)]||'x',body:fs.readFileSync(path.join(root,u.pathname.slice(1)))})}catch{await r.fulfill({status:404,body:'nf'})}});
 const p=await c.newPage();await p.goto(`${origin}/game-build.html`);await p.waitForFunction(()=>window.CQGameStore&&window.CQGameStore.ready);
 await p.evaluate(l=>{const o=['easy','medium','hard'];for(const x of o.slice(0,o.indexOf(l)))CQGameStore.set('codequest-build-stars-'+x,'1')},lvl);
 await p.evaluate(l=>startGame(l),lvl);await p.waitForSelector('#gameScreen.active');
 // click the pieces in the intended order by their exact text
 const order=await p.evaluate(()=>correctSeq);
 for(const code of order){await p.evaluate(code=>{const el=[...document.querySelectorAll('#sourceZone .code-block')].find(e=>e.textContent===code&&!e.classList.contains('selected'));el.click()},code)}
 const dbg=await p.evaluate(()=>{const e=document.querySelector("#dropZone .code-block"),s=getComputedStyle(e);return [s.textAlign,s.direction,s.display,s.justifyContent,s.width]});if(process.env.DBG)console.log(dbg);const r=await p.evaluate(()=>{const items=[...document.querySelectorAll('#dropZone .code-block')];return items.map(e=>{const t=e.firstChild;const lead=(t.data.match(/^ */)||[''])[0].length;const k=lead;const r=document.createRange();r.setStart(t,k);r.setEnd(t,Math.min(k+1,t.length));const q=r.getClientRects()[0],bb=e.getBoundingClientRect();return {text:t.data,lead,ws:getComputedStyle(e).whiteSpace,px:parseFloat(getComputedStyle(e).fontSize),rects:(()=>{const rr=document.createRange();rr.selectNodeContents(e);return new Set([...rr.getClientRects()].map(z=>Math.round(z.top))).size})(),off:Math.round(q.left-bb.left),wrapped:(()=>{const rr=document.createRange();rr.selectNodeContents(e);return new Set([...rr.getClientRects()].map(z=>Math.round(z.top))).size>1})(),over:e.scrollWidth>e.clientWidth+1||bb.right>innerWidth+1}})});
 rows.push({w,lvl,r});await c.close()}
await b.close();
for(const {w,lvl,r} of rows){assert.ok(r.length>=3,lvl+' assembled');
 for(const x of r){assert.match(x.ws,/^pre/,`${lvl}@${w}: white-space is ${x.ws}`);assert.ok(x.px>=12.4,`${lvl}@${w}: font ${x.px}px too small`);assert.equal(x.rects,1,`${lvl}@${w}: rendered on ${x.rects} lines: ${x.text}`);assert.equal(x.wrapped,false,`${lvl}@${w}: line wraps: ${x.text}`);assert.equal(x.over,false,`${lvl}@${w}: block overflows for ${x.text}`)}
 // equal indent => equal text offset; deeper indent => larger offset
 const by={};for(const x of r)(by[x.lead]=by[x.lead]||new Set()).add(x.off);
 for(const [k,v] of Object.entries(by))assert.ok(Math.max(...v)-Math.min(...v)<=1,`${lvl}@${w}: lines with ${k} spaces start at different offsets ${[...v]}`);
 const leads=Object.keys(by).map(Number).sort((a,b)=>a-b);for(let i=1;i<leads.length;i++)assert.ok([...by[leads[i]]][0]>[...by[leads[i-1]]][0]+3,`${lvl}@${w}: indent ${leads[i]} is not visibly deeper than ${leads[i-1]}`)}
console.log('game-build assembled indentation measured',JSON.stringify(rows.filter(x=>x.lvl==='hard'&&x.w===390)[0].r.map(x=>[x.lead,x.off])));
})().catch(e=>{console.error(e.message||e);process.exit(1)});
