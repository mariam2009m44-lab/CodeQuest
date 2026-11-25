import { auth, functions, authPersistenceReady } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";
let workerMode=false,currentUser=null;
const state=document.getElementById("adminState");
const content=document.getElementById("adminContent");
const stats=document.getElementById("adminStats");
const pending=document.getElementById("pendingInstructors");
const classes=document.getElementById("adminClasses");
const students=document.getElementById("adminStudents");
const instructors=document.getElementById("adminInstructors");
const groups=document.getElementById("adminGroups");
const posts=document.getElementById("adminPosts");
const audit=document.getElementById("adminAudit");
const refresh=document.getElementById("refreshAdmin");
const getOverview=httpsCallable(functions,"getAcademyAdminOverview");
const listAdminCallable=httpsCallable(functions,"listAcademyAdminRecords");
async function listAdminRecords(args){if(!workerMode)return listAdminCallable(args);const r=await academyWorker(currentUser,"admin/applications",{status:args.type==="pendingInstructors"?"pending":"",cursor:args.cursorId,limit:args.pageSize});if(!r.ok)throw new Error("تعذر تحميل بقية الطلبات.");const list=r.data.applications||[];return {data:{records:list,nextCursorId:list.length?list[list.length-1].cursorId:null,hasMore:r.data.hasMore===true}};}
const review=httpsCallable(functions,"reviewInstructorApplication");
const moderate=httpsCallable(functions,"moderateAcademyContent");
const manageClass=httpsCallable(functions,"manageAcademyLiveClass");
const reviewGuardian=httpsCallable(functions,"reviewStudentGuardianConsent");

import { academyWorker } from "./academy-api.js";

async function workerReview(args){const r=await academyWorker(currentUser,"admin/review",{uid:args.instructorUid,decision:args.decision==="approve"?"approved":"rejected"});if(!r.ok)throw new Error(({email_not_verified:"البريد غير موثّق، لا يمكن الاعتماد بعد.",not_pending:"تمت مراجعة هذا الطلب من قبل.",no_self_review:"لا يمكن مراجعة طلبك الشخصي."})[r.data.message]||r.data.message||"تعذرت مراجعة الطلب.");return r;}
const pageState={};
const pageTargets={
 students:{element:students,type:"students",render:renderStudents,initialSize:100},
 instructors:{element:instructors,type:"instructors",render:renderInstructors,initialSize:100},
 pendingInstructors:{element:pending,type:"pendingInstructors",render:renderPending,initialSize:50},
 classes:{element:classes,type:"classes",render:renderClasses,initialSize:50},
 groups:{element:groups,type:"groups",render:renderGroups,initialSize:50},
 posts:{element:posts,type:"posts",render:renderPosts,initialSize:50},
 auditLogs:{element:audit,type:"auditLogs",render:renderAudit,initialSize:50}
};
function setupPagers(){
 for(const [key,config] of Object.entries(pageTargets)){
  if(config.button)continue;
  const button=node("button","admin-load-more","تحميل المزيد");
  button.type="button";button.hidden=true;
  button.addEventListener("click",()=>loadNextPage(key));
  config.element.insertAdjacentElement("afterend",button);
  config.button=button;
 }
}
async function loadNextPage(key){
 const config=pageTargets[key],current=pageState[key];
 if(!current?.cursorId||!config)return;
 config.button.disabled=true;config.button.textContent="جارٍ تحميل المزيد…";
 try{
  const response=await listAdminRecords({type:config.type,cursorId:current.cursorId,pageSize:25});
  const result=response.data||{};
  const combined=[...current.items,...(result.records||[])];
  pageState[key]={items:combined,cursorId:result.nextCursorId||null,hasMore:result.hasMore===true};
  config.render(combined);
  config.button.hidden=!pageState[key].hasMore;
  config.button.textContent=pageState[key].hasMore?"تحميل المزيد":"تم عرض كل النتائج";
  message("تم تحميل "+(result.records||[]).length+" سجل إضافي.");
 }catch(error){
  message(error.message||"تعذر تحميل بقية السجلات.",true);
  config.button.textContent="إعادة المحاولة";
 }finally{config.button.disabled=false;}
}
function initializePage(key,items){
 const config=pageTargets[key],list=Array.isArray(items)?items:[];
 const last=list[list.length-1];
 const hasMore=list.length>=config.initialSize;
 pageState[key]={items:list,cursorId:last?.cursorId||null,hasMore};
 config.render(list);
 config.button.hidden=!hasMore||!last?.cursorId;
 config.button.textContent="تحميل المزيد";
}

let allowed=false;
function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function message(text,error=false){state.textContent=text;state.style.color=error?"#dc626e":"#25ad84";}
function makeAction(label,decision,uid){const button=node("button","admin-action",label);button.type="button";button.addEventListener("click",async()=>{button.disabled=true;try{await (workerMode?workerReview:review)({instructorUid:uid,decision});await load();}catch(error){message(error.message||"تعذرت مراجعة الطلب.",true);button.disabled=false;}});return button;}
function renderStats(data){stats.replaceChildren();const items=[["إجمالي الطلاب",data.students],["موافقات ولي الأمر قيد المراجعة",data.pendingGuardianReviews||0],["المدربون المعتمدون",data.approvedInstructors],["طلبات المدربين",data.pendingInstructors],["الفصول",data.classes],["المجموعات",data.groups],["المنشورات",data.posts]];for(const [label,value] of items){const card=node("article","admin-stat");card.append(node("strong","",String(value)),node("span","",label));stats.append(card);}}
function renderPending(items){pending.replaceChildren();if(!items.length){pending.append(node("p","admin-empty","لا توجد طلبات مدربين جديدة حاليًا."));return;}for(const item of items){const card=node("article","admin-application");const head=node("div","admin-application-head");head.append(node("h3","",item.fullName),node("span","admin-status","قيد المراجعة"));const details=node("div","admin-details");details.append(node("p","", "البريد: "+item.email),node("p","",item.emailVerified?"البريد موثّق":"البريد غير موثّق — لا يمكن اعتماد الحساب بعد"),node("p","", "التخصصات: "+(item.specialties||[]).join("، ")),node("p","", "الخبرة: "+(item.experience||"غير محددة")),node("p","",item.bio));if(item.availability)details.append(node("p","","المواعيد: "+item.availability));
for(const [label,value] of [["المؤهلات",item.qualifications],["الخبرة التعليمية",item.teachingExperience],["أساليب التدريس",(item.teachingStyles||[]).join("، ")],["الفئات العمرية",(item.ageGroups||[]).join("، ")],["المستويات",(item.teachingLevels||[]).join("، ")]])if(value)details.append(node("p","",label+": "+value));
for(const [label,value] of [["Portfolio",item.portfolioUrl],["LinkedIn",item.linkedinUrl],["الفيديو التعريفي",item.introVideoUrl],["عينة الدرس",item.teachingDemoUrl],...((item.sampleWorkLinks||[]).map((url,index)=>["عينة عمل "+(index+1),url]))])if(value){const a=node("a","admin-link","فتح "+label);a.href=value;a.target="_blank";a.rel="noopener noreferrer";details.append(a);}const actions=node("div","admin-actions");const approveButton=makeAction("اعتماد المدرب","approve",item.uid);approveButton.disabled=!item.emailVerified;approveButton.title=item.emailVerified?"":"يجب توثيق البريد قبل الاعتماد";actions.append(approveButton,makeAction("رفض الطلب","reject",item.uid));card.append(head,details,actions);pending.append(card);}}
function dateLabel(value){return value?new Intl.DateTimeFormat("ar-EG",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"غير مسجل";}
function renderStudents(items){
 students.replaceChildren();
 if(!items.length){students.append(node("p","admin-empty","لا توجد ملفات طلاب حتى الآن."));return;}
 for(const item of items){
  const card=node("article","admin-student");
  const head=node("div","admin-application-head");
  head.append(node("h3","",item.displayName),node("span","admin-status",item.ageBand||"الفئة العمرية غير محددة"));
  const details=node("div","admin-details");
  const consentLabel=item.ageBand==="18+"?"غير مطلوبة (18+)":item.guardianConsentVerified?"تم التحقق إداريًا":item.guardianConsent?"إقرار ذاتي — بانتظار تحقق الإدارة":"لم يُسجل إقرار";
  details.append(node("p","","البريد الإلكتروني: "+(item.email||"غير متاح")),node("p","","المرحلة الدراسية: "+(item.grade||"غير محددة")),node("p","","المستوى: "+({beginner:"مبتدئ",basic:"أساسي",intermediate:"متوسط"}[item.skillLevel]||"غير محدد")),node("p","","الاهتمامات: "+(item.interests||[]).join("، ")),node("p","","الأهداف التعليمية: "+(item.learningGoals||"غير محددة")),node("p","","احتياجات التعلم: "+(item.learningNeeds||"غير محددة")),node("p","","المواعيد المناسبة: "+(item.preferredSchedule||"غير محددة")),node("p","","موافقة ولي الأمر: "+consentLabel),node("p","","حالة الملف: "+(item.status||"غير محددة")),node("p","","تاريخ التسجيل: "+dateLabel(item.createdAt)),node("p","","آخر تحديث: "+dateLabel(item.updatedAt)));
  card.append(head,details);
  if(item.ageBand!=="18+"&&!item.guardianConsentVerified&&item.guardianConsent===true){
   const actions=node("div","admin-actions");
   const verify=node("button","admin-action","تأكيد الموافقة بعد التحقق");
   verify.type="button";
   verify.addEventListener("click",async()=>{
    if(!window.confirm("لا تستخدمي هذا الإجراء إلا بعد التحقق فعليًا من موافقة ولي الأمر خارج المنصة. هل تم التحقق؟"))return;
    verify.disabled=true;
    try{await reviewGuardian({studentUid:item.uid,decision:"verify"});await load();}
    catch(error){message(error.message||"تعذر تحديث حالة الموافقة.",true);verify.disabled=false;}
   });
   actions.append(verify);card.append(actions);
  }
  students.append(card);
 }
}
function renderInstructors(items){instructors.replaceChildren();if(!items.length){instructors.append(node("p","admin-empty","لا توجد طلبات مدربين حتى الآن."));return;}const labels={pending:"قيد المراجعة",approved:"معتمد",rejected:"مرفوض"};for(const item of items){const card=node("article","admin-student");const head=node("div","admin-application-head");head.append(node("h3","",item.fullName||"مدرب بدون اسم"),node("span","admin-status",labels[item.status]||item.status));const details=node("div","admin-details");details.append(node("p","","البريد الإلكتروني: "+(item.email||"غير متاح")),node("p","","توثيق البريد: "+(item.emailVerified?"موثّق":"غير موثّق")),node("p","","التخصصات: "+(item.specialties||[]).join("، ")),node("p","","الخبرة أو المؤهل: "+(item.experience||"غير محدد")),node("p","","نبذة المدرب: "+(item.bio||"غير متاحة")),node("p","","المواعيد المتاحة: "+(item.availability||"غير محددة")),node("p","","المؤهلات: "+(item.qualifications||"غير محددة")),node("p","","الخبرة التعليمية: "+(item.teachingExperience||"غير محددة")),node("p","","أساليب التدريس: "+(item.teachingStyles||[]).join("، ")),node("p","","الفئات العمرية: "+(item.ageGroups||[]).join("، ")),node("p","","المستويات: "+(item.teachingLevels||[]).join("، ")),node("p","","تاريخ التقديم: "+dateLabel(item.submittedAt)),node("p","","آخر تحديث: "+dateLabel(item.updatedAt)));for(const [label,value] of [["Portfolio",item.portfolioUrl],["LinkedIn",item.linkedinUrl],["الفيديو التعريفي",item.introVideoUrl],["عينة الدرس",item.teachingDemoUrl],...((item.sampleWorkLinks||[]).map((url,index)=>["عينة عمل "+(index+1),url]))])if(value){const a=node("a","admin-link","فتح "+label);a.href=value;a.target="_blank";a.rel="noopener noreferrer";details.append(a);}card.append(head,details);instructors.append(card);}}
function localDateTime(value){if(!value)return "";const date=new Date(value);const offset=date.getTimezoneOffset();return new Date(date.getTime()-offset*60000).toISOString().slice(0,16);}
function renderClasses(items){
 classes.replaceChildren();
 if(!items.length){classes.append(node("p","admin-empty","لا توجد فصول حتى الآن."));return;}
 for(const item of items){
  const card=node("article","admin-class");
  const head=node("div","admin-application-head");
  head.append(node("h3","",item.title),node("span","admin-status",item.status==="live"?"مباشر":item.status==="ended"?"منتهٍ":item.status==="cancelled"?"ملغي":"مجدول"));
  const meta=node("p","admin-class-meta","المدرب: "+item.instructorName+" · الطلاب: "+item.enrollmentCount+"/"+item.capacity+" · "+(item.startsAt?new Intl.DateTimeFormat("ar-EG",{dateStyle:"medium",timeStyle:"short"}).format(new Date(item.startsAt)):"موعد غير محدد"));
  const roster=node("details","admin-roster");
  roster.append(node("summary","","قائمة الطلاب ("+(item.students||[]).length+")"));
  const list=node("ul","");
  for(const student of item.students||[])list.append(node("li","",student.displayName+" — "+(student.status==="enrolled"?"مسجل":student.status==="cancelled"?"ألغى التسجيل":"غير نشط")));
  if(!list.children.length)list.append(node("li","","لم يسجل أي طالب بعد."));
  roster.append(list);card.append(head,meta,roster);
  if(item.status==="scheduled"){
   const controls=node("div","admin-class-actions");
   const form=node("form","admin-reschedule-form");
   const dateLabel=node("label","","الموعد الجديد");
   const dateInput=node("input","");dateInput.type="datetime-local";dateInput.required=true;dateInput.value=localDateTime(item.startsAt);
   dateLabel.append(dateInput);
   const durationLabel=node("label","","المدة بالدقائق");
   const durationInput=node("input","");durationInput.type="number";durationInput.min="15";durationInput.max="180";durationInput.step="15";durationInput.required=true;durationInput.value=String(item.durationMinutes||60);
   durationLabel.append(durationInput);
   const capacityLabel=node("label","","السعة القصوى");
   const capacityInput=node("input","");capacityInput.type="number";capacityInput.min=String(Math.max(1,item.enrollmentCount||0));capacityInput.max="30";capacityInput.required=true;capacityInput.value=String(item.capacity||12);
   capacityLabel.append(capacityInput);
   const save=node("button","admin-action","حفظ التعديلات");save.type="submit";
   form.append(dateLabel,durationLabel,capacityLabel,save);
   const feedback=node("p","admin-class-feedback","");
   form.addEventListener("submit",async event=>{
    event.preventDefault();save.disabled=true;feedback.textContent="جارٍ تحديث بيانات الفصل…";
    try{await manageClass({classId:item.id,action:"reschedule",startsAt:dateInput.value,durationMinutes:Number(durationInput.value),capacity:Number(capacityInput.value)});feedback.textContent="تم تحديث موعد الفصل وسعته.";await load();}
    catch(error){feedback.textContent=error.message||"تعذر تحديث الفصل.";save.disabled=false;}
   });
   const cancel=node("button","admin-action admin-action-danger","إلغاء الفصل");cancel.type="button";
   cancel.addEventListener("click",async()=>{
    if(!window.confirm("سيتم إلغاء الفصل وإلغاء حجوزات الطلاب النشطة. هل تريد المتابعة؟"))return;
    cancel.disabled=true;feedback.textContent="جارٍ إلغاء الفصل وتحرير المقاعد…";
    try{await manageClass({classId:item.id,action:"cancel"});feedback.textContent="تم إلغاء الفصل وتحديث الحجوزات.";await load();}
    catch(error){feedback.textContent=error.message||"تعذر إلغاء الفصل.";cancel.disabled=false;}
   });
   controls.append(form,cancel,feedback);card.append(controls);
  }
  classes.append(card);
 }
}
function moderationButton(type,item,decision,label){const button=node("button","admin-action",label);button.type="button";button.addEventListener("click",async()=>{const enteredReason=window.prompt("سبب الإجراء (اختياري):");if(enteredReason===null)return;const reason=enteredReason.trim();button.disabled=true;try{await moderate({type,contentId:item.id,decision,reason});await load();}catch(error){message(error.message||"تعذر تنفيذ إجراء الإشراف.",true);button.disabled=false;}});return button;}
function renderGroups(items){groups.replaceChildren();if(!items.length){groups.append(node("p","admin-empty","لا توجد مجموعات حتى الآن."));return;}for(const item of items){const card=node("article","admin-student");const head=node("div","admin-application-head");head.append(node("h3","",item.name),node("span","admin-status",item.status));const details=node("div","admin-details");details.append(node("p","","المدرّس: "+item.instructorName),node("p","","الموضوع: "+(item.topic||"غير محدد")),node("p","","عدد الأعضاء: "+item.memberCount),node("p","","تاريخ الإنشاء: "+dateLabel(item.createdAt)),node("p","","معرّف المجموعة: "+item.id));const actions=node("div","admin-actions");actions.append(item.status==="active"?moderationButton("group",item,"hide","إيقاف ظهور المجموعة"):moderationButton("group",item,"restore","إعادة نشر المجموعة"));card.append(head,details,actions);groups.append(card);}}
function renderPosts(items){posts.replaceChildren();if(!items.length){posts.append(node("p","admin-empty","لا توجد منشورات حتى الآن."));return;}for(const item of items){const card=node("article","admin-student");card.append(node("h3","",item.instructorName),node("p","",""+item.text),node("p","admin-class-meta","الحالة: "+item.status+" · "+dateLabel(item.createdAt)),node("p","admin-class-meta","معرّف المنشور: "+item.id));const actions=node("div","admin-actions");actions.append(item.status==="published"?moderationButton("post",item,"hide","إخفاء المنشور"):moderationButton("post",item,"restore","إعادة نشر المنشور"));card.append(actions);posts.append(card);}}
function renderAudit(items){audit.replaceChildren();if(!items.length){audit.append(node("p","admin-empty","لا توجد عمليات مسجلة بعد."));return;}const labels={instructor_application_submitted:"إرسال طلب مدرّس",instructor_application_approved:"اعتماد مدرّس",instructor_application_rejected:"رفض طلب مدرّس",instructor_post_created:"نشر تحديث",instructor_post_hidden:"إخفاء منشور",instructor_post_restored:"إعادة نشر منشور",teacher_group_suspended:"إيقاف مجموعة",teacher_group_restored:"إعادة نشر مجموعة",student_guardian_consent_verified:"التحقق من موافقة ولي الأمر",student_guardian_consent_held:"تعليق تفعيل ملف الطالب",live_class_cancelled_by_admin:"إلغاء فصل مباشر",live_class_rescheduled_by_admin:"تعديل موعد فصل"};for(const item of items){const row=node("article","admin-student");row.append(node("strong","",labels[item.action]||item.action),node("p","admin-class-meta","المنفذ: "+(item.actorUid||"غير معروف")),node("p","admin-class-meta","المستهدف: "+(item.targetUid||item.targetId||"غير محدد")),node("p","admin-class-meta",dateLabel(item.createdAt)));if(item.reason)row.append(node("p","admin-class-meta","السبب: "+item.reason));audit.append(row);}}
async function loadWorker(){const [p1,p2]=await Promise.all([academyWorker(currentUser,"admin/applications",{status:"pending",limit:pageTargets.pendingInstructors.initialSize}),academyWorker(currentUser,"admin/applications",{limit:pageTargets.instructors.initialSize})]);if(!p1.ok||!p2.ok)throw new Error("تعذر تحميل الطلبات.");const pend=p1.data.applications||[],all=p2.data.applications||[];stats.replaceChildren();for(const [label,value] of [["طلبات قيد المراجعة"+(p1.data.hasMore?" (50+)":""),pend.length],["الطلبات المعروضة",all.length]]){const card=node("article","admin-stat");card.append(node("strong","",String(value)),node("span","",label));stats.append(card);}
 initializePage("pendingInstructors",pend);initializePage("instructors",all);
 pageState.pendingInstructors.hasMore=p1.data.hasMore===true;pageTargets.pendingInstructors.button.hidden=!pageState.pendingInstructors.hasMore;pageState.instructors.hasMore=p2.data.hasMore===true;pageTargets.instructors.button.hidden=!pageState.instructors.hasMore;
 for(const [el,name] of [[students,"ملفات الطلاب وموافقة ولي الأمر"],[classes,"متابعة الفصول المباشرة"],[groups,"مجموعات المدرّسين"],[posts,"منشورات المجتمع"],[audit,"سجل العمليات"]]){el.replaceChildren(node("p","admin-empty",name+": لم يُنفَّذ بعد في هذا المسار، وليست لوحة الإدارة مكتملة."));const b=pageTargets[Object.keys(pageTargets).find(k=>pageTargets[k].element===el)]?.button;if(b)b.hidden=true;}
 message("تم تحديث طلبات المدربين. باقي الأقسام لم تُنفَّذ بعد.");
 const intro=document.querySelector(".academy-intro p");if(intro)intro.textContent="المتاح الآن في هذا المسار: مراجعة طلبات المدربين فقط (قبول أو رفض). أقسام الطلاب والفصول والحضور والمجموعات والمنشورات وسجل العمليات لم تُنفَّذ بعد.";}
async function load(){if(!allowed)return;if(workerMode){refresh.disabled=true;try{await loadWorker();}catch(error){message(error.message,true);}finally{refresh.disabled=false;}return;}refresh.disabled=true;message("جارٍ تحميل بيانات الأكاديمية…");try{const response=await getOverview({});const data=response.data||{};renderStats(data.stats||{});initializePage("pendingInstructors",data.pendingInstructors||[]);initializePage("students",data.students||[]);initializePage("instructors",data.instructors||[]);initializePage("classes",data.classes||[]);initializePage("groups",data.groups||[]);initializePage("posts",data.posts||[]);initializePage("auditLogs",data.auditLogs||[]);message("تم تحديث بيانات الأكاديمية.");}catch(error){message(error.message||"تعذر تحميل بيانات الإدارة.",true);}finally{refresh.disabled=false;}}
refresh.addEventListener("click",load);
await authPersistenceReady;
onAuthStateChanged(auth,async user=>{content.hidden=true;if(!user){message("سجّلي الدخول بحساب الإدارة أولًا.",true);const a=node("a","","تسجيل الدخول");a.href="login.html?next=academy-admin.html";state.append(" ",a);return;}try{currentUser=user;const probe=await academyWorker(user,"admin/applications",{});if(probe.ok){workerMode=true;allowed=true;content.hidden=false;setupPagers();await load();return;}const token=await user.getIdTokenResult();allowed=token.claims.liveRole==="admin"||token.claims.admin===true;if(!allowed){message("هذا القسم مخصص لمسؤول الأكاديمية فقط.",true);return;}content.hidden=false;setupPagers();await load();}catch(error){message("تعذر التحقق من صلاحيات الإدارة.",true);}});
