const{chromium}=require('playwright'),fs=require('fs/promises'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
(async()=>{const b=await chromium.launch();try{
for(const width of [390,1280]){const p=await b.newPage({viewport:{width,height:950}});let proofCalls=0;
await p.route('**/*',async r=>{const u=new URL(r.request().url());
if(u.pathname==='/js/auth.js')return r.fulfill({contentType:'text/javascript',body:'export const requireUser=async()=>({uid:"a"})'});
if(u.pathname==='/js/firebase-config.js')return r.fulfill({contentType:'text/javascript',body:'export const auth={currentUser:{uid:"a"}},functions={}'});
if(u.pathname.endsWith('firebase-auth.js'))return r.fulfill({contentType:'text/javascript',body:'export const onAuthStateChanged=()=>()=>{}'});
if(u.pathname.endsWith('firebase-functions.js')){proofCalls++;return r.fulfill({contentType:'text/javascript',body:'export const httpsCallable=()=>async()=>{throw Error("called")}'})}
if(u.pathname.endsWith('execution.mjs'))return r.fulfill({contentType:'text/javascript',body:'export const selectExecutor=async()=>async()=>({ok:true,stdout:"Ready\\n"})'});
try{const file=path.join(root,u.pathname);return r.fulfill({contentType:({'.html':'text/html','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream',body:await fs.readFile(file)})}catch{return r.fulfill({status:404,body:'missing'})}});
await p.addInitScript(()=>{window.studioAccountUser={uid:'a'}});
await p.goto('https://studio.test/learning.html?lang=python');
await p.waitForSelector('#accountProgress');await p.waitForTimeout(800);
const text=await p.textContent('#accountProgress');
assert.match(text,/لم يُفعّل بعد/);assert.doesNotMatch(text,/محفوظ للحساب|تم الحفظ/);
assert.equal(await p.locator('#retryProgress').isVisible(),false);assert.equal(proofCalls,0);
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await p.goto('https://studio.test/learning.html?lang=java');await p.waitForSelector('#dialogue .msg.cody');
assert.equal(await p.locator('#dialogue .msg.cody').count(),2,'intro plus first question from Cody');assert.equal(await p.locator('#dialogue .choices').count(),1);assert.equal(await p.locator('#dialogue .msg.student').count(),0);
await p.locator('#dialogue .choices').first().locator('button').nth(1).click();
assert.equal(await p.locator('#dialogue .msg.student').count(),1,'student bubble shows the chosen answer');assert.equal(await p.locator('#dialogue .msg.retry').count(),1);assert.equal(await p.locator('#dialogue .choices').count(),1,'next turn waits for a fitting answer');
await p.locator('#dialogue .choices').first().locator('button').nth(0).click();
assert.equal(await p.locator('#dialogue .msg.fit').count(),1);assert.equal(await p.locator('#dialogue .choices').count(),2,'second turn appears after a fitting answer');assert.match(await p.textContent('#dialogue .msg.fit'),/\S{4,}/);
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no overflow with dialogue');
if(process.env.SHOT)await p.screenshot({path:`${process.env.SHOT}-${width}.png`});
await p.close()}}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
