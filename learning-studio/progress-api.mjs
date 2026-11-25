// One thin client for the server-assessment endpoints. Everything here is OFF unless features.json sets serverAssessment:true
// (the endpoints are not deployed). The browser sends raw answers/code only; scores and verdicts come from the server.
// A 409 means the page and the server hold different question banks: the caller must refresh, never retry the same payload.
import {quizBankHash} from './bank-hash.mjs';
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
