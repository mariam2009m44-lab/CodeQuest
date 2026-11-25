import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {validateItem,scoreLessonTest,QUESTIONS_PER_LESSON} from '../../learning-studio/lesson-test-core.mjs';
const rd=f=>JSON.parse(fs.readFileSync(new URL('../../learning-studio/'+f,import.meta.url),'utf8'));
const bank=rd('lesson-tests.json'),units=rd('units.json'),quizzes=rd('quizzes.json');
const lessons=new Map(units.flatMap(p=>p.lessons.map(l=>[l.id,{lang:p.language,lesson:l}])));
// Java and C++ snippets all start with the same program wrapper and print through the same call.
// Those shared parts must not make two different snippets look alike, but the body still counts in full.
const WRAPPERS=[/public\s+class\s+Main\s*\{/g,/public\s+static\s+void\s+main\s*\(\s*String\[\]\s*args\s*\)\s*\{/g,/#include\s*<iostream>/g,/int\s+main\s*\(\s*\)\s*\{/g,/return\s+0\s*;/g];
const stripWrapper=s=>WRAPPERS.reduce((t,r)=>t.replace(r,' '),String(s));
const PRINT_CALL=new Set(['system','out','println','std','cout','endl']);
const tok=s=>new Set(stripWrapper(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').split(' ').filter(x=>x.length>1&&!PRINT_CALL.has(x)));
const jac=(a,b)=>{const A=tok(a),B=tok(b);let i=0;for(const x of A)if(B.has(x))i++;return i/Math.max(1,A.size+B.size-i)};
const runners={python:['python3',['-c']],javascript:['node',['-e']]};
import os from 'node:os';import path from 'node:path';
function runCode(lang,code){
 if(runners[lang]){const [cmd,args]=runners[lang];return execFileSync(cmd,[...args,code],{timeout:5000}).toString()}
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lt-'));
 if(lang==='cpp'){fs.writeFileSync(path.join(dir,'a.cpp'),code);execFileSync('g++',['-std=c++17','-o',path.join(dir,'a'),path.join(dir,'a.cpp')],{timeout:60000});return execFileSync(path.join(dir,'a'),{timeout:5000}).toString()}
 if(lang==='java'){fs.writeFileSync(path.join(dir,'Main.java'),code);return execFileSync('java',[path.join(dir,'Main.java')],{timeout:30000}).toString()}
 throw new Error('no runner for '+lang);
}
test('every banked lesson exists and has exactly the required number of valid questions',()=>{
 for(const [id,items] of Object.entries(bank)){assert.ok(lessons.has(id),'unknown lesson '+id);assert.equal(items.length,QUESTIONS_PER_LESSON,id);items.forEach((it,i)=>assert.deepEqual(validateItem(it),[],id+'#'+i))}
});
test('questions that show code are verified by actually running it: the marked answer equals the real output',()=>{
 let n=0;for(const [id,items] of Object.entries(bank))for(const it of items){if(!it.run)continue;const lang=lessons.get(id).lang;assert.equal(it.run,lang,id);const out=runCode(lang,it.code).replace(/\n$/,'').split('\n').join(' ثم ');assert.equal(it.options[it.answer],out,id+': '+it.code);n++}
 assert.ok(n>0);
});
test('no repeated or near-repeated question inside the bank, against the unit exams, or against the lesson chat',()=>{
 const all=[];for(const [id,items] of Object.entries(bank))items.forEach((it,i)=>all.push({id,i,text:it.q+' '+(it.code||''),opts:it.options.join(' ')}));
 const exam=Object.values(quizzes).flatMap(q=>q.mcq.map(m=>m.q+' '+(m.code||'')));
 for(let a=0;a<all.length;a++){for(let b=a+1;b<all.length;b++)if(all[a].id!==all[b].id||true){const j=jac(all[a].text,all[b].text);if(j>=0.9&&all[a].opts===all[b].opts)assert.fail('duplicate '+all[a].id+'#'+all[a].i+' ~ '+all[b].id+'#'+all[b].i)}
  for(const e of exam)assert.ok(jac(all[a].text,e)<0.8,'near-copy of an exam question: '+all[a].id+'#'+all[a].i)}
});
test('the question in the bank never equals the chat prediction question of its own lesson',()=>{
 for(const [id,items] of Object.entries(bank)){const pred=lessons.get(id).lesson.steps.find(s=>s.type==='prediction');if(!pred)continue;for(const it of items)assert.ok(jac(it.q,pred.question||'')<0.8,id)}
});
test('scoring: 2 of 4 is exactly 50 percent and passes; 1 of 4 does not; unanswered never passes; only own answers count',()=>{
 const items=[1,2,3,4];const a=n=>items.map((_,i)=>({correct:i<n}));
 assert.deepEqual([scoreLessonTest(items,a(2)).percent,scoreLessonTest(items,a(2)).passed],[50,true]);
 assert.equal(scoreLessonTest(items,a(1)).passed,false);assert.equal(scoreLessonTest(items,[{correct:true},{correct:true}]).passed,false);assert.equal(scoreLessonTest(items,a(4)).percent,100);
});

test('duplicate check: shared Java/C++ wrapper is ignored, but the body of a snippet still counts',()=>{
 const wrapJava=b=>'public class Main {\n  public static void main(String[] args) {\n    '+b+'\n  }\n}';
 const wrapCpp=(b,tail='')=>'#include <iostream>\nint main() {\n  '+b+tail+'\n}';
 // negative: only the wrapper and the print call are shared, the bodies teach different things
 assert.ok(jac(wrapJava('System.out.println(7 / 2);'),wrapJava('System.out.println("Hi");'))<0.5);
 assert.ok(jac(wrapCpp('std::cout << 3 * 4 << std::endl;'),wrapCpp('int n = 9; std::cout << n % 2 << std::endl;'))<0.5);
 // positive: same body, only formatting or the wrapper differs, still caught by the 0.9 threshold
 assert.ok(jac(wrapJava('int a = 5;\n    System.out.println(a + 1);'),'public class Main { public static void main(String[] args) { int a = 5; System.out.println(a + 1); } }')>=0.9);
 assert.ok(jac(wrapCpp('int a = 5; std::cout << a + 1 << std::endl;'),wrapCpp('int a = 5; std::cout << a + 1 << std::endl;','\n  return 0;'))>=0.9);
 // positive: one changed variable name or number in a longer body is still reported as near-identical
 const body='int total = 0;\n for (int i = 1; i <= 4; i++) {\n total = total + i;\n }\n System.out.println(total);';
 assert.ok(jac(wrapJava(body),wrapJava(body.replace('4','5')))>=0.8);
});
