// Academy hub page with a stubbed Worker (LABELED FIXTURE data, not real accounts).
const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright'),fs=require('fs/promises'),path=require('path');const root=path.resolve(__dirname,'../..');
const API=(role)=>`const role=${JSON.stringify(role)};const now=Date.now();
const S=[{id:"s1",title:"نموذج: أساسيات Python",description:"بيانات تجريبية",track:"python",startsAt:now+3600e3,durationMin:60,linkUrl:"https://meet.google.com/abc-defg-hij",ownerName:"مدربة تجريبية",mine:role==="trainer"}];
const G=[{id:"g1",name:"نموذج: مجموعة المبتدئين",description:"",track:"python",ownerName:"مدربة تجريبية",members:3,role:role==="trainer"?"owner":"member",archived:false}];
const M=[{id:"m1",nick:"مدربة تجريبية",role:"trainer",text:"الجلسة غدًا الساعة ٨",kind:"ann",at:1,mine:false},{id:"m2",nick:"نور",role:"student",text:"تمام",kind:"msg",at:2,mine:false}];
export async function academyWorker(u,p){const ok=d=>({ok:true,status:200,data:{success:true,...d},off:false,unreachable:false});
 if(role==="off")return {ok:false,status:503,data:{message:"academy_off"},off:true,unreachable:false};
 if(p==="my-role")return ok({role});if(p==="sessions/list")return ok({sessions:S});if(p==="groups/list")return ok({groups:G});
 if(p==="sessions/code-get")return ok({v:1,changed:true,code:"print('hi')"});
 if(p==="groups/read")return ok({items:M,members:[{uid:"u9",nick:"نور",muted:false}],pending:role==="trainer"?[{uid:"u8",nick:"سلمى",at:1}]:[],role:role==="trainer"?"owner":"member"});
 return ok({});}`;
const STUB=(role)=>({'/js/firebase-config.js':'export const auth={};export const authPersistenceReady=Promise.resolve();','/js/academy-api.js':API(role)});
async function open(role,vp={width:390,height:900}){const b=await chromium.launch();const p=await b.newPage({viewport:vp,deviceScaleFactor:1});const st=STUB(role);
 await p.route('**/*',async r=>{const u=new URL(r.request().url());
  if(u.hostname==='www.gstatic.com'&&u.pathname.includes('firebase-auth'))return r.fulfill({contentType:'application/javascript',body:'export const onAuthStateChanged=(a,cb)=>{setTimeout(()=>cb({uid:"u1"}),0);return()=>{}};'});
  if(u.hostname!=='localhost')return r.abort();
  if(st[u.pathname]!==undefined)return r.fulfill({contentType:'application/javascript',body:st[u.pathname]});
  try{const f=path.join(root,u.pathname);const body=await fs.readFile(f);return r.fulfill({contentType:{'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'}[path.extname(f)]||'application/octet-stream',body})}catch{return r.fulfill({status:404,body:''})}});
 await p.goto('http://localhost:9/academy-hub.html');await p.waitForTimeout(900);return {p,b}}
test('student sees sessions, join link opens in a new tab, code is view-only, groups open a chat with report buttons',async()=>{const {p,b}=await open('student');try{
 assert.equal(await p.isHidden('#sessionCreate'),true);const a=p.locator('#sessionList a');assert.equal(await a.getAttribute('target'),'_blank');assert.match(await a.getAttribute('rel'),/noopener/);
 await p.screenshot({path:require('os').tmpdir()+'/hub-student-sessions.png'});
 await p.click('#sessionList button:has-text("عرض كود المدرب")');await p.waitForTimeout(300);assert.match(await p.textContent('#codeView'),/print/);assert.equal(await p.isHidden('#codeEditor'),true);
 await p.click('#tabGroups');await p.waitForTimeout(300);await p.click('#groupList button:has-text("فتح المحادثة")');await p.waitForTimeout(500);
 assert.equal(await p.locator('.hub-msg').count(),2);assert.equal(await p.locator('.hub-msg.ann').count(),1);assert.ok(await p.locator('.hub-msg button:has-text("إبلاغ")').count()>=1);assert.equal(await p.isHidden('#manage'),true);assert.equal(await p.isHidden('#annLabel'),true);
 await p.screenshot({path:require('os').tmpdir()+'/hub-student-chat.png'})}finally{await b.close()}});
test('trainer sees create forms, announcement toggle and join requests',async()=>{const {p,b}=await open('trainer');try{
 assert.equal(await p.isVisible('#sessionCreate'),true);await p.click('#tabGroups');await p.waitForTimeout(300);assert.equal(await p.isVisible('#groupCreate'),true);
 await p.click('#groupList button:has-text("فتح المحادثة")');await p.waitForTimeout(500);assert.equal(await p.isVisible('#annLabel'),true);assert.match(await p.textContent('#pendingList'),/سلمى/);
 await p.screenshot({path:require('os').tmpdir()+'/hub-trainer-chat.png',fullPage:true})}finally{await b.close()}});
test('server switch off shows the clean Arabic line, never a raw code',async()=>{const {p,b}=await open('off');try{const t=await p.textContent('#hubState');assert.match(t,/لم تُفتح بعد/);assert.doesNotMatch(t,/internal|academy_off/);assert.equal(await p.isHidden('#hubBody'),true)}finally{await b.close()}});
