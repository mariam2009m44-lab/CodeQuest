// Versioned server-owned grading. No client completion/output/reward assertions are accepted.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {checkIntroConcept} from './studio-curriculum/concept.mjs';
const source=readFileSync(new URL('./studio-curriculum/units.json',import.meta.url),'utf8');
const explanations=JSON.parse(readFileSync(new URL('./studio-curriculum/explanations.json',import.meta.url),'utf8'));
const units=JSON.parse(source),lessons=new Map(units.flatMap(pack=>pack.lessons.map(lesson=>[lesson.id,{pack,lesson}])));
export const curriculumVersion='studio-v1-'+createHash('sha256').update(source).update(JSON.stringify(explanations)).update(readFileSync(new URL('./studio-curriculum/concept.mjs',import.meta.url))).update(readFileSync(new URL('./studio-curriculum/intro-runner.mjs',import.meta.url))).digest('hex').slice(0,16);
const next={prediction:'worked',worked:'practice',practice:'explanation',explanation:'transfer',transfer:'complete'};
const normalized=s=>s.replace(/\r\n/g,'\n').replace(/\n$/,'');
export class VerificationError extends Error{constructor(code,message){super(message);this.code=code}}
function reject(code,message){throw new VerificationError(code,message)}
export function progressKey(lessonId){if(!lessons.has(lessonId))reject('not-found','Unknown lesson');return curriculumVersion+'__'+lessonId}
export function initialEvidence(uid,lessonId){progressKey(lessonId);if(typeof uid!=='string'||!uid)reject('unauthenticated','Sign in required');return {uid,lessonId,curriculumVersion,phase:'prediction',revision:0,serverVerified:true,completed:false}}
export function validateSubmission(request){
 if(!request||typeof request!=='object'||Array.isArray(request))reject('invalid-argument','Invalid request');
 if(Object.keys(request).some(k=>!['lessonId','curriculumVersion','phase','revision','answer','code'].includes(k)))reject('invalid-argument','Unexpected client assertion');
 if(request.curriculumVersion!==curriculumVersion)reject('failed-precondition','Curriculum changed; reload the lesson');
 progressKey(request.lessonId);
 if(!Object.hasOwn(next,request.phase)||!Number.isSafeInteger(request.revision)||request.revision<0)reject('invalid-argument','Invalid evidence sequence');
 if(['prediction','explanation'].includes(request.phase)){if(!Number.isInteger(request.answer))reject('invalid-argument','Choice required');if(request.code!==undefined)reject('invalid-argument','Code not expected')}
 else if(['practice','transfer'].includes(request.phase)){if(typeof request.code!=='string'||!request.code.trim()||request.code.length>15000)reject('invalid-argument','Code required');if(request.answer!==undefined)reject('invalid-argument','Choice not expected')}
 else if(request.code!==undefined||request.answer!==undefined)reject('invalid-argument','Worked example is server-owned');
 return request;
}
// The caller must persist this result with a UID-scoped transaction/CAS against revision.
// The injected executor must execute on the server, never accept browser stdout.
export async function verifyEvidence({uid,request,current,execute}){
 validateSubmission(request);const state=current??initialEvidence(uid,request.lessonId);
 if(state.uid!==uid||state.lessonId!==request.lessonId||state.curriculumVersion!==curriculumVersion||state.serverVerified!==true)reject('permission-denied','Evidence owner/version mismatch');
 if(state.phase!==request.phase||state.revision!==request.revision)reject('failed-precondition','Stale or out-of-order evidence');
 const {pack,lesson}=lessons.get(request.lessonId),step=lesson.steps.find(s=>s.type===request.phase);
 if(request.phase==='prediction'&&request.answer!==step.correctIndex)return {accepted:false,reason:'prediction'};
 if(request.phase==='explanation'&&request.answer!==explanations[lesson.id].answer)return {accepted:false,reason:'explanation'};
 if(['worked','practice','transfer'].includes(request.phase)){
  if(typeof execute!=='function')reject('unavailable','Server execution unavailable');
  const code=request.phase==='worked'?step.code:request.code;
  if(request.phase!=='worked'&&checkIntroConcept({lesson,phase:request.phase,code,language:pack.language}).approved!==true)return {accepted:false,reason:'concept'};
  const cases=request.phase==='worked'?[{stdin:lesson.workedStdin??'',stdout:step.output}]:(lesson[request.phase+'Cases']??[{stdin:'',stdout:step.expectedOutput}]);
  for(const test of cases){const result=await execute(pack.language,code,test.stdin);if(result?.ok!==true||typeof result.stdout!=='string')return {accepted:false,reason:'execution'};if(normalized(result.stdout)!==test.stdout)return {accepted:false,reason:'output'}}
 }
 const phase=next[request.phase];return {accepted:true,evidence:{...state,phase,revision:state.revision+1,completed:phase==='complete',serverVerified:true}};
}
