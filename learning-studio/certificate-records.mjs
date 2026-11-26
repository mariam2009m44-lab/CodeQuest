// Single boundary for the signed-in learner's own certificates. DISABLED until the backend ships
// GET /api/certificates (see docs/certificate-record-contract.md). Never uses localStorage as authority.
// Result states: disabled | signedout | ok (records, may be empty) | error (can't load; NOT "no certificates").
export const CERT_ENDPOINT_ENABLED=true;
const TRACKS=['python','javascript','cpp','java'];
const LABELS={python:'Python',javascript:'JavaScript',cpp:'C++',java:'Java'};
// Issuable only when every lesson and every unit exam passed AND code tasks were verified server-side. MCQ alone never qualifies.
const full=(a,b)=>Number.isInteger(a)&&Number.isInteger(b)&&b>0&&a===b;
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
export function validateCertificates(raw){
 if(!raw||typeof raw!=='object'||!Array.isArray(raw.certificates))return null;
 const out=[],seen=new Set();
 for(const r of raw.certificates){
  if(!r||typeof r!=='object')return null;
  const ok=TRACKS.includes(r.track)&&typeof r.recordId==='string'&&/^[A-Za-z0-9_-]{8,64}$/.test(r.recordId)
   &&typeof r.issuedAt==='string'&&ISO.test(r.issuedAt)&&!Number.isNaN(Date.parse(r.issuedAt))&&Date.parse(r.issuedAt)<=Date.now()+60000
   &&full(r.lessonsCompleted,r.lessonsTotal)&&full(r.unitExamsPassed,r.unitExamsTotal)&&r.codeTasksVerified===true;
  if(!ok||seen.has(r.track))return null; // any bad entry makes the whole response untrusted
  seen.add(r.track);out.push({language:r.track,recordId:r.recordId,issuedAt:r.issuedAt,lessonsTotal:r.lessonsTotal,unitExamsTotal:r.unitExamsTotal});
 }
 return out;
}
// deps: {enabled, getUid(): current uid or null, fetchCertificates(): Promise<body>}
export async function loadMyCertificates(deps={}){
 const {enabled=CERT_ENDPOINT_ENABLED,getUid=()=>null,fetchCertificates=null}=deps;
 if(!enabled||typeof fetchCertificates!=='function')return {state:'disabled',records:[]};
 const uid=getUid();if(!uid)return {state:'signedout',records:[]};
 let body;try{body=await fetchCertificates()}catch{return {state:'error',records:[]}}
 if(getUid()!==uid)return {state:'signedout',records:[]}; // signed out or switched while loading: drop the response
 const recs=validateCertificates(body);
 return recs?{state:'ok',records:recs}:{state:'error',records:[]};
}
// Latest-wins guard so a slow earlier response never overwrites a newer one.
export function latestOnly(){let n=0;return {begin(){return ++n},isCurrent(t){return t===n}}}
export function renderCertificates(doc,listEl,emptyEl,result){
 listEl.textContent='';
 if(result.state==='ok'&&result.records.length){
  for(const r of result.records){const li=doc.createElement('li'),a=doc.createElement('a');
   a.href='/learning-studio/certificate.html?id='+encodeURIComponent(r.recordId);a.textContent='شهادة مسار '+LABELS[r.language];li.append(a);listEl.append(li)}
  listEl.hidden=false;emptyEl.hidden=true;return;
 }
 listEl.hidden=true;emptyEl.hidden=false;
 emptyEl.textContent=result.state==='error'?'تعذر تحميل شهاداتك الآن. جرّبي مرة أخرى بعد قليل.'
  :result.state==='signedout'?'سجّل الدخول لعرض شهاداتك.'
  :'عرض الشهادات غير مفعّل حاليًا. لا يعني هذا أن حسابك بلا شهادات أو أن مسارًا اكتمل. ستظهر هنا بعد تفعيل تسجيل الإكمال على حسابك.';
}
