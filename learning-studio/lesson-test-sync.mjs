// Sends the raw picks of a finished lesson test to the server, which recomputes the score itself.
// Default OFF: the endpoint is not deployed, so nothing is sent and the UI never claims an account save.
export const LESSON_TEST_SYNC_ENABLED=false;
import {lessonBankHash} from './bank-hash.mjs';
export function buildLessonTestPayload({language,lessonId,answers,version,items}){
 if(!language||!lessonId||!Array.isArray(answers)||!answers.length||!Array.isArray(items)||items.length!==answers.length)return null;
 const picks=answers.map(a=>Number.isInteger(a?.picked)&&a.picked>=0&&a.picked<=2?a.picked:null);
 return {language,lessonId,version:String(version||'v1').slice(0,64),bank:lessonBankHash(items),picks}; // bank binds the payload to the bank it was graded against; no score, no passed flag
}
export async function submitLessonTest({enabled=LESSON_TEST_SYNC_ENABLED,endpoint,getToken,fetchFn,payload}){
 if(!enabled||!payload||!endpoint)return {sent:false,reason:'disabled'};
 try{const token=await getToken();if(!token)return {sent:false,reason:'no-token'};
  const r=await fetchFn(endpoint+'/api/progress/lesson-test',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)});
  if(r.status===409)return {sent:true,ok:false,refreshNeeded:true};
  if(!r.ok)return {sent:true,ok:false,status:r.status};
  const d=await r.json();return {sent:true,ok:true,passed:d.passed===true,percent:d.percent};
 }catch{return {sent:false,reason:'network'}}
}
