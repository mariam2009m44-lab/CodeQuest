import { auth, functions, authPersistenceReady } from "./firebase-config.js";
import { onAuthStateChanged, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";
const accountState=document.getElementById("accountState");
const studentForm=document.getElementById("studentForm");
const instructorForm=document.getElementById("instructorForm");
const studentFeedback=document.getElementById("studentFeedback");
const instructorFeedback=document.getElementById("instructorFeedback");
const studentTab=document.getElementById("studentTab");
const instructorTab=document.getElementById("instructorTab");
const studentPanel=document.getElementById("studentPanel");
const instructorPanel=document.getElementById("instructorPanel");
const consentRow=document.getElementById("guardianConsentRow");
const ageSelect=studentForm.elements.ageBand;
const verifyButton=document.getElementById("verifyEmailButton");
const submitStudent=httpsCallable(functions,"submitStudentAcademyProfile");
const submitInstructor=httpsCallable(functions,"submitInstructorApplication");
const getStatus=httpsCallable(functions,"getMyAcademyRegistrationStatus");
let currentUser=null;
function setFeedback(node,text,error=false){node.textContent=text;node.style.color=error?"#dc626e":"#26a77f";}
function switchTab(which){
 const student=which==="student";
 studentPanel.hidden=!student;instructorPanel.hidden=student;
 studentTab.classList.toggle("is-active",student);instructorTab.classList.toggle("is-active",!student);
 studentTab.setAttribute("aria-selected",String(student));instructorTab.setAttribute("aria-selected",String(!student));
}
studentTab.addEventListener("click",()=>switchTab("student"));
instructorTab.addEventListener("click",()=>switchTab("instructor"));
function updateConsent(){consentRow.hidden=ageSelect.value==="18+";consentRow.querySelector("input").required=ageSelect.value!==""&&ageSelect.value!=="18+";}
ageSelect.addEventListener("change",updateConsent);updateConsent();
function checkedValues(form,name){return [...form.querySelectorAll('input[name="'+name+'"]:checked')].map(input=>input.value);}
await authPersistenceReady;
onAuthStateChanged(auth,async user=>{
 currentUser=user;
 if(!user){accountState.textContent="سجّلي الدخول بحساب CodeQuest الحالي أولًا، ثم عودي لإكمال بيانات الأكاديمية.";const link=document.createElement("a");link.href="login.html?next=academy-registration.html";link.textContent="تسجيل الدخول";link.style.color="#a78bfa";accountState.append(" ",link);studentForm.querySelectorAll("input,select,button,textarea").forEach(x=>x.disabled=true);instructorForm.querySelectorAll("input,select,button,textarea").forEach(x=>x.disabled=true);return;}
 try{
  const state=await getStatus({});
  const student=state.data?.studentProfile;const instructor=state.data?.instructorApplication;
  accountState.textContent="تم تسجيل الدخول باسم "+(user.displayName||"حساب CodeQuest")+". "+(user.emailVerified?"البريد الإلكتروني موثّق.":"يمكنك إكمال ملف الطالب أو طلب المدرب الآن؛ توثيق البريد مطلوب قبل اعتماد المدرب.");
  verifyButton.hidden=Boolean(user.emailVerified);
  if(student){studentForm.elements.ageBand.value=student.ageBand||"";studentForm.elements.grade.value=student.grade||"";studentForm.elements.skillLevel.value=student.skillLevel||"beginner";(student.interests||[]).forEach(v=>{const input=studentForm.querySelector('input[value="'+v+'"]');if(input)input.checked=true;});updateConsent();setFeedback(studentFeedback,"ملف الطالب محفوظ بالفعل. يمكنك تحديث بياناتك وإعادة الحفظ.");}
  if(instructor){const labels={pending:"طلبك قيد المراجعة من إدارة CodeQuest.",approved:"تم اعتماد حسابك كمدرب. يمكنك إنشاء الفصول مباشرة.",rejected:"لم تتم الموافقة على الطلب السابق. يمكنك تحديث البيانات وإعادة التقديم."};setFeedback(instructorFeedback,labels[instructor.status]||"حالة الطلب: "+instructor.status,instructor.status==="rejected");}
 }catch(error){accountState.textContent="تعذر تحميل حالة التسجيل. "+(error.message||"حاولي مرة أخرى.");}
});
verifyButton.addEventListener("click",async()=>{if(!currentUser)return;verifyButton.disabled=true;try{await sendEmailVerification(currentUser);setFeedback(instructorFeedback,"تم إرسال رابط توثيق البريد. افتحي الرسالة ثم أعيدي تسجيل الدخول لتحديث حالة التوثيق.");}catch(error){setFeedback(instructorFeedback,error.message||"تعذر إرسال رسالة التوثيق.",true);}finally{verifyButton.disabled=false;}});
studentForm.addEventListener("submit",async event=>{
 event.preventDefault();if(!currentUser)return;
 const button=studentForm.querySelector('button[type="submit"]');button.disabled=true;
 try{
  const interests=checkedValues(studentForm,"interests");
  if(!interests.length)throw new Error("اختاري مجالًا واحدًا على الأقل.");
  await submitStudent({ageBand:studentForm.elements.ageBand.value,grade:studentForm.elements.grade.value.trim(),skillLevel:studentForm.elements.skillLevel.value,interests,guardianConsent:studentForm.elements.guardianConsent.checked});
  setFeedback(studentFeedback,"تم حفظ ملف الطالب بنجاح. يمكنك الآن حجز مقعد في الفصول المتاحة.");
 }catch(error){setFeedback(studentFeedback,error.message||"تعذر حفظ البيانات.",true);}
 finally{button.disabled=false;}
});
instructorForm.addEventListener("submit",async event=>{
 event.preventDefault();if(!currentUser)return;
 const button=instructorForm.querySelector('button[type="submit"]');button.disabled=true;
 try{
  const specialties=checkedValues(instructorForm,"specialties");
  if(!specialties.length)throw new Error("اختاري تخصصًا واحدًا على الأقل.");
  await submitInstructor({fullName:instructorForm.elements.fullName.value.trim(),specialties,experience:instructorForm.elements.experience.value.trim(),bio:instructorForm.elements.bio.value.trim(),portfolioUrl:instructorForm.elements.portfolioUrl.value.trim(),availability:instructorForm.elements.availability.value.trim()});
  if(!currentUser.emailVerified){try{await sendEmailVerification(currentUser);}catch{}}
  setFeedback(instructorFeedback,currentUser.emailVerified?"تم إرسال طلبك إلى إدارة CodeQuest للمراجعة.":"تم إرسال طلبك، وأرسلنا رابط توثيق البريد. يجب توثيق البريد قبل اعتماد حسابك.");
 }catch(error){setFeedback(instructorFeedback,error.message||"تعذر إرسال الطلب.",true);}
 finally{button.disabled=false;}
});