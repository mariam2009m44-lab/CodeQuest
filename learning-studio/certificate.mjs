import {CERT_ENDPOINT_ENABLED,loadMyCertificates} from './certificate-records.mjs';import {makeCertificateFetcher} from './certificate-source.mjs';import {drawCertificate,certificatePdfBytes,trackLabel} from './certificate-pdf.mjs';
const $=id=>document.getElementById(id),q=new URLSearchParams(location.search);
const CODY='certificate-cody.png';
// Real records come only from an authoritative, account-backed completion record. None exists yet,
// so without ?demo=1 the page honestly shows that nothing has been issued. Demo uses synthetic data
// and carries a visible "design only, not issued" label.
const local=location.hostname==='localhost'||location.hostname==='127.0.0.1';
let record=null;
if(q.get('demo')==='1')record={name:'اسم الطالب (نموذج)',language:q.get('lang')||'python',issuedAt:new Date().toISOString(),demo:true};
else if(local&&q.get('synthetic')==='1')record={name:q.get('name')||'طالب تجريبي',language:q.get('lang')||'python',issuedAt:q.get('date')||new Date().toISOString(),certId:q.get('id')||undefined,demo:false,synthetic:true};
let failed=false,st='disabled';
// Real records come only through the trusted adapter (authenticated endpoint, current uid). The URL carries
// only a record id used to pick from the adapter's result, never record data. Disabled until the backend exists.
if(!record&&CERT_ENDPOINT_ENABLED){
 try{
  const auth=await import('../js/auth.js');
  // Firebase restores the saved session asynchronously: wait for it, or a signed-in learner is told to sign in.
  try{await auth.requireUser()}catch{}
  const res=await loadMyCertificates({enabled:true,getUid:()=>auth.getCurrentUser()?.uid||null,fetchCertificates:makeCertificateFetcher(()=>auth.getCurrentUser())});
  st=res.state;if(res.state==='error')failed=true;
  const hit=res.state==='ok'?res.records.find(r=>r.recordId===q.get('id')):null;
  if(hit){const prof=await auth.getUserProfile();const nm=String(prof?.name||prof?.displayName||'').trim();if(nm)record={name:nm,language:hit.language,issuedAt:hit.issuedAt,certId:hit.recordId,demo:false}}
 }catch{failed=true;st='error'}
}
if(!record){const msg={disabled:'عرض الشهادات غير مفعّل حاليًا.',error:'تعذر تحميل الشهادة الآن. جرّبي مرة أخرى بعد قليل.',signedout:'سجّل الدخول لعرض شهادتك.',ok:'لا توجد شهادة بهذا المعرّف في حسابك.'};$('certNone').textContent=msg[st]||msg.error;$('certNone').hidden=false}
else{
 await drawCertificate($('certCanvas'),record,CODY);$('certCanvas').hidden=false;$('certActions').hidden=false;
 $('certNote').textContent=(record.demo||record.synthetic)?'هذا نموذج تصميم بيانات تجريبية، وليس شهادة صادرة.':'';
 const fname='CodeQuest-certificate-'+trackLabel(record.language).replace(/[^A-Za-z0-9+]+/g,'')+'.pdf';
 $('certPdf').onclick=async()=>{const b=$('certPdf'),t=b.textContent;b.disabled=true;b.textContent='جاري تجهيز الملف...';try{const bytes=await certificatePdfBytes(record,CODY);const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=fname;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}catch{$('certNote').textContent='تعذر إنشاء ملف PDF. جرّب الطباعة ثم احفظ كـ PDF.'}finally{b.disabled=false;b.textContent=t}};
 $('certPrint').onclick=()=>window.print();
}
