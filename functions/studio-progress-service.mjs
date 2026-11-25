import {createHash} from 'node:crypto';
import {curriculumVersion,initialEvidence,validateSubmission,verifyEvidence,progressKey,VerificationError} from './studio-verification.mjs';
// Storage is an Admin-only adapter scoped by authenticated UID. It exposes read
// and compareAndSet; the latter must atomically require the expected revision.
// No legacy account totals, rewards, or progress collections are used here.
export function studioProgressService({store,execute}){
 if(!store||typeof store.read!=='function'||typeof store.compareAndSet!=='function')throw new TypeError('Transactional evidence store required');
 return {
  async submit(uid,request){
   if(typeof uid!=='string'||!uid)throw new VerificationError('unauthenticated','Sign in required');validateSubmission(request);const key=progressKey(request.lessonId),digest=createHash('sha256').update(JSON.stringify([uid,request.curriculumVersion,request.lessonId,request.phase,request.revision,request.answer??null,request.code??null])).digest('hex');
   const current=await store.read(uid,key);
   if(current?.lastSubmissionDigest===digest&&current.uid===uid&&current.curriculumVersion===curriculumVersion)return {accepted:true,replayed:true,evidence:current};
   const result=await verifyEvidence({uid,request,current,execute});if(!result.accepted)return result;
   const evidence={...result.evidence,lastSubmissionDigest:digest};
   if(!await store.compareAndSet(uid,key,current?.revision??0,evidence)){
    const latest=await store.read(uid,key);if(latest?.lastSubmissionDigest===digest&&latest.uid===uid)return {accepted:true,replayed:true,evidence:latest};
    throw new VerificationError('aborted','Evidence changed; reload progress');
   }
   return {accepted:true,evidence};
  },
  async read(uid,lessonId){const key=progressKey(lessonId);if(typeof uid!=='string'||!uid)throw new VerificationError('unauthenticated','Sign in required');const state=await store.read(uid,key);if(state&&(state.uid!==uid||state.curriculumVersion!==curriculumVersion))throw new VerificationError('permission-denied','Evidence owner mismatch');return state??initialEvidence(uid,lessonId)}
 };
}
