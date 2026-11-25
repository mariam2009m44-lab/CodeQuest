import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const root=new URL('../../',import.meta.url);
const read=f=>fs.readFileSync(new URL(f,root),'utf8');
// Owner-approved: every exam passes at 50 percent or more, inclusive. Integer arithmetic, no rounding at the boundary.
test('python final exam: 50 percent inclusive, 15 questions (8 pass, 7 fail)',()=>{
 const s=read('python-exam.html');assert.match(s,/const PASS_PERCENTAGE = 50;/);assert.match(s,/<strong>50%<\/strong>/);
 assert.match(s,/const passed = score \* 100 >= PASS_PERCENTAGE \* examQuestions\.length;/);
 const pass=(score,total,P=50)=>score*100>=P*total;
 assert.equal(pass(7,15),false);assert.equal(pass(8,15),true);assert.equal(pass(0,15),false);assert.equal(pass(15,15),true);
});
test('python chapter exams in python-lesson.html: 50 percent inclusive and honest message',()=>{
 const s=read('python-lesson.html');assert.match(s,/const PASS_PERCENTAGE = 50;/);
 assert.match(s,/const passed = total > 0 && examScore \* 100 >= PASS_PERCENTAGE \* total;/);
 assert.match(s,/تحتاج إلى 50% على الأقل للنجاح/);assert.doesNotMatch(s,/تحتاج إلى 80%/);
});
