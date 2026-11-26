import fs from 'node:fs';import {test} from 'node:test';import assert from 'node:assert/strict';
import {postProgress,examPayload,codeTaskPayload} from '../../learning-studio/progress-api.mjs';
const quizzes=JSON.parse(fs.readFileSync(new URL('../../learning-studio/quizzes.json',import.meta.url),'utf8'));
const idx=JSON.parse(fs.readFileSync(new URL('../../cloudflare-worker/curriculum-index.json',import.meta.url),'utf8'));
const feats=JSON.parse(fs.readFileSync(new URL('../../learning-studio/features.json',import.meta.url),'utf8'));
test('serverAssessment flag is ON (owner-approved global activation 2026-11-26) and the unrelated flags stay OFF',()=>{assert.equal(feats.serverAssessment,true);assert.equal(feats.certificateIssue,true);assert.equal(feats.unitProjects,false);assert.equal(feats.accountEvidence,false)});
test('disabled sends nothing',async()=>{let n=0;const r=await postProgress({enabled:false,getToken:async()=>'t',fetchFn:async()=>{n++},path:'/x',payload:{a:1}});assert.equal(n,0);assert.equal(r.reason,'disabled')});
test('exam payload carries picks and the bank hash the server stores, never a score',()=>{
 const q=quizzes['python-1'];const p=examPayload({language:'python',unit:1,quiz:q,answers:[{picked:0,correct:true},{picked:2},{},{correct:true}]});
 assert.deepEqual(p.choices,[0,2,null]);assert.equal(p.bank,idx.quizzes['python-1'].h);assert.deepEqual(Object.keys(p).sort(),['bank','choices','language','unit','version']);
});
test('code-task payload uses the code index and rejects empty code',()=>{
 const q=quizzes['python-1'];const p=codeTaskPayload({language:'python',unit:1,quiz:q,item:0,code:'print(1)'});
 assert.equal(p.bank,idx.quizzes['python-1'].h);assert.equal(p.item,0);assert.equal(codeTaskPayload({language:'python',unit:1,quiz:q,item:0,code:'  '}),null);assert.equal(codeTaskPayload({language:'python',unit:1,quiz:q,item:5,code:'x'}),null);
});
test('statuses map to refresh-needed / retryable / failure',async()=>{
 const go=status=>postProgress({enabled:true,getToken:async()=>'t',fetchFn:async()=>({ok:status<400,status,json:async()=>({})}),path:'/x',payload:{}});
 assert.equal((await go(409)).refreshNeeded,true);assert.equal((await go(503)).retryable,true);assert.equal((await go(429)).retryable,true);assert.equal((await go(401)).ok,false);assert.equal((await go(200)).ok,true);
 assert.equal((await postProgress({enabled:true,getToken:async()=>null,fetchFn:async()=>{},path:'/x',payload:{}})).reason,'no-token');
});
