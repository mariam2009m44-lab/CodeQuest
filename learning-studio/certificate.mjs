import {drawCertificate,certificatePdfBytes,trackLabel} from './certificate-pdf.mjs';
const $=id=>document.getElementById(id),q=new URLSearchParams(location.search);
const CODY='certificate-cody.png';
// Real records come only from an authoritative, account-backed completion record. None exists yet,
// so without ?demo=1 the page honestly shows that nothing has been issued. Demo uses synthetic data
// and carries a visible "design only, not issued" label.
const local=location.hostname==='localhost'||location.hostname==='127.0.0.1';
let record=null;
if(q.get('demo')==='1')record={name:'اسم الطالب (نموذج)',language:q.get('lang')||'python',issuedAt:new Date().toISOString(),demo:true};
else if(local&&q.get('synthetic')==='1')record={name:q.get('name')||'طالب تجريبي',language:q.get('lang')||'python',issuedAt:q.get('date')||new Date().toISOString(),certId:q.get('id')||undefined,demo:false,synthetic:true};
if(!record){$('certNone').hidden=false}
else{
 await drawCertificate($('certCanvas'),record,CODY);$('certCanvas').hidden=false;$('certActions').hidden=false;
 $('certNote').textContent=(record.demo||record.synthetic)?'هذا نموذج تصميم بيانات تجريبية، وليس شهادة صادرة.':'';
 const fname='CodeQuest-certificate-'+trackLabel(record.language).replace(/[^A-Za-z0-9+]+/g,'')+'.pdf';
 $('certPdf').onclick=async()=>{const b=$('certPdf');b.disabled=true;try{const bytes=await certificatePdfBytes(record,CODY);const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=fname;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}catch{$('certNote').textContent='تعذر إنشاء ملف PDF. جرّب الطباعة ثم احفظ كـ PDF.'}finally{b.disabled=false}};
 $('certPrint').onclick=()=>window.print();
}
