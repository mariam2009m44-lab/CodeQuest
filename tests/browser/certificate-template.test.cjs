const {chromium}=(()=>{try{return require('playwright')}catch{return require('playwright-core')}})(),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg'};
// The certificate is the owner's template image with only the empty slots filled. FIXTURE record (not a real learner).
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));let d;try{d=fs.readFileSync(f)}catch{s.writeHead(404);return s.end()}s.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});s.end(d)});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;
const b=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH,args:['--no-sandbox']}:{});
try{const p=await (await b.newContext()).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(L+'/learning-studio/certificate.html?demo=1');await p.waitForSelector('#certCanvas:not([hidden])');
 const r=await p.evaluate(async()=>{const m=await import('/learning-studio/certificate-pdf.mjs');const mk=async rec=>{const cv=document.createElement('canvas');await m.drawCertificate(cv,rec);const c=cv.getContext('2d'),S=m.SCALE;
   const ink=(x,y,w,h)=>{const d=c.getImageData(x*S,y*S,w*S,h*S).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]<90&&d[i+1]<90&&d[i+2]<140)n++;return n};
   return {w:cv.width,h:cv.height,name:ink(300,340,680,70),track:ink(450,505,380,45),date:ink(585,585,140,28),time:ink(358,585,110,28),qr:ink(430,690,120,120),cody:ink(60,425,270,260),noWatermark:ink(0,0,1,1)>=0}};
  const empty=await mk({name:'',language:'',issuedAt:''});
  const full=await mk({name:'مريم فؤاد',language:'javascript',issuedAt:'2026-11-27T10:45:00',certId:'0123456789abcdef0123456789abcdef'});return {empty,full}});
 assert.equal(r.full.w,1280*2);assert.equal(r.full.h,853*2);
 for(const k of ['name','track','date','time'])assert(r.full[k]>r.empty[k]+150,k+' slot is filled (ink '+r.empty[k]+' -> '+r.full[k]+')');
 assert(r.full.qr>r.empty.qr+2000,'verification QR is drawn only for an issued number (ink '+r.empty.qr+' -> '+r.full.qr+')');
 assert(r.full.cody>1500,'Cody panel is drawn');
 assert.deepEqual(errs,[]);console.log('certificate template fill regression ok (fixture)',JSON.stringify(r.full));
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
