const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright'),fs=require('fs/promises'),path=require('path');const root=path.resolve(__dirname,'../..');
// Client side of the reminder: stubbed Worker and push service. Real push delivery is NOT tested here (needs a real browser push service).
test('enablePush subscribes with the Worker key and registers time and zone; disablePush unsubscribes',async()=>{
 const b=await chromium.launch();const p=await b.newPage();const posts=[];
 await p.route('**/*',async r=>{const u=r.request().url();
  if(u.endsWith('/js/push-reminders.js'))return r.fulfill({contentType:'application/javascript',body:await fs.readFile(root+'/js/push-reminders.js','utf8')});
  if(u.includes('/api/push/key'))return r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({success:true,publicKey:'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM'})});
  if(u.includes('/api/push/')){posts.push({u,body:r.request().postData(),auth:r.request().headers().authorization});return r.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:'{"success":true}'})}
  return r.fulfill({contentType:'text/html',body:'<p>x</p>'})});
 await p.goto('http://localhost:9/');
 await p.evaluate(()=>{let subscribed=null;const sub={endpoint:'https://fcm.googleapis.com/fcm/send/test',options:{applicationServerKey:null},unsubscribe:async()=>{window.__unsub=true;subscribed=null}};
  Object.defineProperty(window,'Notification',{value:{permission:'granted'},configurable:true});
  Object.defineProperty(navigator,'serviceWorker',{value:{register:async()=>({}),ready:Promise.resolve({pushManager:{getSubscription:async()=>subscribed,subscribe:async o=>{window.__key=o.applicationServerKey.length;subscribed=sub;return sub}}}),getRegistration:async()=>({pushManager:{getSubscription:async()=>subscribed}})},configurable:true});
  window.PushManager=function(){}});
 const out=await p.evaluate(async()=>{const m=await import('http://localhost:9/js/push-reminders.js');const user={getIdToken:async()=>'tok'};const a=await m.enablePush(user,'18:00');await m.disablePush(user);return {a,key:window.__key,unsub:window.__unsub}});
 assert.equal(out.a.ok,true);assert.equal(out.key,65);assert.equal(out.unsub,true);
 const sub=posts.find(x=>x.u.endsWith('/subscribe'));assert.equal(sub.auth,'Bearer tok');const body=JSON.parse(sub.body);assert.equal(body.time,'18:00');assert.ok(body.tz);assert.deepEqual(Object.keys(body).sort(),['endpoint','time','tz']);
 assert.ok(posts.some(x=>x.u.endsWith('/unsubscribe')));await b.close()});
test('without notification permission nothing is subscribed',async()=>{const b=await chromium.launch();const p=await b.newPage();let hit=0;
 await p.route('**/*',async r=>{const u=r.request().url();if(u.endsWith('/js/push-reminders.js'))return r.fulfill({contentType:'application/javascript',body:await fs.readFile(root+'/js/push-reminders.js','utf8')});if(u.includes('/api/push/'))hit++;return r.fulfill({contentType:'text/html',body:'<p>x</p>'})});
 await p.goto('http://localhost:9/');await p.evaluate(()=>{Object.defineProperty(window,'Notification',{value:{permission:'denied'},configurable:true});window.PushManager=function(){}});
 const r=await p.evaluate(async()=>(await import('http://localhost:9/js/push-reminders.js')).enablePush({getIdToken:async()=>'t'},'18:00'));assert.equal(r.ok,false);assert.equal(r.reason,'permission');assert.equal(hit,0);await b.close()});
