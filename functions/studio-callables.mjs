import {studioProgressService} from './studio-progress-service.mjs';
import {VerificationError,curriculumVersion} from './studio-verification.mjs';
export function studioCallableHandlers({store,execute,rateLimit}){
 const service=studioProgressService({store,execute});
 const uid=request=>{const value=request?.auth?.uid;if(typeof value!=='string'||!value)throw new VerificationError('unauthenticated','Sign in required');return value};
 return {
  async submit(request){const owner=uid(request);await rateLimit(owner,'studioEvidence');return service.submit(owner,request.data)},
  async read(request){const owner=uid(request),data=request.data;if(!data||Object.keys(data).some(k=>!['lessonId','curriculumVersion'].includes(k))||data.curriculumVersion!==curriculumVersion)throw new VerificationError('invalid-argument','Reload curriculum');await rateLimit(owner,'studioRead');return service.read(owner,data.lessonId)}
 };
}
