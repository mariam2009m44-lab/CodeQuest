// Home page academy section matches the real product (static text + link checks, screenshots).
const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright'),fs=require('fs'),path=require('path'),os=require('os');
const root=path.resolve(__dirname,'../..');
test('home page: no outdated academy wording, links go to the merged hub and registration',async()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const bad of ['قريبًا','يتطلب إعداد','ضمن التطوير','ضمن النظام الحالي','بعد تفعيل خدمة البث','live-academy.html','academy-admin','إدارة الأكاديمية']) assert.ok(!html.includes(bad),'stale: '+bad);
 assert.ok(html.includes('academy-hub.html')&&html.includes('academy-registration.html'));
 const b=await chromium.launch();try{for(const [n,w,h] of [['desktop',1280,900],['phone',390,844]]){const p=await b.newPage({viewport:{width:w,height:h}});await p.goto('file://'+path.join(root,'index.html'));await p.waitForTimeout(600);
  const el=p.locator('#live-academy');await el.scrollIntoViewIfNeeded();await el.screenshot({path:path.join(os.tmpdir(),'cq-home-academy-'+n+'.png')});await p.close();}}finally{await b.close()}
});
