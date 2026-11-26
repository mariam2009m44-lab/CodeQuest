// Code fragments in the Python exam (17 // 5, items[0], a ** b, ...) stay left-to-right inside Arabic text. Legacy gate OFF-mode, stubbed sign-in/progress.
const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('x')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
try{const html=fs.readFileSync(path.join(root,'python-exam.html'),'utf8');
 const strs=[];for(const m of html.matchAll(/\b(?:q|explanation):\s*("(?:[^"\\]|\\.)*")/g))strs.push(JSON.parse(m[1]));
 for(const m of html.matchAll(/\bopts:\s*(\[[^\]]*\])/g)){try{strs.push(...JSON.parse(m[1]))}catch{}}
 assert.ok(strs.length>60,'parsed bank strings: '+strs.length);
 const c=await b.newContext({viewport:{width:390,height:844}});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(L+'/learning-studio/index.html');
 const bad=await p.evaluate(async strs=>{const {setProse}=await import('/learning-studio/prose.mjs');const out=[];const box=document.createElement('div');box.dir='rtl';box.style.cssText='width:360px;font:16px sans-serif';document.body.append(box);
  for(const t of strs){const d=document.createElement('p');box.append(d);setProse(d,'ما ناتج '+t+' ؟');
   // any ASCII run with an operator or digit outside a bdi[dir=ltr]
   const w=document.createTreeWalker(d,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){if(n.parentElement.tagName!=='BDI'&&/[A-Za-z0-9_<>=]/.test(n.textContent.replace(/[\u200e\u200f]/g,'')))out.push('outside bdi: '+t)}
   for(const b of d.querySelectorAll('bdi')){const tn=b.firstChild,r=document.createRange(),len=tn.textContent.length;if(len<2)continue;r.setStart(tn,0);r.setEnd(tn,1);const a=r.getBoundingClientRect();r.setStart(tn,len-1);r.setEnd(tn,len);const z=r.getBoundingClientRect();if(!(a.left<z.left)&&Math.abs(a.top-z.top)<5)out.push('reversed: '+tn.textContent)}}
  // negative control: the same measurement must see the bug when no isolation is applied
  const raw=document.createElement('p');box.append(raw);raw.textContent='ما ناتج 17 // 5 ؟';{const tn=raw.firstChild,r=document.createRange(),i=tn.textContent.indexOf('17');r.setStart(tn,i);r.setEnd(tn,i+1);const a=r.getBoundingClientRect();const j=tn.textContent.indexOf('5');r.setStart(tn,j);r.setEnd(tn,j+1);const z=r.getBoundingClientRect();if(a.left<z.left)out.push('negative control did not reproduce the reversed order')}
  return out},strs);
 assert.deepEqual(bad,[],'RTL code fragments');
 // the exam page itself uses the helper: the integer-division question renders its expression in an isolated LTR element
 await p.goto(L+'/python-exam.html');
 assert.ok(html.includes('setProse(questionText, question.q)')&&html.includes('setProse(button, option)'));
 assert.deepEqual(errs,[]);console.log('python exam ltr ok, strings checked:',strs.length);
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
