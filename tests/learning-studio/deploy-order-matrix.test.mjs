// Client-side half of the deploy-order matrix. Server responses are SIMULATED (fake fetch): no real Worker is involved.
import {test} from 'node:test';import assert from 'node:assert/strict';
import {postProgress} from '../../learning-studio/progress-api.mjs';
const run=(enabled,fetchFn,getToken=async()=>'t')=>postProgress({enabled,getToken,fetchFn,path:'/api/progress/lesson-test',payload:{a:1}});
const resp=(status,body={})=>async()=>({ok:status>=200&&status<300,status,json:async()=>body});
test('new page, flag OFF, any server: no network call at all',async()=>{let n=0;for(const s of [200,404,500]){await run(false,async()=>{n++;return resp(s)()})}assert.equal(n,0)});
test('new page, flag ON, OLD Worker (route missing, 404): soft failure, never throws, no retry',async()=>{let n=0;const r=await run(true,async()=>{n++;return resp(404)()});assert.equal(n,1);assert.equal(r.ok,false);assert.equal(r.status,404);assert.ok(!r.refreshNeeded&&!r.retryable)});
test('new page, flag ON, NEW Worker but stale cached page bank (409): refresh needed, same payload is not resent',async()=>{let n=0;const r=await run(true,async()=>{n++;return resp(409)()});assert.equal(n,1);assert.equal(r.refreshNeeded,true)});
test('new Worker busy (429/503): marked retryable for the caller, one attempt per call',async()=>{for(const s of [429,503]){let n=0;const r=await run(true,async()=>{n++;return resp(s)()});assert.equal(n,1);assert.equal(r.retryable,true)}});
test('network failure and signed-out learner never throw',async()=>{assert.equal((await run(true,async()=>{throw new Error('x')})).reason,'network');assert.equal((await run(true,async()=>{},async()=>null)).reason,'no-token');assert.equal((await run(true,async()=>{},async()=>{throw new Error('a')})).reason,'network')});
test('success returns server data only',async()=>{const r=await run(true,resp(200,{success:true,passed:true}));assert.equal(r.ok,true);assert.equal(r.data.passed,true)});
