// Sends the raw picks of a finished lesson test to the server, which recomputes the score itself.
// Default OFF: the endpoint is not deployed, so nothing is sent and the UI never claims an account save.
export const LESSON_TEST_SYNC_ENABLED=false;
export function buildLessonTestPayload({language,lessonId,answers,version}){
 if(!language||!lessonId||!Array.isArray(answers)||!answers.length)return null;
 const picks=answers.map(a=>Number.isInteger(a?.picked)&&a.picked>=0&&a.picked<=2?a.picked:null);
 return {language,lessonId,version:String(version||'v1').slice(0,64),picks}; // no score, no passed flag
}
export async function submitLessonTest({enabled=LESSON_TEST_SYNC_ENABLED,endpoint,getToken,fetchFn,payload}){
 if(!enabled||!payload||!endpoint)return {sent:false,reason:'disabled'};
 try{const token=await getToken();if(!token)return {sent:false,reason:'no-token'};
  const r=await fetchFn(endpoint+'/api/progress/lesson-test',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(payload)});
  if(!r.ok)return {sent:true,ok:false,status:r.status};
  const d=await r.json();return {sent:true,ok:true,passed:d.passed===true,percent:d.percent};
 }catch{return {sent:false,reason:'network'}}
}
