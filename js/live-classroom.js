import { auth, functions, authPersistenceReady } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";
const status=document.getElementById("roomStatus");
const params=new URLSearchParams(location.search);
const classId=params.get("classId");
let requested=false;
function setStatus(message,error=false){status.textContent=message;status.style.color=error?"#fca5a5":"#aab0bd";}
await authPersistenceReady;
onAuthStateChanged(auth,async user=>{
 if(requested)return;
 if(!user){setStatus("سجّلي الدخول أولًا للانضمام إلى الفصل.",true);return;}
 if(!classId){setStatus("رابط الفصل غير مكتمل.",true);return;}
 requested=true;
 try{
  const join= httpsCallable(functions,"joinLiveClass");
  const response=await join({classId});
  const authToken=response.data?.authToken;
  if(!authToken)throw new Error("لم يصل رمز الانضمام من الخادم.");
  await customElements.whenDefined("rtk-meeting");
  if(!window.RealtimeKitClient?.init)throw new Error("مكوّن الاتصال المباشر لم يتم تحميله.");
  const meeting=await window.RealtimeKitClient.init({authToken});
  document.getElementById("classroom").meeting=meeting;
  setStatus("تم التحقق من صلاحيتك. يمكنك ضبط الميكروفون والكاميرا من أدوات الفصل.");
 }catch(error){
  setStatus(error?.message||"تعذر الانضمام إلى الفصل. تحققي من التسجيل وموعد الجلسة.",true);
 }
});