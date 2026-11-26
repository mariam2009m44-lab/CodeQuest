const {chromium}=(()=>{try{return require('playwright')}catch{return require('playwright-core')}})(),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
const out=process.env.CERT_OUT||'/tmp/cert-out';fs.mkdirSync(out,{recursive:true});
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));let d;try{d=fs.readFileSync(f)}catch{s.writeHead(404);return s.end()}s.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});s.end(d)});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;
const b=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}:{});
try{
 const c=await b.newContext({viewport:{width:1280,height:900},acceptDownloads:true}),p=await c.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 // 1. no record: honest empty state, no canvas, no actions
 await p.goto(L+'/learning-studio/certificate.html');await p.waitForSelector('#certNone:not([hidden])');
 assert(await p.locator('#certCanvas').isHidden());assert(await p.locator('#certActions').isHidden());
 const dtxt=await p.textContent('#certNone');assert.match(dtxt,/سجّل الدخول لعرض شهادتك/);assert.doesNotMatch(dtxt,/لا توجد شهادة صادرة/);
 // 2. demo record: marked, PDF download + print
 for(const lang of ['python','cpp']){
  await p.goto(L+'/learning-studio/certificate.html?demo=1&lang='+lang);await p.waitForSelector('#certCanvas:not([hidden])');
  assert.match(await p.textContent('#certNote'),/ليس شهادة صادرة/);
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('#certPdf')]);
  assert.match(dl.suggestedFilename(),/^CodeQuest-certificate-.*\.pdf$/);const f=out+'/demo-'+lang+'.pdf';await dl.saveAs(f);
  const buf=fs.readFileSync(f),txt=buf.toString('latin1');
  assert(txt.startsWith('%PDF-1.4'));assert(txt.trimEnd().endsWith('%%EOF'));assert.match(txt,/\/Count 1/);assert.match(txt,/\/MediaBox \[0 0 841\.89 595\.28\]/);assert(buf.length>50000,'embedded raster image');
  assert(await p.locator('#certPdf').isEnabled(),'button re-enabled');
  if(lang==='python'){await p.screenshot({path:out+'/page-desktop.png'});}
  // print emulation: one A4 landscape page, chrome hidden
  await p.emulateMedia({media:'print'});
  assert(await p.locator('#certActions').isHidden());assert(await p.locator('h1').isHidden());assert(await p.locator('#certCanvas').isVisible());
  const pdf=await p.pdf({preferCSSPageSize:true,printBackground:true});fs.writeFileSync(out+'/print-'+lang+'.pdf',pdf);
  const info=require('child_process').spawnSync('pdfinfo',[out+'/print-'+lang+'.pdf'],{encoding:'utf8'});if(info.status===0){assert.match(info.stdout,/Pages:\s+1\b/,'print is one page');assert.match(info.stdout,/Page size:\s+8(41|42)\.\d+ x 59[45]\.\d+ pts/,'A4 landscape')}
  await p.emulateMedia({media:'screen'});
 }
 // 3. real-looking synthetic query on a non-localhost host must not render a record
 assert.deepEqual(errs,[]);
 console.log('certificate browser regression ok');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
