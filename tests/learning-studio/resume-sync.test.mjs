import test from 'node:test';import assert from 'node:assert/strict';import {ResumeSync} from '../../learning-studio/resume-sync.mjs';
const mem=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),m}};
function rig({uid='a',storage=mem(),responses=[],token='t',t0=1000}={}){
 let now=t0;const timers=[];const calls=[];const statuses=[];
 const fetchFn=async(url,opts)=>{calls.push({url,body:JSON.parse(opts.body||'{}'),auth:opts.headers.Authorization});const r=responses.shift();if(r instanceof Error)throw r;return r??{ok:true,status:200,json:async()=>({success:true,stale:false})}};
 const s=new ResumeSync({uid,getToken:async()=>token,storage,fetchFn,endpoint:'https://w',now:()=>now,setTimer:(f,ms)=>{const x={f,ms,live:true};timers.push(x);return x},clearTimer:x=>{if(x)x.live=false},onStatus:x=>statuses.push(x)});
 return {s,calls,timers,statuses,tick:ms=>{now+=ms},storage,fire:async()=>{const x=timers.filter(t=>t.live).pop();x.live=false;await x.f();await new Promise(r=>setImmediate(r))}};
}
const cp=(o={})=>({language:'python',lessonId:'py-1',phase:'practice',draft:'print(1)',...o});
test('writes the device copy immediately, debounces, and the server call happens once',async()=>{
 const r=rig();r.s.checkpoint(cp());r.tick(5);r.s.checkpoint(cp({draft:'print(2)'}));
 assert.equal(r.calls.length,0);assert.equal(r.s.readLocal('python').draft,'print(2)');assert.equal(r.s.readLocal('python').pending,true);
 await r.fire();assert.equal(r.calls.length,1);assert.equal(r.calls[0].body.draft,'print(2)');assert.equal(r.calls[0].auth,'Bearer t');
 assert.equal(r.s.readLocal('python').pending,false);assert.equal(r.s.status,'saved');
});
test('failed save keeps the pending device copy, reports failed, retries with backoff and then saves',async()=>{
 const r=rig({responses:[new Error('net'),{ok:false,status:429,json:async()=>({})}]});r.s.checkpoint(cp());
 await r.fire();assert.equal(r.s.status,'failed');assert.equal(r.s.readLocal('python').pending,true);assert.equal(r.s.readLocal('python').draft,'print(1)');
 await r.fire();assert.equal(r.s.status,'failed');
 await r.fire();assert.equal(r.s.status,'saved');assert.equal(r.s.readLocal('python').pending,false);
 assert.ok(r.timers.filter(t=>t.live===false).length>=3);
});
test('no token or backend off: stays on the device, nothing lost, no failed clutter',async()=>{
 const r=rig({token:null});r.s.checkpoint(cp());await r.fire();
 assert.equal(r.calls.length,0);assert.equal(r.s.status,'device');assert.equal(r.s.readLocal('python').draft,'print(1)');assert.equal(r.s.readLocal('python').pending,true);
});
test('stale reply from the server: newer account checkpoint is adopted, older device copy not pushed over it',async()=>{
 const r=rig({responses:[{ok:true,status:200,json:async()=>({success:true,stale:true,resume:{lessonId:'py-9',phase:'transfer',draft:'NEWER',savedAt:99999}})}]});
 r.s.checkpoint(cp());await r.fire();
 const l=r.s.readLocal('python');assert.equal(l.lessonId,'py-9');assert.equal(l.draft,'NEWER');assert.equal(l.pending,false);
});
test('edit made while a request is in flight is not marked saved',async()=>{
 let release;const r=rig({});r.s.fetchFn=async()=>{await new Promise(x=>release=x);return {ok:true,status:200,json:async()=>({success:true,stale:false})}};
 r.s.checkpoint(cp());const p=r.s.push('python');await new Promise(x=>setImmediate(x));r.tick(10);r.s.checkpoint(cp({draft:'print(3)'}));release();await p;
 assert.equal(r.s.readLocal('python').draft,'print(3)');assert.equal(r.s.readLocal('python').pending,true);
});
test('accounts on one device never mix',()=>{
 const st=mem();const a=rig({uid:'a',storage:st}),b=rig({uid:'b',storage:st});a.s.checkpoint(cp({draft:'A-secret'}));
 assert.equal(b.s.readLocal('python'),null);assert.equal([...st.m.keys()].every(k=>k.includes(':a:')),true);
});
test('languages are separate',()=>{const r=rig();r.s.checkpoint(cp());r.s.checkpoint(cp({language:'java',lessonId:'j-1',draft:'int x;'}));assert.equal(r.s.readLocal('python').draft,'print(1)');assert.equal(r.s.readLocal('java').draft,'int x;')});
test('restore: newer of device and account wins; older account copy never replaces newer device copy',async()=>{
 const r=rig({responses:[{ok:true,status:200,json:async()=>({success:true,resume:{python:{lessonId:'py-5',phase:'worked',draft:'',savedAt:5000}}})}]});
 const got=await r.s.restore('python');assert.equal(got.lessonId,'py-5');assert.equal(got.source,'account');
 const r2=rig({t0:9000,responses:[{ok:true,status:200,json:async()=>({success:true,resume:{python:{lessonId:'old',phase:'worked',draft:'',savedAt:5}}})}]});
 r2.s.checkpoint(cp());const g2=await r2.s.restore('python');assert.equal(g2.lessonId,'py-1');assert.equal(g2.source,'device');
});
test('draft is capped and complete phase stores no draft',()=>{
 const r=rig();r.s.checkpoint(cp({draft:'x'.repeat(30000)}));assert.equal(r.s.readLocal('python').draft.length,20000);
 r.s.checkpoint(cp({phase:'complete'}));assert.equal(r.s.readLocal('python').draft,'');
});
test('corrupt device record is ignored',()=>{const r=rig();r.storage.setItem(r.s.key('python'),'{bad');assert.equal(r.s.readLocal('python'),null)});
