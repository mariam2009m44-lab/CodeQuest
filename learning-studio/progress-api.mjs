// One thin client for the server-assessment endpoints. Everything here is OFF unless features.json sets serverAssessment:true
// (the endpoints are not deployed). The browser sends raw answers/code only; scores and verdicts come from the server.
// A 409 means the page and the server hold different question banks: the caller must refresh, never retry the same payload.
import {quizBankHash,cyrb53} from './bank-hash.mjs';
export const ENDPOINT='https://codequest.mariam2009m44.workers.dev';
export async function postProgress({enabled,endpoint=ENDPOINT,getToken,fetchFn,path,payload,requestId}){
 if(enabled!==true||!payload)return {sent:false,reason:'disabled'};
 const once=async force=>{const token=await getToken(force);if(!token)return {noToken:true};
  return {r:await fetchFn(endpoint+path,{method:'POST',keepalive:true,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...(requestId?{'X-Request-Id':requestId}:{})},body:JSON.stringify(payload)})}};
 try{let a=await once(false);if(a.noToken)return {sent:false,reason:'no-token'};
  // 401 can be an expired token: refresh once. A second 401 means the sign-in itself is not accepted: needs the learner to sign in again.
  if(a.r.status===401){a=await once(true);if(a.noToken)return {sent:false,reason:'no-token'};if(a.r.status===401)return {sent:true,ok:false,status:401,needsLogin:true}}
  const r=a.r;
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
// Durable, per-account retry for every assessment post. A result that could not be recorded (busy server, lost response, missing token,
// sign-in not accepted) stays on the device for THAT account. Automatic retries are bounded (MAX_ATTEMPTS sends); after that the payload is
// KEPT as "exhausted" for a deliberate learner retry (retryExhausted) and is never silently dropped. It is removed only on a confirmed
// receipt (200) or a definitive rejection (409 stale bank: fresh assessment needed; other 4xx). Old answers are never replayed against a new bank.
export const MAX_ATTEMPTS=3;
const qkey=uid=>'cq_pending_'+uid;
const readQ=(storage,uid)=>{try{const v=JSON.parse(storage.getItem(qkey(uid))||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}};
const writeQ=(storage,uid,q)=>{try{Object.keys(q).length?storage.setItem(qkey(uid),JSON.stringify(q)):storage.removeItem(qkey(uid))}catch{}};
function settle(r){
 if(r.ok)return {state:'saved',data:r.data,keep:false};
 if(r.refreshNeeded)return {state:'stale',keep:false};
 if(r.needsLogin)return {state:'needs-login',keep:true};
 if(r.retryable===true||r.reason==='network'||r.reason==='no-token')return {state:'pending',keep:true};
 return {state:'rejected',status:r.status,keep:false};
}
const newId=()=>{const a=new Uint8Array(16);(globalThis.crypto||{getRandomValues:x=>x.map(()=>Math.floor(Math.random()*256))}).getRandomValues(a);return 'r'+Array.from(a,b=>b.toString(16).padStart(2,'0')).join('')};
const exhausted=e=>e.attempts>=MAX_ATTEMPTS||e.needsLogin===true;
export async function postDurable({uid,storage,key,enabled,endpoint,getToken,fetchFn,path,payload,defer}){
 if(enabled!==true||!payload||!uid)return {state:'off'};
 if(defer===true){const q=readQ(storage,uid);q[key]={path,payload,attempts:0,id:newId()};writeQ(storage,uid,q);return {state:'pending'}}
 const id=newId();
 const r=await postProgress({enabled,endpoint,getToken,fetchFn,path,payload,requestId:id});
 const out=settle(r);const q=readQ(storage,uid);
 if(out.keep)q[key]={path,payload,attempts:1,needsLogin:out.state==='needs-login',id};else delete q[key];
 writeQ(storage,uid,q);return out;
}
async function run(opts,includeExhausted){
 const {uid,storage,enabled,endpoint,getToken,fetchFn}=opts;
 if(enabled!==true||!uid)return {sent:0,left:0};
 const q=readQ(storage,uid);let sent=0;
 for(const key of Object.keys(q)){
  const e=q[key];if(!e||typeof e.path!=='string'||!e.payload||!Number.isInteger(e.attempts)){delete q[key];continue}
  if(exhausted(e)&&!includeExhausted)break; // an exhausted item holds the later ones back (order); the learner retries deliberately
  const id=typeof e.id==='string'&&e.id?e.id:newId();
  const r=await postProgress({enabled,endpoint,getToken,fetchFn,path:e.path,payload:e.payload,requestId:id});
  const out=settle(r);
  if(out.keep){q[key]={...e,id,attempts:e.attempts+1,needsLogin:out.state==='needs-login'};break}
  delete q[key];if(out.state==='saved')sent++;
 }
 writeQ(storage,uid,q);return {sent,left:Object.keys(q).length};
}
export const flushPending=opts=>run(opts,false);
export const retryExhausted=opts=>run(opts,true);
// What the page may say: counts only, from storage. "exhausted" and "needsLogin" need a learner action.
export function pendingStatus({uid,storage}){
 const q=uid?readQ(storage,uid):{};const es=Object.values(q).filter(e=>e&&typeof e==='object');
 return {total:es.length,exhausted:es.filter(exhausted).length,needsLogin:es.filter(e=>e.needsLogin===true).length};
}
