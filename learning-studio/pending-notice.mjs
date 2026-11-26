// Honest status for results that are saved on this device but not yet recorded on the account. Shown only when serverAssessment is ON
// and something is waiting. It never says "saved to account" and it offers a deliberate retry when automatic retries are used up.
import {pendingStatus,retryExhausted} from './progress-api.mjs';
export function mountPendingNotice({uid,storage,sendOpts}){
 const render=()=>{
  let el=document.getElementById('pendingNotice');const st=pendingStatus({uid,storage});
  if(!st.total){el?.remove();return}
  if(!el){el=document.createElement('div');el.id='pendingNotice';el.setAttribute('role','status');el.style.cssText='margin:10px auto;max-width:720px;padding:10px 14px;border-radius:12px;background:#2a2410;color:#ffe9a8;border:1px solid #6b5a1e;font:600 .9rem/1.6 inherit;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap';document.body.prepend(el)}
  el.replaceChildren();const t=document.createElement('span');
  t.textContent=st.needsLogin?'نتيجتك محفوظة على الجهاز لكن لسه متسجلتش على حسابك. سجّل الدخول تاني وجرّب.':st.exhausted?'نتيجتك محفوظة على الجهاز لكن لسه متسجلتش على حسابك. جرّب التسجيل تاني.':'نتيجتك محفوظة على الجهاز وهتتسجل على حسابك لما الاتصال يرجع.';
  if(st.why){const w=document.createElement('small');w.dir='ltr';w.style.cssText='display:block;opacity:.8;margin-top:4px;font-weight:400';w.textContent='code: '+st.why;t.append(w)}el.append(t);
  if(st.exhausted){const b=document.createElement('button');b.type='button';b.textContent='جرّب التسجيل تاني';b.style.cssText='padding:6px 12px;border-radius:10px;border:0;font:inherit;cursor:pointer';b.onclick=async()=>{b.disabled=true;try{await retryExhausted({uid,storage,enabled:true,...sendOpts()})}finally{render()}};el.append(b)}
 };render();return render;
}
