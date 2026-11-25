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
 assert.match(html,/features\.serverAssessment !== true\) return/);
 assert.match(html,/\/api\/progress\/final-exam/);
 const fn=html.slice(html.indexOf('async function submitFinalToServer'),html.indexOf('// إعادة الامتحان'));
 assert.ok(!/score|passed/.test(fn.replace(/serverAssessment|submitFinalToServer/g,'')),'no client score is sent');
});
test('8 of 15 correct passes and 7 fails when scored by the server rules, any 15 drawn',()=>{
 const draw=pool.slice(3,3+def.size);
 const mk=k=>draw.map((q,i)=>({id:idOf(q),pick:i<k?q.a:(q.a+1)%q.opts.length}));
 assert.equal(scoreFinalExam(def,{language:'python',answers:mk(8)}).passed,true);
 assert.equal(scoreFinalExam(def,{language:'python',answers:mk(7)}).passed,false);
 const none=draw.map(q=>({id:idOf(q),pick:null}));assert.equal(scoreFinalExam(def,{language:'python',answers:none}).earned,0);
});
