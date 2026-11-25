// A session records learning evidence, never account rewards or verified achievements.
export class LessonSession {
 constructor(lesson,{execute,checkConcept,checkExplanation}) {
  if(!lesson?.id||!Array.isArray(lesson.steps))throw new TypeError('invalid lesson');
  if([execute,checkConcept,checkExplanation].some(x=>typeof x!=='function'))throw new TypeError('real execution and review adapters required');
  this.lesson=lesson;this.adapters={execute,checkConcept,checkExplanation};this.phase='prediction';this.version=0;this.busy=false;this.attempts=0;this.evidence={prediction:false,worked:false,practice:false,explanation:false,transfer:false};this.code=this.step('practice').starter??'';
 }
 step(type){return this.lesson.steps.find(s=>s.type===type)}
 predict(index){
  if(this.phase!=='prediction')return {ok:false,reason:'phase'};
  const q=this.step('prediction');if(!Number.isInteger(index)||index<0||index>=q.options.length)return {ok:false,reason:'choice'};
  const ok=index===q.correctIndex;if(ok){this.evidence.prediction=true;this.phase='worked'}
  return {ok,message:q.feedbackByOption[index]};
 }
 setCode(code){if(typeof code!=='string')throw new TypeError('code must be text');if(code.length>50000)throw new RangeError('code too long');if(this.busy)throw new Error('execution in progress');if(!['practice','transfer'].includes(this.phase))throw new Error('editor is read only in this phase');this.code=code;this.version++;return this.code}
 resetCode(){return this.setCode(this.phase==='transfer'?(this.step('transfer').starter??''):(this.step('practice').starter??''))}
 async runWorked(){
  if(this.phase!=='worked'||this.busy)return {ok:false,reason:'phase'};
  this.busy=true;try{const result=await this.adapters.execute(this.step('worked').code,this.lesson.workedStdin??'');if(result?.ok!==true)return {ok:false,reason:'execution',result};if(result.stdout.replace(/\r\n/g,'\n').replace(/\n$/,'')!==this.step('worked').output)return {ok:false,reason:'worked-output',result};this.evidence.worked=true;this.phase='practice';return {ok:true,result}}catch(error){return {ok:false,reason:'execution',message:String(error.message)}}finally{this.busy=false}
 }
 async runTask({stdin}={}){
  if(!['practice','transfer'].includes(this.phase)||this.busy)return {ok:false,reason:'phase'};
  const phase=this.phase,version=this.version,code=this.code,step=this.step(phase);this.busy=true;this.attempts++;
  try{
   const cases=this.lesson[phase+'Cases']??[{stdin:'',stdout:step.expectedOutput}];let lastResult,visibleResult;
   const selectedInput=stdin??cases[0].stdin;
   if(!cases.some(t=>t.stdin===selectedInput)){visibleResult=await this.adapters.execute(code,selectedInput);if(visibleResult?.ok!==true)return {ok:false,reason:'execution',result:visibleResult};}
   for(const test of cases){
    const result=await this.adapters.execute(code,test.stdin);lastResult=result;if(test.stdin===selectedInput)visibleResult=result;
    if(result?.ok!==true)return {ok:false,reason:'execution',result};
    // Preserve meaningful spaces. Only one conventional final LF is ignored.
    if(result.stdout.replace(/\r\n/g,'\n').replace(/\n$/,'')!==test.stdout)return {ok:false,reason:'output',result};
   }
   const review=await this.adapters.checkConcept({lesson:this.lesson,phase,code});
   if(review?.approved!==true)return {ok:false,reason:'concept',result:visibleResult??lastResult,message:review?.message??'Concept review is incomplete'};
   if(this.version!==version||this.phase!==phase)return {ok:false,reason:'stale'};
   this.evidence[phase]=true;this.phase=phase==='practice'?'explanation':'complete';return {ok:true,phase:this.phase,result:visibleResult??lastResult};
  }catch(error){return {ok:false,reason:'execution',message:String(error.message)}}finally{this.busy=false}
 }
 async explain(answer){
  if(this.phase!=='explanation'||this.busy)return {ok:false,reason:'phase'};
  this.busy=true;try{
   const result=await this.adapters.checkExplanation({lesson:this.lesson,answer});
   if(result?.approved!==true)return {ok:false,reason:'explanation',message:result?.message};
   this.evidence.explanation=true;this.phase='transfer';this.code=this.step('transfer').starter??'';this.version++;return {ok:true};
  }catch(error){return {ok:false,reason:'review',message:String(error.message)}}finally{this.busy=false}
 }
 // Resume only: puts a returning student back at a step. Earlier steps are marked as resumed, not freshly earned.
 restore(phase,code){const order=['prediction','worked','practice','explanation','transfer'];const i=order.indexOf(phase);if(i<1||this.busy)return false;if(phase==='explanation')phase='practice';const j=order.indexOf(phase);this.resumedFrom=phase;this.phase=phase;this.evidence.prediction=true;if(j>=1)this.evidence.worked=true;if(j>=3){this.evidence.practice=true;this.evidence.explanation=true;this.version++}if(phase==='transfer')this.code=this.step('transfer').starter??'';if(typeof code==='string'&&code!==''&&['practice','transfer'].includes(phase))this.setCode(code);return true}
 snapshot(){return {lessonId:this.lesson.id,phase:this.phase,busy:this.busy,attempts:this.attempts,evidence:{...this.evidence},code:this.code,accountReward:false,resumedFrom:this.resumedFrom??null}}
}
