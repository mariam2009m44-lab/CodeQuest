// One thin client for the server-assessment endpoints. Everything here is OFF unless features.json sets serverAssessment:true
// (the endpoints are not deployed). The browser sends raw answers/code only; scores and verdicts come from the server.
// A 409 means the page and the server hold different question banks: the caller must refresh, never retry the same payload.
import {quizBankHash,cyrb53} from './bank-hash.mjs';
export const ENDPOINT='https://codequest.mariam2009m44.workers.dev';
export async function postProgress({enabled,endpoint=ENDPOINT,getToken,fetchFn,path,payload}){
 if(enabled!==true||!payload)return {sent:false,reason:'disabled'};
 try{const token=await getToken();if(!token)return {sent:false,reason:'no-token'};
  const r=await fetchFn(endpoint+path,{method:'POST',keepalive:true,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)});
  if(r.status===409)return {sent:true,ok:false,refreshNeeded:true};
  if(r.status===429||r.status===503)return {sent:true,ok:false,retryable:true,status:r.status};
  if(!r.ok)return {sent:true,ok:false,status:r.status};
  return {sent:true,ok:true,data:await r.json()};
 }catch{return {sent:false,reason:'network'}}
}
export function examPayload({language,unit,quiz,answers,version}){
 if(!quiz||!Array.isArray(answers)||answers.length<quiz.mcq.length)return null;
 const choices=quiz.mcq.map((_,i)=>Number.isInteger(answers[i]?.picked)?answers[i].picked:null);
 return {language,unit,version:String(version||'v1').slice(0,64),bank:quizBankHash(quiz),choices};
}
export function codeTaskPayload({language,unit,quiz,item,code,version}){
 if(!quiz||!quiz.code[item]||typeof code!=='string'||!code.trim())return null;
 return {language,unit,item,version:String(version||'v1').slice(0,64),bank:quizBankHash(quiz),code};
}
// Practice/transfer chat tasks. The bank hash is built from the PUBLIC lesson (units.json), exactly as the build script does,
// so a page and a Worker holding different task text or reference cases disagree (409) instead of grading the wrong thing.
export function practiceBankHash(language,lesson,phase){
 const st=lesson?.steps?.find(x=>x.type===phase);if(!st)return null;
 const cases=lesson[phase+'Cases']??[{stdin:'',stdout:st.expectedOutput}];
 return cyrb53(JSON.stringify([language,lesson.id,phase,st.task,st.referenceSolution,st.starter??'',cases]));
}
export function practicePayload({language,lesson,phase,code,version}){
 if(!['practice','transfer'].includes(phase)||typeof code!=='string'||!code.trim())return null;
 const bank=practiceBankHash(language,lesson,phase);if(!bank)return null;
 return {language,lessonId:lesson.id,phase,version:String(version||'v1').slice(0,64),bank,code};
}
// Durable, per-account, bounded retry for every assessment post. A result that could not be recorded because of a busy server, a lost response
// or a missing token is kept on the device for THAT account and retried on later page opens (at most MAX_ATTEMPTS sends in total).
// A 409 (stale question bank) or any other rejection discards the payload: old answers are never replayed against a new bank.
export const MAX_ATTEMPTS=3;
const qkey=uid=>'cq_pending_'+uid;
const readQ=(storage,uid)=>{try{const v=JSON.parse(storage.getItem(qkey(uid))||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}};
const writeQ=(storage,uid,q)=>{try{Object.keys(q).length?storage.setItem(qkey(uid),JSON.stringify(q)):storage.removeItem(qkey(uid))}catch{}};
function settle(r,attempts){
 if(r.ok)return {state:'saved',data:r.data,keep:false};
 if(r.refreshNeeded)return {state:'stale',keep:false};
 const retry=r.retryable===true||r.reason==='network'||r.reason==='no-token';
 if(!retry)return {state:'rejected',status:r.status,keep:false};
 return attempts>=MAX_ATTEMPTS?{state:'gave-up',keep:false}:{state:'pending',keep:true};
}
export async function postDurable({uid,storage,key,enabled,endpoint,getToken,fetchFn,path,payload,defer}){
 if(enabled!==true||!payload||!uid)return {state:'off'};
 if(defer===true){const q=readQ(storage,uid);q[key]={path,payload,attempts:0};writeQ(storage,uid,q);return {state:'pending'}}
 const r=await postProgress({enabled,endpoint,getToken,fetchFn,path,payload});
 const out=settle(r,1);const q=readQ(storage,uid);
 if(out.keep)q[key]={path,payload,attempts:1};else delete q[key];
 writeQ(storage,uid,q);return out;
}
// Retries this account's saved posts in order; stops at the first one that still cannot be sent so the order (code tasks before exam) holds.
export async function flushPending({uid,storage,enabled,endpoint,getToken,fetchFn}){
 if(enabled!==true||!uid)return {sent:0,left:0};
 const q=readQ(storage,uid);let sent=0;
 for(const key of Object.keys(q)){
  const e=q[key];if(!e||typeof e.path!=='string'||!e.payload||!Number.isInteger(e.attempts)){delete q[key];continue}
  const r=await postProgress({enabled,endpoint,getToken,fetchFn,path:e.path,payload:e.payload});
  const out=settle(r,e.attempts+1);
  if(out.keep){q[key]={...e,attempts:e.attempts+1};break}
  delete q[key];if(out.state==='saved')sent++;
 }
 writeQ(storage,uid,q);return {sent,left:Object.keys(q).length};
}
