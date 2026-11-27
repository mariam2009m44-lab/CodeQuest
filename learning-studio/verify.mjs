// Public verification page opened from the QR on a certificate. It asks the Worker whether the certificate number exists and shows only the track and the issue date, never a name.
import {CERT_API_BASE} from './certificate-config.mjs';
const $=id=>document.getElementById(id),id=new URLSearchParams(location.search).get('id')||'';
const fmt=s=>{const t=new Date(s);return Number.isNaN(t.getTime())?'':String(t.getDate()).padStart(2,'0')+' / '+String(t.getMonth()+1).padStart(2,'0')+' / '+t.getFullYear()};
const say=(t,cls)=>{const m=$('vfMsg');m.textContent=t;m.className=cls||''};
if(!/^[a-f0-9]{32}$/.test(id))say('رقم الشهادة غير صحيح. تأكد أن الرابط منسوخ كاملًا من رمز QR على الشهادة.');
else{
 try{
  const r=await fetch(CERT_API_BASE+'/api/certificates/verify?id='+id,{headers:{Accept:'application/json'}});
  const d=await r.json().catch(()=>({}));
  if(r.ok&&d.valid===true&&d.trackName){say('✔ شهادة صحيحة صادرة من منصة CodeQuest','ok');$('vfTrack').textContent=String(d.trackName);$('vfDate').textContent=fmt(d.issuedAt);$('vfDl').hidden=false;$('vfNote').hidden=false}
  else if(r.status===404)say('هذه الشهادة لم تُسجَّل للتحقق بعد، أو الرقم غير صحيح. إن كنت صاحب الشهادة، سجّل الدخول وافتح صفحة "شهادتي" مرة واحدة ثم امسح الرمز مرة أخرى.');
  else say('تعذر التحقق الآن. حاول مرة أخرى بعد قليل.');
 }catch{say('تعذر الاتصال بخدمة التحقق. حاول مرة أخرى بعد قليل.')}
}
