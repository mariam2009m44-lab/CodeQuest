// Academy hub page with a stubbed Worker (LABELED FIXTURE data, not real accounts).
const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright'),fs=require('fs/promises'),path=require('path');const root=path.resolve(__dirname,'../..');
const API=(role)=>`globalThis.__calls=[];const role=${JSON.stringify(role)};const now=Date.now();
const S=[{id:"s1",title:"نموذج: أساسيات Python",description:"بيانات تجريبية",track:"python",startsAt:now+3600e3,durationMin:60,linkUrl:"https://meet.google.com/abc-defg-hij",ownerName:"مدربة تجريبية",mine:role==="trainer"}];
const G=[...(role==="admin"?[{id:"gA",name:"نموذج: مجتمع كبير",description:"",track:"python",ownerName:"الإدارة",members:40,cap:256,role:"admin",archived:false,lastAt:1}]:[]),{id:"g1",name:"نموذج: مجموعة المبتدئين",description:"",track:"python",ownerName:"مدربة تجريبية",members:3,role:role==="trainer"?"owner":"member",archived:false,lastAt:2},{id:"g2",name:"نموذج: أساسيات جافاسكربت",description:"",track:"javascript",ownerName:"مدرب تجريبي",members:5,role:"none",archived:false,rejected:role==="student"}];
const M=[{id:"m1",nick:"مدربة تجريبية",role:"trainer",text:"الجلسة غدًا الساعة ٨",kind:"ann",at:1,mine:false},{id:"m2",nick:"نور",role:"student",text:"تمام",kind:"msg",at:2,mine:false}];
export async function academyWorker(u,p,body){const ok=d=>({ok:true,status:200,data:{success:true,...d},off:false,unreachable:false});
 if(role==="off")return {ok:false,status:503,data:{message:"academy_off"},off:true,unreachable:false};
 if(p==="my-role")return ok({role});if(p==="sessions/list")return ok({sessions:S});if(p==="trainers/list")return ok({trainers:[{name:"نموذج: مدرّس بايثون",specialties:["python","web"],levels:["beginner"],ageGroups:["10-12"],bio:"بيانات تجريبية للعرض فقط.",groups:1}]});if(p==="groups/list")return ok({groups:G});
 if(p==="assignments/list")return ok({role:role==="trainer"?"owner":"member",items:[{id:"a1",title:"نموذج: تمرين الحلقات",text:"بيانات تجريبية",due:now+864e5,done:false,doneCount:1,doneNames:["نور"],memberCount:3}]});if(p==="assignments/create"||p==="assignments/mark")globalThis.__calls.push([p,body]);
 if(p==="sessions/code-get")return ok({v:1,changed:true,code:"print('hi')"});
 if(p==="groups/read")return ok({items:M,members:[{uid:"u9",nick:"نور",muted:false},{uid:"u7",nick:"ليلى",muted:false,co:true}],group:{cap:p==="groups/read"&&role==="admin"?256:8},pending:role==="trainer"?[{uid:"u8",nick:"سلمى",at:1}]:[],role:role==="trainer"?"owner":role==="admin"?"admin":"member"});
 if(p==="sessions/create"||p==="groups/post"||p==="sessions/attend")globalThis.__calls.push([p,body]);return ok({});}`;
const STUB=(role)=>({'/js/firebase-config.js':'export const auth={};export const authPersistenceReady=Promise.resolve();','/js/academy-api.js':API(role)});
async function open(role,vp={width:390,height:900}){const b=await chromium.launch();const p=await b.newPage({viewport:vp,deviceScaleFactor:1});const st=STUB(role);
 await p.route('**/*',async r=>{const u=new URL(r.request().url());
  if(u.hostname==='www.gstatic.com'&&u.pathname.includes('firebase-auth'))return r.fulfill({contentType:'application/javascript',body:'export const onAuthStateChanged=(a,cb)=>{setTimeout(()=>cb({uid:"u1"}),0);return()=>{}};'});
  if(u.hostname!=='localhost')return r.abort();
  if(st[u.pathname]!==undefined)return r.fulfill({contentType:'application/javascript',body:st[u.pathname]});
  try{const f=path.join(root,u.pathname);const body=await fs.readFile(f);return r.fulfill({contentType:{'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'}[path.extname(f)]||'application/octet-stream',body})}catch{return r.fulfill({status:404,body:''})}});
 await p.goto('http://localhost:9/academy-hub.html');await p.waitForTimeout(900);return {p,b}}
test('student sees sessions, join link opens in a new tab, code is view-only, groups open a chat with report buttons',async()=>{const {p,b}=await open('student');try{
 await p.dispatchEvent('#tabSessions','click');await p.waitForTimeout(300);assert.equal(await p.isHidden('#sessionCreate'),true);const a=p.locator('#sessionList a');assert.equal(await a.getAttribute('target'),'_blank');assert.match(await a.getAttribute('rel'),/noopener/);
 await p.screenshot({path:require('os').tmpdir()+'/hub-student-sessions.png'});
 await p.click('#sessionList button:has-text("عرض كود المدرب")');await p.waitForTimeout(300);assert.match(await p.textContent('#codeView'),/print/);assert.equal(await p.isHidden('#codeEditor'),true);
 await p.dispatchEvent('#tabChats','click');await p.waitForTimeout(300);await p.click('#groupList .wa-row.wa-row');await p.waitForTimeout(500);
 assert.equal(await p.locator('.hub-msg').count(),2);assert.equal(await p.locator('.hub-msg.ann').count(),1);assert.ok(await p.locator('.hub-msg button:has-text("إبلاغ")').count()>=1);assert.equal(await p.isHidden('#manage'),true);assert.equal(await p.isHidden('#annLabel'),true);
 await p.screenshot({path:require('os').tmpdir()+'/hub-student-chat.png'})}finally{await b.close()}});
test('trainer sees create forms, announcement toggle and join requests',async()=>{const {p,b}=await open('trainer');try{
 await p.dispatchEvent('#tabSessions','click');await p.waitForTimeout(300);assert.equal(await p.isVisible('#sessionCreate'),true);await p.dispatchEvent('#tabGroups','click');await p.waitForTimeout(300);assert.equal(await p.isVisible('#groupCreate'),true);await p.dispatchEvent('#tabChats','click');await p.waitForTimeout(300);
 await p.click('#groupList .wa-row.wa-row');await p.waitForTimeout(500);assert.equal(await p.isVisible('#annLabel'),true);assert.match(await p.textContent('#pendingList'),/سلمى/);
 await p.screenshot({path:require('os').tmpdir()+'/hub-trainer-chat.png',fullPage:true})}finally{await b.close()}});
test('server switch off shows the clean Arabic line, never a raw code',async()=>{const {p,b}=await open('off');try{const t=await p.textContent('#hubState');assert.match(t,/لم تُفتح بعد/);assert.doesNotMatch(t,/internal|academy_off/);assert.equal(await p.isHidden('#hubBody'),true)}finally{await b.close()}});

test('safety rules are visible and state joining by request and nickname-only',async()=>{const {p,b}=await open('student');try{await p.click('#safetyRules summary');const t=await p.textContent('#safetyRules');assert.doesNotMatch(t,/8 طلاب/);assert.match(t,/لقب/);assert.match(t,/بطلب فقط/)}finally{await b.close()}});
test('assignments: student ticks done, trainer sees the count and can post',async()=>{
 const st=await open('student',{width:1100,height:900});try{await st.p.dispatchEvent('#tabChats','click');await st.p.waitForTimeout(300);await st.p.click('#groupList .wa-row >> nth=0');await st.p.click('#stWork');await st.p.waitForTimeout(300);assert.match(await st.p.textContent('#workList'),/تمرين الحلقات/);assert.equal(await st.p.isVisible('#workBtn'),false);await st.p.click('#workList button');await st.p.waitForTimeout(200);assert.ok((await st.p.evaluate(()=>globalThis.__calls||[])).some(c=>c[0]==='assignments/mark'&&c[1].on===true))}finally{await st.b.close()}
 const tr=await open('trainer',{width:1100,height:900});try{await tr.p.dispatchEvent('#tabChats','click');await tr.p.waitForTimeout(300);await tr.p.click('#groupList .wa-row >> nth=0');await tr.p.click('#stWork');await tr.p.waitForTimeout(300);assert.match(await tr.p.textContent('#workList'),/أنجز 1 من 3/);await tr.p.click('#workBtn');await tr.p.fill('#workForm [name=title]','نموذج: واجب جديد');await tr.p.screenshot({path:require('os').tmpdir()+'/hub-desktop-work.png',fullPage:true});await tr.p.click('#workForm button[type=submit]');await tr.p.waitForTimeout(300);assert.ok((await tr.p.evaluate(()=>globalThis.__calls||[])).some(c=>c[0]==='assignments/create'&&c[1].title.includes('واجب')))}finally{await tr.b.close()}});
test('next step: each role sees one clear instruction; messages show per-sender names; nickname dialog replaces the prompt',async()=>{
 const st=await open('student',{width:1100,height:900});try{
  assert.match(await st.p.textContent('#nextStep'),/افتح محادثة مجموعتك/);assert.equal(await st.p.isVisible('.cq-start-guide'),false);
  await st.p.dispatchEvent('#tabChats','click');await st.p.waitForTimeout(300);await st.p.click('#groupList .wa-row >> nth=0');await st.p.waitForTimeout(500);
  const names=await st.p.$$eval('#chatMessages .hub-msg b',e=>e.map(x=>x.textContent));assert.ok(names.some(n=>n.includes('نور')),'sender name shown');assert.ok(names.some(n=>n.includes('المدرب')||n.includes('مدربة')),'trainer tag shown');
  assert.equal(await st.p.isVisible('#leaveBtn'),false);await st.p.click('#stPeople');assert.equal(await st.p.isVisible('#leaveBtn'),true);
  await st.p.screenshot({path:require('os').tmpdir()+'/hub-student-next.png',fullPage:true})}finally{await st.b.close()}
 const tr=await open('trainer',{width:1100,height:900});try{assert.match(await tr.p.textContent('#nextStep'),/أدر مجموعتك/)}finally{await tr.b.close()}});
test('next step covers visitors with no profile, pending guardian and admin',async()=>{
 for(const [r,re] of [['none',/أكمل التسجيل/],['student_pending',/بانتظار تأكيد ولي الأمر/],['admin',/لوحة الإدارة/]]){const x=await open(r);try{assert.match(await x.p.textContent('#nextStep'),re,r);if(r!=='admin')assert.equal(await x.p.isVisible('#hubBody'),false,r);if(r==='none')await x.p.screenshot({path:require('os').tmpdir()+'/hub-none-next.png',fullPage:true})}finally{await x.b.close()}}});
test('unread badge shows until the group is opened; a rejected request says so and can be re-sent',async()=>{
 const st=await open('student',{width:1100,height:900});try{await st.p.dispatchEvent('#tabChats','click');await st.p.waitForTimeout(300);
  assert.equal(await st.p.locator('#groupList .hub-new').count(),1);assert.match(await st.p.textContent('#groupDir'),/لم يُقبل طلبك/);assert.match(await st.p.textContent('#groupDir'),/اطلب مجددًا/);
  await st.p.click('#groupList .wa-row >> nth=0');await st.p.waitForTimeout(500);
  await st.p.reload();await st.p.waitForTimeout(800);await st.p.dispatchEvent('#tabChats','click');await st.p.waitForTimeout(300);
  assert.equal(await st.p.locator('#groupList .hub-new').count(),0)}finally{await st.b.close()}});
test('chat-app layout: desktop two panes, mobile one pane at a time; trainer starts a live session from the group',async()=>{
 const {p,b}=await open('trainer',{width:1280,height:900});try{
  assert.equal(await p.locator('#groupList .wa-row').count(),1);await p.dispatchEvent('#tabChats','click');await p.waitForTimeout(300);
  assert.equal(await p.isVisible('#waEmpty'),true);await p.click('#groupList .wa-row >> nth=0');await p.waitForTimeout(500);
  assert.equal(await p.isVisible('#chat'),true);assert.equal(await p.isVisible('#groupList'),true);
  await p.click('#stSched');await p.click('#liveBtn');await p.selectOption('#liveForm [name=kind]','demo');await p.fill('#liveForm [name=title]','نموذج: شرح الحلقات');await p.fill('#liveForm [name=linkUrl]','https://meet.google.com/abc-defg-hij');
  await p.screenshot({path:require('os').tmpdir()+'/hub-desktop-trainer.png',fullPage:true});
  await p.click('#liveForm button[type=submit]');await p.waitForTimeout(500);
  await p.click('#stChat');
  assert.ok(await p.isVisible('#pinned'),'latest announcement is pinned');await p.click('#stPeople');assert.ok(await p.isVisible('#memberList'));await p.screenshot({path:require('os').tmpdir()+'/hub-desktop-people.png',fullPage:true});
  const calls=await p.evaluate(()=>globalThis.__calls||[]);
  assert.ok(calls.some(c=>c[0]==='sessions/create'&&c[1].groupId==='g1'&&/meet\.google/.test(c[1].linkUrl)));
  assert.ok(calls.some(c=>c[0]==='groups/post'&&c[1].kind==='ann'));
 }finally{await b.close()}
 const m=await open('student',{width:390,height:844});try{
  await m.p.dispatchEvent('#tabChats','click');await m.p.waitForTimeout(300);assert.equal(await m.p.isVisible('#groupList'),true);assert.equal(await m.p.isVisible('#chat'),false);
  await m.p.screenshot({path:require('os').tmpdir()+'/hub-mobile-list.png'});
  await m.p.click('#groupList .wa-row >> nth=0');await m.p.waitForTimeout(500);assert.equal(await m.p.isVisible('#groupList'),false);assert.equal(await m.p.isVisible('#chat'),true);
  assert.equal(await m.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
  await m.p.screenshot({path:require('os').tmpdir()+'/hub-mobile-chat.png'});
  await m.p.click('#chatClose');await m.p.waitForTimeout(300);assert.equal(await m.p.isVisible('#groupList'),true);
 }finally{await m.b.close()}});
test('old community URL points to the academy hub and keeps no dead directory',async()=>{
 const html=await fs.readFile(path.join(root,'academy-community.html'),'utf8');
 assert.match(html,/http-equiv="refresh" content="1;url=academy-hub\.html"/);assert.match(html,/href="academy-hub\.html"/);assert.doesNotMatch(html,/جارٍ تحميل|<script src="js\/academy-community/);
});

test('merged community: trainers tab, group cards with real counts, profile dialog, bottom nav',async()=>{const {p,b}=await open('student',{width:390,height:844});try{
 await p.dispatchEvent('#tabTrainers','click');await p.waitForSelector('#trainerList .hub-trainer');assert.equal(await p.locator('#trainerList .hub-trainer').count(),1);
 assert.equal(await p.isVisible('#bottomNav'),true);
 await p.click('#trainerList .hub-trainer button');assert.equal(await p.isVisible('#trDlg'),true);assert.match(await p.textContent('#trSpec'),/Python/);
 await p.screenshot({path:require('os').tmpdir()+'/cq-merge-profile.png'});await p.click('#trClose');
 await p.screenshot({path:require('os').tmpdir()+'/cq-merge-trainers.png',fullPage:true});
 await p.click('#bottomNav [data-tab=groups]');await p.waitForSelector('#groupDir .hub-group');assert.ok(await p.locator('#groupDir .hub-seats').first().textContent().then(t=>/عضو/.test(t)));
 await p.screenshot({path:require('os').tmpdir()+'/cq-merge-groups.png',fullPage:true});
 await p.click('#bottomNav [data-tab=chats]');await p.waitForSelector('#groupList .wa-row');
 await p.screenshot({path:require('os').tmpdir()+'/cq-merge-chats.png',fullPage:true});
}finally{await b.close();}});

test('admin group: no 8 cap text, member list, supervisor and delete controls (fixture)',async()=>{const {p,b}=await open('admin',{width:1100,height:900});try{
 await p.dispatchEvent('#tabGroups','click');await p.waitForSelector('#groupDir .hub-group');
 assert.match(await p.textContent('#groupDir'),/40 عضو/);assert.doesNotMatch(await p.textContent('#groupDir'),/من 8/);
 await p.dispatchEvent('#tabChats','click');await p.click('#groupList .wa-row >> nth=0');await p.waitForTimeout(500);await p.click('#stPeople');await p.waitForTimeout(300);
 assert.match(await p.textContent('#memberList'),/ليلى · مشرف/);assert.ok(await p.locator('#memberList button:has-text("تعيين مشرف")').count()>=1);
 assert.equal(await p.isVisible('#delGroupBtn'),true);
 await p.screenshot({path:require('os').tmpdir()+'/cq-admin-group.png'});
}finally{await b.close();}});
