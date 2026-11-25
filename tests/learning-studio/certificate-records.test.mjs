import test from 'node:test';import assert from 'node:assert/strict';
import {listMyCertificates,normalizeRecords} from '../../learning-studio/certificate-records.mjs';
test('no source means no certificates',async()=>{assert.deepEqual(await listMyCertificates(),[])});
test('only server-recorded, complete records pass',async()=>{
 const ok={language:'python',certId:'A1',completedAt:'2026-11-25T10:00:00Z',serverRecorded:true};
 const out=normalizeRecords([ok,{...ok,serverRecorded:false},{...ok,certId:''},{...ok,language:'ruby'},{...ok,completedAt:'x'},null]);
 assert.equal(out.length,1);assert.equal(out[0].certId,'A1');
});
test('a failing source yields an empty list',async()=>{assert.deepEqual(await listMyCertificates(async()=>{throw new Error('x')}),[])});
