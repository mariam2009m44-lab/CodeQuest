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
import { academyWorker } from "./academy-api.js";
const submitStudent=httpsCallable(functions,"submitStudentAcademyProfile");
const submitInstructorCallable=httpsCallable(functions,"submitInstructorApplication");
async function submitInstructor(payload){
 const w=await academyWorker(currentUser,"instructor-application",payload);
 if(w.ok)return {data:w.data,worker:true};
 if(w.unreachable)throw new Error("لم نتأكد من وصول طلبك. افتح الصفحة من جديد وتحقق من حالة الطلب قبل إعادة الإرسال.");
 if(!w.off)throw new Error(w.data.message==="rate_limited"?"تم الوصول للحد اليومي لإرسال الطلب. حاول غدًا.":w.data.message==="already_approved"?"هذا الحساب معتمد بالفعل.":(w.data.message||"تعذر إرسال الطلب."));
 return submitInstructorCallable(payload);
}
const callableStatus=httpsCallable(functions,"getMyAcademyRegistrationStatus");
let workerInstructor=false;
async function getStatus(){
 const w=await academyWorker(currentUser,"my-status",{});
 workerInstructor=w.ok;
 let data={};let failure=null;
 try{data=(await callableStatus({})).data||{};}catch(error){failure=error;}
 if(w.ok&&w.data.exists)data={...data,instructorApplication:{...w.data.application,status:w.data.status}};
 if(failure&&!w.ok)throw failure;
 return {data};
}
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
 if(!user){accountState.textContent="سجّل الدخول بحساب CodeQuest الحالي أولًا، ثم عودي لإكمال بيانات الأكاديمية.";const link=document.createElement("a");link.href="login.html?next=academy-registration.html";link.textContent="تسجيل الدخول";link.style.color="#a78bfa";accountState.append(" ",link);studentForm.querySelectorAll("input,select,button,textarea").forEach(x=>x.disabled=true);instructorForm.querySelectorAll("input,select,button,textarea").forEach(x=>x.disabled=true);return;}
 try{
  const state=await getStatus({});
  const student=state.data?.studentProfile;const instructor=state.data?.instructorApplication;
  accountState.textContent="تم تسجيل الدخول باسم "+(user.displayName||"حساب CodeQuest")+". "+(user.emailVerified?"البريد الإلكتروني موثّق.":"يمكنك إكمال ملف الطالب أو طلب المدرب الآن؛ توثيق البريد مطلوب قبل اعتماد المدرب.");
  verifyButton.hidden=Boolean(user.emailVerified);
  if(student){studentForm.elements.ageBand.value=student.ageBand||"";studentForm.elements.grade.value=student.grade||"";studentForm.elements.skillLevel.value=student.skillLevel||"beginner";studentForm.elements.learningGoals.value=student.learningGoals||"";studentForm.elements.learningNeeds.value=student.learningNeeds||"";studentForm.elements.preferredSchedule.value=student.preferredSchedule||"";(student.interests||[]).forEach(v=>{const input=studentForm.querySelector('input[value="'+v+'"]');if(input)input.checked=true;});const consentInput=studentForm.elements.guardianConsent;if(consentInput)consentInput.checked=student.guardianConsent===true;updateConsent();setFeedback(studentFeedback,student.ageBand!=="18+"&&!student.guardianConsentVerified?"ملفك محفوظ، وسيظل التسجيل في الفصول المباشرة معلقًا حتى تتحقق الإدارة من موافقة ولي الأمر.":"ملف الطالب محفوظ بالفعل. يمكنك تحديث بياناتك وإعادة الحفظ.");}
  if(instructor){
   const labels={pending:"طلبك قيد المراجعة من إدارة CodeQuest.",approved:workerInstructor?"تمت الموافقة على طلبك كمدرب. سنُعلمك عند إتاحة إنشاء الفصول المباشرة.":"تم اعتماد حسابك كمدرب. يمكنك إنشاء الفصول مباشرة.",rejected:"لم تتم الموافقة على الطلب السابق. يمكنك تحديث البيانات وإعادة التقديم."};
   setFeedback(instructorFeedback,labels[instructor.status]||"حالة الطلب: "+instructor.status,instructor.status==="rejected");
   ["fullName","experience","bio","portfolioUrl","availability","linkedinUrl","introVideoUrl","teachingDemoUrl","qualifications","teachingExperience"].forEach(name=>{if(instructorForm.elements[name])instructorForm.elements[name].value=instructor[name]||"";});
   ["specialties","teachingStyles","ageGroups","teachingLevels"].forEach(name=>(instructor[name]||[]).forEach(value=>{const input=instructorForm.querySelector('input[name="'+name+'"][value="'+value+'"]');if(input)input.checked=true;}));
   instructorForm.elements.sampleWorkLinks.value=(instructor.sampleWorkLinks||[]).join("\\n");
  }
 }catch(error){accountState.textContent="تعذر تحميل حالة التسجيل. "+(error.message||"حاول مرة أخرى.");}
});
verifyButton.addEventListener("click",async()=>{if(!currentUser)return;verifyButton.disabled=true;try{await sendEmailVerification(currentUser);setFeedback(instructorFeedback,"تم إرسال رابط توثيق البريد. افتح الرسالة ثم أعد تسجيل الدخول لتحديث حالة التوثيق.");}catch(error){setFeedback(instructorFeedback,error.message||"تعذر إرسال رسالة التوثيق.",true);}finally{verifyButton.disabled=false;}});
studentForm.addEventListener("submit",async event=>{
 event.preventDefault();if(!currentUser)return;
 const button=studentForm.querySelector('button[type="submit"]');button.disabled=true;
 try{
  const interests=checkedValues(studentForm,"interests");
  if(!interests.length)throw new Error("اختار مجالًا واحدًا على الأقل.");
  const saved=await submitStudent({ageBand:studentForm.elements.ageBand.value,grade:studentForm.elements.grade.value.trim(),skillLevel:studentForm.elements.skillLevel.value,interests,guardianConsent:studentForm.elements.guardianConsent.checked,learningGoals:studentForm.elements.learningGoals.value.trim(),learningNeeds:studentForm.elements.learningNeeds.value.trim(),preferredSchedule:studentForm.elements.preferredSchedule.value.trim()});
  setFeedback(studentFeedback,saved.data?.status==="pending_guardian"?"تم حفظ الملف. سيظل التسجيل في الفصول المباشرة معلقًا حتى تتحقق الإدارة من موافقة ولي الأمر.":"تم حفظ ملف الطالب وتفعيله بنجاح.");
 }catch(error){setFeedback(studentFeedback,error.message||"تعذر حفظ البيانات.",true);}
 finally{button.disabled=false;}
});
instructorForm.addEventListener("submit",async event=>{
 event.preventDefault();if(!currentUser)return;
 const button=instructorForm.querySelector('button[type="submit"]');button.disabled=true;
 try{
  const specialties=checkedValues(instructorForm,"specialties");
  if(!specialties.length)throw new Error("اختار تخصصًا واحدًا على الأقل.");
  const sampleWorkLinks=instructorForm.elements.sampleWorkLinks.value.split(/\\r?\\n/).map(value=>value.trim()).filter(Boolean);
  await submitInstructor({
   fullName:instructorForm.elements.fullName.value.trim(),specialties,
   experience:instructorForm.elements.experience.value.trim(),bio:instructorForm.elements.bio.value.trim(),
   portfolioUrl:instructorForm.elements.portfolioUrl.value.trim(),availability:instructorForm.elements.availability.value.trim(),
   linkedinUrl:instructorForm.elements.linkedinUrl.value.trim(),introVideoUrl:instructorForm.elements.introVideoUrl.value.trim(),
   teachingDemoUrl:instructorForm.elements.teachingDemoUrl.value.trim(),qualifications:instructorForm.elements.qualifications.value.trim(),
   teachingExperience:instructorForm.elements.teachingExperience.value.trim(),
   teachingStyles:checkedValues(instructorForm,"teachingStyles"),ageGroups:checkedValues(instructorForm,"ageGroups"),
   teachingLevels:checkedValues(instructorForm,"teachingLevels"),sampleWorkLinks
  });
  if(!currentUser.emailVerified){try{await sendEmailVerification(currentUser);}catch{}}
  setFeedback(instructorFeedback,currentUser.emailVerified?"تم إرسال طلبك إلى إدارة CodeQuest للمراجعة.":"تم إرسال طلبك، وأرسلنا رابط توثيق البريد. يجب توثيق البريد قبل اعتماد حسابك.");
 }catch(error){setFeedback(instructorFeedback,error.message||"تعذر إرسال الطلب.",true);}
 finally{button.disabled=false;}
});