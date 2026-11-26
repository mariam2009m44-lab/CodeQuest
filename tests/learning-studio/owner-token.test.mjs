import test from 'node:test';import assert from 'node:assert/strict';
import {postDurable,ownerBound} from '../../learning-studio/progress-api.mjs';
const jwt=sub=>'h.'+Buffer.from(JSON.stringify({sub})).toString('base64url')+'.s';
const mem=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}};
test('token for another account is withheld',async()=>{assert.equal(await ownerBound('A',async()=>jwt('B'))(false),null);assert.equal(await ownerBound('A',async()=>jwt('A'))(false),jwt('A'))});
test('postDurable never sends B token for A record, keeps it queued for A',async()=>{
 const st=mem();let sent=0;
 const r=await postDurable({uid:'A',storage:st,key:'k',enabled:true,getToken:async()=>jwt('B'),fetchFn:async()=>{sent++;return {ok:true,status:200,json:async()=>({})}},path:'/api/progress/exam',payload:{x:1}});
 assert.equal(sent,0);assert.notEqual(r.state,'saved');assert.ok(st.getItem('cq_pending_A'));assert.equal(st.getItem('cq_pending_B'),null)});
