// Home page sample code (hero bubble and the Python card) must be left-to-right inside the Arabic page, or punctuation lands on the wrong side. Real browser, measured computed direction and glyph order of the first characters. Fixture: static server.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{const d=fs.readFileSync(f);s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(d)}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
const c=await b.newContext({viewport:{width:390,height:844}});await c.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname==='localhost')return r.continue();if(/firebase|auth\.js/.test(u.href))return r.fulfill({contentType:'text/javascript',body:''});r.abort()});
const p=await c.newPage();await p.goto(L+'/index.html');await p.waitForTimeout(1000);
const r=await p.evaluate(()=>['.floating-code','.cq-live-academy__code'].map(sel=>{const e=document.querySelector(sel);const cs=getComputedStyle(e);
 const range=document.createRange();const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);const xs=[];let n;while(n=w.nextNode()){if(!n.textContent.trim())continue;range.selectNodeContents(n);const rc=range.getClientRects()[0];if(rc)xs.push([n.textContent.trim().slice(0,8),Math.round(rc.left),Math.round(rc.top)])}
 return {sel,dir:cs.direction,xs}}));
await b.close();srv.close();
for(const x of r)assert.equal(x.dir,'ltr',x.sel);
// hero: "print" and "(" start the first line, so "print" sits left of "("; the card: line numbers stay left of the code
const hero=r[0].xs,print=hero.find(v=>v[0]==='print'),paren=hero.find(v=>v[0]==='(');assert.ok(print[1]<paren[1],'print before (');
const card=r[1].xs,n01=card.find(v=>v[0]==='01'),def=card.find(v=>v[0]==='def');assert.ok(n01[1]<def[1],'01 before def');
console.log('home sample code is left-to-right (fixture)')})().catch(e=>{console.error(String(e.message||e).slice(0,400));process.exit(1)});
