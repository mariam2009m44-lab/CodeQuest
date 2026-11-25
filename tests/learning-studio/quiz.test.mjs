import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {summarize,gradeCode,outputMatches,normalizeOutput,BANDS} from '../../learning-studio/quiz-core.mjs';
const Q=JSON.parse(fs.readFileSync(new URL('../../learning-studio/quizzes.json',import.meta.url)));
const units=JSON.parse(fs.readFileSync(new URL('../../learning-studio/units.json',import.meta.url)));
test('every unit has a quiz with graded questions tied to its own lessons',()=>{
 for(const u of units){const q=Q[u.language+'-'+u.unit];assert.ok(q,u.language+u.unit);assert.ok(q.mcq.length>=2&&q.code.length>=1);
  const ids=new Set(u.lessons.map(l=>l.id));
  for(const it of [...q.mcq,...q.code])assert.ok(ids.has(it.lesson),it.lesson);
  for(const m of q.mcq){assert.ok(m.options.length>=3&&new Set(m.options).size===m.options.length);assert.ok(m.answer>=0&&m.answer<m.options.length);assert.ok(m.why.length>5)}
  for(const c of q.code){assert.ok(c.tests.length>=1&&c.reference&&c.tests.every(t=>typeof t.expected==='string'&&t.expected.length));assert.notEqual(c.starter.trim(),c.reference.trim())}}
});
test('score counts graded answers only, with code weighted 2',()=>{
 const items=[{kind:'mcq',lesson:'a'},{kind:'mcq',lesson:'b'},{kind:'code',lesson:'c'}];
 assert.deepEqual(summarize(items,[{correct:true},{correct:false},{correct:true}]),{earned:3,total:4,percent:75,band:'جيد جدًا',missedLessons:['b']});
 assert.equal(summarize(items,[{correct:true},{correct:true},{correct:true}]).percent,100);
 assert.equal(summarize(items,[]).percent,0);assert.equal(summarize(items,[]).band,'محتاج مراجعة');
});
test('output compare ignores trailing whitespace/newlines only',()=>{assert.ok(outputMatches('8\r\nGo  \n\n','8\nGo'));assert.ok(!outputMatches('8 Go','8\nGo'));assert.ok(!outputMatches('9\nGo','8\nGo'))});
test('code grading needs every case to pass and fails closed on errors',async()=>{
 const item={tests:[{stdin:'1',expected:'1'},{stdin:'2',expected:'2'}]};
 assert.equal((await gradeCode(item,'x',async(c,i)=>({ok:true,stdout:i+'\n'}))).passed,true);
 assert.equal((await gradeCode(item,'x',async()=>({ok:true,stdout:'1'}))).passed,false);
 const bad=await gradeCode(item,'x',async()=>({ok:false,stdout:'',message:'boom'}));assert.equal(bad.passed,false);assert.equal(bad.ran,false);
 const thr=await gradeCode(item,'x',async()=>{throw new Error('net')});assert.equal(thr.passed,false);
});

import {spawnSync} from 'node:child_process';
import {writeFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {gradeCode as gradeHidden} from '../../learning-studio/quiz-core.mjs';
test('function tasks run hidden extra calls: reference passes, hardcoded and wrong solutions fail',async()=>{
 const q=Q;
 const dir=mkdtempSync(join(tmpdir(),'qz-'));
 const runner=lang=>async(code)=>{const f=join(dir,lang==='python'?'a.py':'a.js');writeFileSync(f,code);const r=spawnSync(lang==='python'?'python3':'node',[f],{encoding:'utf8',timeout:10000});return {ok:r.status===0,stdout:r.stdout,message:r.stderr}};
 const cases=[['python-7','python','def add(x, y):\n    return x - y\nprint(13)','def add(x, y):\n    return x + y\nprint(add(8, 5))'],['python-12','python','print("Nova - 3")','def card(name, level):\n    return name + " - " + str(level)\nprint(card("Nova", 3))'],['javascript-5','javascript','function add(x, y) { return 13; }\nconsole.log(add(8, 5));','const add = (a, b) => a + b;\nconsole.log(add(8, 5));']];
 for(const [k,lang,bad,alt] of cases){const item=q[k].code[0];assert.ok(item.tests.some(t=>t.append),k+' has hidden calls');
  assert.equal((await gradeHidden(item,item.reference,runner(lang))).passed,true,k+' reference');
  assert.equal((await gradeHidden(item,bad,runner(lang))).passed,false,k+' hardcoded/wrong rejected');
  assert.equal((await gradeHidden(item,alt,runner(lang))).passed,true,k+' alternative valid program accepted');}
});

import {byLesson as _byLesson} from '../../learning-studio/quiz-core.mjs';
import _test from 'node:test';import _assert from 'node:assert/strict';
_test('byLesson groups weighted scores per lesson',()=>{
 const items=[{lesson:'a',kind:'mcq'},{lesson:'a',kind:'code'},{lesson:'b',kind:'mcq'}];
 const r=_byLesson(items,[{correct:true},{correct:false},{correct:false}]);
 _assert.deepEqual(r.map(x=>[x.lesson,x.earned,x.total,x.percent]),[['a',1,3,33],['b',0,1,0]]);
});
