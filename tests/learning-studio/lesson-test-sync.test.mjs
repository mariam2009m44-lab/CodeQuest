import fs from 'node:fs';import {test} from 'node:test';import assert from 'node:assert/strict';
import {buildLessonTestPayload,submitLessonTest,LESSON_TEST_SYNC_ENABLED} from '../../learning-studio/lesson-test-sync.mjs';
const bank=JSON.parse(fs.readFileSync(new URL('../../learning-studio/lesson-tests.json',import.meta.url),'utf8'));
const srv=JSON.parse(fs.readFileSync(new URL('../../cloudflare-worker/lesson-answers.json',import.meta.url),'utf8'));
test('flag is OFF by default and nothing is sent',async()=>{
 assert.equal(LESSON_TEST_SYNC_ENABLED,false);
 let called=false;const r=await submitLessonTest({endpoint:'https://x.test',getToken:async()=>'t',fetchFn:async()=>{called=true},payload:{a:1}});
 assert.equal(called,false);assert.equal(r.reason,'disabled');
});
test('payload has picks only, never a score or passed flag',()=>{
 const p=buildLessonTestPayload({language:'python',lessonId:'py-1-1',answers:[{picked:2,correct:true},{picked:0},null,{picked:9}],version:'v1',items:bank['py-1-1']});
 assert.deepEqual(p.picks,[2,0,null,null]);assert.deepEqual(Object.keys(p).sort(),['bank','language','lessonId','picks','version']);
});
test('when enabled it posts with a bearer token and reports server result',async()=>{
 let seen;const r=await submitLessonTest({enabled:true,endpoint:'https://x.test',getToken:async()=>'tok',payload:{picks:[0]},fetchFn:async(u,o)=>{seen={u,o};return {ok:true,json:async()=>({passed:true,percent:75})}}});
 assert.equal(seen.u,'https://x.test/api/progress/lesson-test');assert.equal(seen.o.headers.Authorization,'Bearer tok');assert.equal(r.passed,true);
 assert.equal((await submitLessonTest({enabled:true,endpoint:'https://x.test',getToken:async()=>null,payload:{picks:[0]},fetchFn:async()=>{}})).reason,'no-token');
});
test('client bank hash equals the server key hash, and 409 means refresh needed',async()=>{
 const p=buildLessonTestPayload({language:'python',lessonId:'py-1-1',answers:[{picked:0},{picked:0},{picked:0},{picked:0}],items:bank['py-1-1']});
 assert.equal(p.bank,srv['py-1-1'].h);
 const r=await submitLessonTest({enabled:true,endpoint:'https://x.test',getToken:async()=>'t',payload:p,fetchFn:async()=>({ok:false,status:409})});
 assert.equal(r.refreshNeeded,true);
});
