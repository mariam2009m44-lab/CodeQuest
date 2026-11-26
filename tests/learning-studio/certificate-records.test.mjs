import test from 'node:test';import assert from 'node:assert/strict';
import {loadMyCertificates,validateCertificates,renderCertificates,latestOnly} from '../../learning-studio/certificate-records.mjs';
const rec={track:'python',trackName:'Python',issuedAt:'2026-11-25T10:00:00Z',lessonsCompleted:48,lessonsTotal:48,unitExamsPassed:12,unitExamsTotal:12,codeTasksVerified:true,recordId:'FIXTURE-0001'};
const body=(...r)=>({certificates:r.length?r:[rec]});
const D=(o={})=>({enabled:true,getUid:()=>'u1',fetchCertificates:async()=>body(),...o});
test('disabled without an adapter or when switched off',async()=>{assert.equal((await loadMyCertificates()).state,'disabled');assert.equal((await loadMyCertificates({enabled:false,fetchCertificates:async()=>body(),getUid:()=>'u1'})).state,'disabled')});
test('signed out',async()=>{assert.equal((await loadMyCertificates(D({getUid:()=>null}))).state,'signedout')});
test('valid synthetic fixture',async()=>{const r=await loadMyCertificates(D());assert.equal(r.state,'ok');assert.equal(r.records[0].recordId,'FIXTURE-0001')});
test('empty list is ok, not error',async()=>{const r=await loadMyCertificates(D({fetchCertificates:async()=>({certificates:[]})}));assert.equal(r.state,'ok');assert.equal(r.records.length,0)});
test('fetch failure is error, never an empty claim',async()=>{const r=await loadMyCertificates(D({fetchCertificates:async()=>{throw new Error('x')}}));assert.equal(r.state,'error');assert.deepEqual(r.records,[])});
test('account switched or signed out mid-request drops the response',async()=>{
 let uid='u1';const a=await loadMyCertificates(D({getUid:()=>uid,fetchCertificates:async()=>{uid='u2';return body()}}));assert.deepEqual(a,{state:'signedout',records:[]});
 uid='u1';const b=await loadMyCertificates(D({getUid:()=>uid,fetchCertificates:async()=>{uid=null;return body()}}));assert.equal(b.records.length,0);
});
test('invalid fixtures make the whole response untrusted',async()=>{
 const bad=[{...rec,track:'ruby'},{...rec,recordId:''},{...rec,recordId:'a b c d e f g h'},{...rec,issuedAt:'2026-11-25'},{...rec,issuedAt:'2026-11-25T10:00:00+02:00'},{...rec,issuedAt:'2099-01-01T00:00:00Z'},{...rec,lessonsCompleted:47},{...rec,lessonsTotal:0,lessonsCompleted:0},{...rec,unitExamsPassed:11},{...rec,unitExamsTotal:0,unitExamsPassed:0},{...rec,codeTasksVerified:false},{...rec,codeTasksVerified:'true'},{...rec,codeTasksVerified:undefined},{...rec,unitExamsPassed:undefined,unitExamsTotal:undefined,codeTasksVerified:undefined},{...rec,lessonsCompleted:'48'},null,'x'];
 for(const b of bad)assert.equal((await loadMyCertificates(D({fetchCertificates:async()=>({certificates:[rec,b]})}))).state,'error');
 for(const b of [null,undefined,'x',{},{certificates:'x'}])assert.equal((await loadMyCertificates(D({fetchCertificates:async()=>b}))).state,'error');
 assert.equal(validateCertificates({certificates:[rec,{...rec,recordId:'FIXTURE-0002'}]}),null);
});
test('a serverRecorded flag or localStorage proves nothing',async()=>{
 globalThis.localStorage={getItem:()=>JSON.stringify([rec])};
 assert.equal((await loadMyCertificates()).records.length,0);
 assert.equal((await loadMyCertificates(D({fetchCertificates:async()=>({certificates:[{...rec,lessonsCompleted:1,serverRecorded:true}]})}))).state,'error');delete globalThis.localStorage});
test('latest request wins',()=>{const g=latestOnly(),a=g.begin(),b=g.begin();assert.ok(!g.isCurrent(a)&&g.isCurrent(b))});
test('renderer shows list, empty, error, signedout states',()=>{
 const mk=()=>({hidden:false,children:[],textContent:'',append(c){this.children.push(c)}});
 const doc={createElement:t=>({t,children:[],append(c){this.children.push(c)}})};
 const list=mk(),empty=mk();
 renderCertificates(doc,list,empty,{state:'error',records:[]});assert.ok(list.hidden&&!empty.hidden);assert.match(empty.textContent,/تعذر/);
 renderCertificates(doc,list,empty,{state:'signedout',records:[]});assert.match(empty.textContent,/سجّل/);
 renderCertificates(doc,list,empty,{state:'disabled',records:[]});assert.match(empty.textContent,/غير مفعّل/);assert.doesNotMatch(empty.textContent,/^لا توجد/);
 renderCertificates(doc,list,empty,{state:'ok',records:[{language:'cpp',recordId:'A_b-12345',issuedAt:'x'}]});assert.ok(!list.hidden&&empty.hidden);assert.match(list.children[0].children[0].href,/id=A_b-12345$/);
});
