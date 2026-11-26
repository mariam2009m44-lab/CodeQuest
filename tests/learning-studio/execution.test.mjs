import {test} from 'node:test';import assert from 'node:assert/strict';import {compilerAdapter} from '../../learning-studio/execution.mjs';
test('preserve exact language,code,input and actual stdout',async()=>{const calls=[];const execute=compilerAdapter('java',async(...a)=>{calls.push(a);return {ok:true,stdout:'Hello \n'}});assert.deepEqual(await execute('source','1 2'),{ok:true,stdout:'Hello \n'});assert.deepEqual(calls,[['java','source','1 2']])});
test('compiler error returned without synthetic success',async()=>{const execute=compilerAdapter('cpp',async()=>({ok:false,compileOutput:'compile diagnostic',stderr:'details',stdout:''}));const r=await execute('invalid','');assert.equal(r.ok,false);assert.match(r.message,/compile diagnostic/)});
test('unavailable service propagates without fallback',async()=>{let count=0;const execute=compilerAdapter('python',async()=>{count++;throw Error('service unavailable')});await assert.rejects(execute('print(1)'),/unavailable/);assert.equal(count,1)});
test('missing or malformed server output cannot pass',async()=>{const execute=compilerAdapter('javascript',async()=>({ok:true}));await assert.rejects(execute('console.log(1)'),/ناتج/)});
test('unsupported language rejected before execution',()=>assert.throws(()=>compilerAdapter('other',()=>{}),/adapter/));
test('server runner: compile/stderr output is a student error, a service errorCode is not',async()=>{
 const {compilerAdapter}=await import('../../learning-studio/execution.mjs');
 const stu=await compilerAdapter('cpp',async()=>({ok:false,compileOutput:'error: expected ;'}))('x');assert.equal(stu.student,true);
 const rt=await compilerAdapter('python',async()=>({ok:false,stderr:'NameError'}))('x');assert.equal(rt.student,true);
 const svc=await compilerAdapter('java',async()=>({ok:false,message:'down',errorCode:'JUDGE0_INTERNAL_ERROR'}))('x');assert.equal(svc.student,false);
 const none=await compilerAdapter('java',async()=>({ok:false}))('x');assert.equal(none.student,false);
});
test('server runner: time limit and runtime statuses are student errors, status 13 and missing status are not',async()=>{
 const {compilerAdapter}=await import('../../learning-studio/execution.mjs');
 for(const id of [5,6,11,12]){assert.equal((await compilerAdapter('cpp',async()=>({ok:false,statusId:id}))('x')).student,true,'status '+id)}
 assert.equal((await compilerAdapter('cpp',async()=>({ok:false,statusId:13,errorCode:'JUDGE0_INTERNAL_ERROR'}))('x')).student,false);
 assert.equal((await compilerAdapter('cpp',async()=>({ok:false,statusId:null}))('x')).student,false);
});
