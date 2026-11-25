// Private resume checkpoint: last lesson, phase and draft code, one record per language.
// Device copy is written first and kept until the server confirms it. The newest savedAt wins.
// Never used for scoring. Keys include the uid so accounts on one device never mix.
export const RESUME_PREFIX='cq_resume_v1:';
export const MAX_DRAFT=20000;
const PHASES=['prediction','worked','practice','explanation','transfer','complete'];
export class ResumeSync{
 constructor({uid,accountSync=true,getToken,storage,fetchFn,endpoint,now=()=>Date.now(),debounceMs=4000,retryMs=[5000,15000,60000],setTimer=(f,ms)=>setTimeout(f,ms),clearTimer=x=>clearTimeout(x),onStatus=()=>{}}){
  if(!uid)throw new TypeError('uid required');
  Object.assign(this,{uid,accountSync,getToken,storage,fetchFn,endpoint,now,debounceMs,retryMs,setTimer,clearTimer,onStatus});
  this.timers=new Map();this.inflight=new Map();this.fails=new Map();this.status='idle';
 }
 key(lang){return RESUME_PREFIX+this.uid+':'+lang}
 readLocal(lang){try{const r=JSON.parse(this.storage.getItem(this.key(lang))||'null');return r&&typeof r.lessonId==='string'&&PHASES.includes(r.phase)&&Number.isInteger(r.savedAt)?r:null}catch{return null}}
 writeLocal(lang,r){try{this.storage.setItem(this.key(lang),JSON.stringify(r));return true}catch{return false}}
 set(s,force){if(this.status!==s||force){this.status=s;this.onStatus(s)}}
 checkpoint({language,lessonId,phase,draft}){
  if(!language||!lessonId||!PHASES.includes(phase))return false;
  const prev=this.readLocal(language);const savedAt=Math.max(this.now(),(prev?.savedAt??0)+1);
  const d=phase==='complete'||typeof draft!=='string'?'':draft.slice(0,MAX_DRAFT);
  if(prev&&prev.lessonId===lessonId&&prev.phase===phase&&prev.draft===d&&!prev.pending)return true;
  this.writeLocal(language,{lessonId,phase,draft:d,savedAt,rev:prev?.rev??0,pending:true});
  if(!this.accountSync){this.set('device',true);return true}
  this.set('pending');this.schedule(language,this.debounceMs);return true;
 }
 schedule(lang,ms){this.clearTimer(this.timers.get(lang));this.timers.set(lang,this.setTimer(()=>{this.push(lang)},ms))}
 async push(lang){
  this.clearTimer(this.timers.get(lang));
  if(this.inflight.get(lang))return this.inflight.get(lang);
  const p=this._push(lang).finally(()=>this.inflight.delete(lang));this.inflight.set(lang,p);return p;
 }
 async _push(lang){
  const rec=this.readLocal(lang);if(!rec||!rec.pending)return 'idle';
  let res;
  try{
   const token=await this.getToken();if(!token){this.set('device');return 'device'}
   res=await this.fetchFn(this.endpoint+'/api/progress/resume',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({language:lang,lessonId:rec.lessonId,phase:rec.phase,draft:rec.draft,savedAt:rec.savedAt,sentAt:this.now(),baseRev:rec.rev??0})});
  }catch{return this.fail(lang)}
  if(res.status===400||res.status===401||res.status===403||res.status===503){this.set('device');return 'device'}
  if(!res.ok)return this.fail(lang);
  let data;try{data=await res.json()}catch{return this.fail(lang)}
  if(!data?.success)return this.fail(lang);
  this.fails.set(lang,0);
  const cur=this.readLocal(lang);
  if(data.stale&&data.resume){ // another device saved a newer checkpoint: keep it, drop our older pending copy
   if(!cur||cur.savedAt<=rec.savedAt)this.writeLocal(lang,{...data.resume,pending:false});
   this.set('saved');return 'stale';
  }
  if(cur&&cur.savedAt===rec.savedAt)this.writeLocal(lang,{...cur,rev:data.resume?.rev??cur.rev,pending:false});
  else this.schedule(lang,this.debounceMs); // newer edit arrived while the request was in flight
  this.set(this.anyPending()?'pending':'saved');return 'saved';
 }
 fail(lang){const n=(this.fails.get(lang)??0)+1;this.fails.set(lang,n);this.schedule(lang,this.retryMs[Math.min(n-1,this.retryMs.length-1)]);this.set('failed');return 'failed'}
 anyPending(){for(const k of this.timers.keys()){if(this.readLocal(k)?.pending)return true}return false}
 async flush(){for(const k of [...this.timers.keys()])await this.push(k)}
 // Restore never compares device and server clocks. A device copy with nothing pending is replaced by a
 // newer server revision. A pending device copy is pushed and the server orders it (revision plus corrected time).
 async restore(lang){
  const local=this.readLocal(lang);let remote=null;
  if(this.accountSync){try{const token=await this.getToken();if(token){const res=await this.fetchFn(this.endpoint+'/api/progress/get',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:'{}'});if(res.ok){const d=await res.json();remote=d?.resume?.[lang]??null}}}catch{}}
  if(remote&&Number.isInteger(remote.savedAt)&&Number.isInteger(remote.rev)&&(!local||(!local.pending&&remote.rev>(local.rev??0)))){this.writeLocal(lang,{...remote,pending:false});return {...remote,source:'account'}}
  if(local){if(local.pending&&this.accountSync)this.schedule(lang,this.debounceMs);return {...local,source:'device'}}
  return null;
 }
}
