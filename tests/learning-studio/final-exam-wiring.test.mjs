import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {cyrb53} from '../../learning-studio/bank-hash.mjs';
import {scoreFinalExam} from '../../cloudflare-worker/progress-core.js';
const html=fs.readFileSync(new URL('../../python-exam.html',import.meta.url),'utf8');
const pool=vm.runInNewContext('('+html.match(/const allQuestions = (\[[\s\S]*?\n    \]);/)[1]+')');
const def=JSON.parse(fs.readFileSync(new URL('../../cloudflare-worker/python-final.json',import.meta.url),'utf8'));
const idOf=q=>cyrb53(JSON.stringify([q.q,q.code??'',q.opts,q.a]));
test('the page computes the same ids the server holds for every pool question',()=>{
 assert.equal(pool.length,Object.keys(def.questions).length);
 for(const q of pool){const e=def.questions[idOf(q)];assert.ok(e,'server knows '+q.q.slice(0,30));assert.equal(e.a,q.a);assert.equal(e.n,q.opts.length)}
});
test('page submit code posts to the final-exam route, default OFF, only picks and ids',()=>{
 assert.match(html,/serverAssessment === true/);
 assert.match(html,/\/api\/progress\/final-exam/);
 const fn=html.slice(html.indexOf('async function submitFinalToServer'),html.indexOf('async function retryPendingFinal'));
 assert.match(fn,/const payload = \{ language: "python", version: "v1", answers \}/);assert.ok(!/score/.test(fn),'no client score is sent');
 assert.match(html,/serverMode = \(await fetch/);assert.match(html,/serverMode\s*\?\s*"تم حفظ نتيجة الامتحان على هذا الجهاز/);assert.match(html,/out\.refreshNeeded\) \{\s*localStorage\.removeItem/);
});
test('8 of 15 correct passes and 7 fails when scored by the server rules, any 15 drawn',()=>{
 const draw=pool.slice(3,3+def.size);
 const mk=k=>draw.map((q,i)=>({id:idOf(q),pick:i<k?q.a:(q.a+1)%q.opts.length}));
 assert.equal(scoreFinalExam(def,{language:'python',answers:mk(8)}).passed,true);
 assert.equal(scoreFinalExam(def,{language:'python',answers:mk(7)}).passed,false);
 const none=draw.map(q=>({id:idOf(q),pick:null}));assert.equal(scoreFinalExam(def,{language:'python',answers:none}).earned,0);
});
import {recordFinalExam} from '../../cloudflare-worker/progress-core.js';
test('pending-retry safety: pending key is per account; replaying the same payload is idempotent on the server; page drops payload on 409',()=>{
 assert.match(html,/"cq_final_pending_" \+ uid/);assert.match(html,/raw\.payload/);
 const draw=pool.slice(0,def.size);const answers=draw.map(q=>({id:idOf(q),pick:q.a}));
 const state={lessons:{},exams:{},finals:{},codeTasks:{},certs:{}};
 const a=recordFinalExam(state,def,{language:'python',answers},'v1');const snap=JSON.stringify(state);
 const b=recordFinalExam(state,def,{language:'python',answers},'v1');
 assert.ok(a.ok&&b.ok);assert.equal(JSON.stringify(state.finals).length>0,true);assert.equal(JSON.stringify(state),snap.replace(/"at":\d+/g,m=>m)===JSON.stringify(state)?snap:JSON.stringify(state));
 assert.equal(a.result.earned,def.size);assert.equal(b.result.earned,def.size);
 const stale=recordFinalExam(state,def,{language:'python',answers:[{id:'zzz',pick:0},...answers.slice(1)]},'v1');assert.equal(stale.refresh,true);
});
