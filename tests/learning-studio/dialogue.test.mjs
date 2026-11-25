import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const units=JSON.parse(readFileSync(new URL('../../learning-studio/units.json',import.meta.url),'utf8'));
const lessons=units.flatMap(u=>u.lessons.map(l=>({...l,language:u.language})));
test('every dialogue turn asks a question with 2-3 options, one fitting, each with a teaching reply',()=>{
 let n=0;
 for(const l of lessons)for(const [i,t] of (l.dialogue??[]).entries()){
  n++;const at=`${l.id}#${i}`;
  assert.ok(typeof t.ask==='string'&&t.ask.length>10,at+' ask');
  assert.ok(Array.isArray(t.options)&&t.options.length>=2&&t.options.length<=3,at+' options');
  assert.equal(t.options.filter(o=>o.fit===true).length,1,at+' exactly one fitting option');
  for(const o of t.options){assert.ok(o.text.length>=1&&o.reply.length>=10,at+' text/reply');assert.ok(!/[\u2014]/.test(o.reply+o.text),at+' no em dash')}
  assert.ok(new Set(t.options.map(o=>o.text)).size===t.options.length,at+' distinct options');
 }
 assert.ok(n>0);
});
test('Java, JavaScript and C++ lessons all carry at least two dialogue turns',()=>{
 for(const l of lessons.filter(l=>['java','javascript','cpp'].includes(l.language)))assert.ok((l.dialogue??[]).length>=2,l.id);
});
