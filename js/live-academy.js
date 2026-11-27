import { auth, functions, authPersistenceReady } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";
import { acadMsg, academyErrorIsDown } from "./academy-errors.js";

const account = document.getElementById("liveAccount");
const list = document.getElementById("classList");
const createPanel = document.getElementById("createPanel");
const adminPanel = document.getElementById("adminPanel");
const bootstrapButton = document.getElementById("bootstrapAdmin");
const approveForm = document.getElementById("approveInstructorForm");
const approveSelfButton = document.getElementById("approveSelfButton");
const adminFeedback = document.getElementById("adminFeedback");
const createForm = document.getElementById("createClassForm");
const feedback = document.getElementById("createFeedback");
const refreshButton = document.getElementById("refreshClasses");
const listClasses = httpsCallable(functions, "listLiveClasses");
const enrollClass = httpsCallable(functions, "enrollInLiveClass");
const cancelEnrollment = httpsCallable(functions, "cancelLiveClassEnrollment");
const createClass = httpsCallable(functions, "createLiveClass");
const setClassStatus = httpsCallable(functions, "setLiveClassStatus");
const bootstrapAdmin = httpsCallable(functions, "bootstrapLiveAcademyAdmin");
const approveInstructor = httpsCallable(functions, "approveLiveInstructor");
const listRoster = httpsCallable(functions, "listInstructorClassRoster");
const listMyGroups = httpsCallable(functions, "listMyTeacherGroups");
const groupSelect = document.getElementById("classGroupSelect");
let currentUser = null;
let isInstructor = false;

function showMessage(target, message, error = false) {
  target.textContent = message;
  target.style.color = error ? "#b42318" : "#28734b";
}
function makeButton(label, handler, secondary = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (secondary) button.className = "secondary";
  button.addEventListener("click", handler);
  return button;
}
function renderClass(item) {
  const card = document.createElement("article");
  card.className = "live-class-card";
  const top = document.createElement("div");
  top.className = "live-class-card__top";
  const status = document.createElement("span");
  status.className = "live-pill";
  status.textContent = item.status === "live" ? "مباشر الآن" : "موعد قادم";
  top.append(status);
  const title = document.createElement("h3");
  title.textContent = item.title;
  const description = document.createElement("p");
  description.textContent = item.description || "فصل عملي لتعلّم البرمجة خطوة بخطوة.";
  const meta = document.createElement("div");
  meta.className = "live-class-meta";
  const date = document.createElement("span");
  date.textContent = item.startsAt ? new Intl.DateTimeFormat("ar-EG",{dateStyle:"medium",timeStyle:"short"}).format(new Date(item.startsAt)) : "الموعد غير متاح";
  const instructor = document.createElement("span");
  instructor.textContent = "المدرّب: " + item.instructorName;
  const count = document.createElement("span");
  count.textContent = "المقاعد: " + item.enrollmentCount + " / " + (item.capacity || 12) + " · المتاح: " + (item.seatsRemaining ?? Math.max(0,(item.capacity || 12)-item.enrollmentCount));
  meta.append(date,instructor,count);
  if(item.groupName){const group=document.createElement("span");group.textContent="المجموعة: "+item.groupName;meta.append(group);}
  const actions = document.createElement("div");
  actions.className = "live-actions";
  if (item.isInstructor || item.isAdmin) {
    if (item.status === "scheduled") actions.append(makeButton(item.isAdmin && !item.isInstructor ? "بدء الفصل كمسؤول" : "ابدأ الفصل",async()=>runAction(async()=>{await setClassStatus({classId:item.id,status:"live"});await loadClasses();})));
    if (item.status === "live") {
      actions.append(makeButton("دخول الفصل",()=>location.assign("live-classroom.html?classId="+encodeURIComponent(item.id))));
      actions.append(makeButton("إنهاء الفصل",async()=>runAction(async()=>{await setClassStatus({classId:item.id,status:"ended"});await loadClasses();}),true));
    }
  } else if (item.isEnrolled) {
    if (item.status === "live") actions.append(makeButton("انضم للفصل",()=>location.assign("live-classroom.html?classId="+encodeURIComponent(item.id))));
    else {
      const wait = document.createElement("span"); wait.className="live-pill"; wait.textContent="تم تسجيلك — انتظر بدء الفصل"; actions.append(wait);
      actions.append(makeButton("إلغاء التسجيل",async()=>runAction(async()=>{if(!confirm("هل تريد إلغاء تسجيلك في هذا الفصل؟"))return;await cancelEnrollment({classId:item.id});await loadClasses();}),true));
    }
  } else if (item.status === "scheduled") {
    if (item.isFull) {
      const full = document.createElement("span");
      full.className = "live-pill";
      full.textContent = "اكتملت المقاعد";
      actions.append(full);
    } else {
      actions.append(makeButton("سجّل في الفصل",async()=>runAction(async()=>{await enrollClass({classId:item.id});await loadClasses();})));
    }
  }
  card.append(top,title,description,meta,actions);
  if (item.isInstructor || item.isAdmin) {
    const roster=document.createElement("details");
    roster.className="live-roster";
    const summary=document.createElement("summary");
    summary.textContent="قائمة الطلاب المسجلين";
    const rosterList=document.createElement("div");
    rosterList.className="live-roster-list";
    roster.append(summary,rosterList);
    summary.addEventListener("click",async()=>{
      if(roster.dataset.loaded==="true"||roster.dataset.loading==="true")return;
      roster.dataset.loading="true";
      rosterList.textContent="جارٍ تحميل القائمة…";
      try{
        const response=await listRoster({classId:item.id});
        rosterList.replaceChildren();
        const students=response.data?.students||[];
        if(!students.length)rosterList.textContent="لم يسجل أي طالب في هذا الفصل بعد.";
        students.forEach((student,index)=>{
          const row=document.createElement("p");
          row.textContent=(index+1)+". "+student.displayName;
          rosterList.append(row);
        });
        roster.dataset.loaded="true";
      }catch(error){rosterList.textContent=acadMsg(error)||"تعذر تحميل قائمة الطلاب.";}
      finally{roster.dataset.loading="false";}
    });
    card.append(roster);
  }
  return card;
}
async function runAction(action) {
  try { await action(); }
  catch(error) { showMessage(account,acadMsg(error) || "تعذر تنفيذ العملية. حاول مرة أخرى.",true); }
}
async function loadClasses() {
  if (!currentUser) return;
  list.replaceChildren();
  const loading=document.createElement("div");loading.className="live-empty";loading.textContent="جارٍ تحميل الفصول…";list.append(loading);
  try {
    const result=await listClasses();
    const classes=Array.isArray(result.data?.classes)?result.data.classes:[];
    list.replaceChildren();
    if (!classes.length) {
      const empty=document.createElement("div");empty.className="live-empty";empty.textContent="لا توجد فصول متاحة حاليًا. ارجع لاحقًا للاطلاع على المواعيد الجديدة.";list.append(empty);return;
    }
    classes.forEach(item=>list.append(renderClass(item)));
  } catch(error) {
    list.replaceChildren();
    const empty=document.createElement("div");empty.className="live-empty";empty.textContent=acadMsg(error)||"تعذر تحميل الفصول. حاول مرة أخرى بعد قليل.";list.append(empty);
    if(!academyErrorIsDown(error))showMessage(account,acadMsg(error) || "تعذر الاتصال بخدمة الأكاديمية.",true);
  }
}
refreshButton.addEventListener("click",loadClasses);
bootstrapButton.addEventListener("click",async()=>{
  bootstrapButton.disabled=true;
  try{
    await bootstrapAdmin();
    await currentUser.getIdToken(true);
    showMessage(account,"تم إعداد صلاحية مسؤول الأكاديمية. حدّث الصفحة إذا لم تظهر أدوات الإدارة.");
    location.reload();
  }catch(error){showMessage(account,acadMsg(error)||"تعذر إعداد المسؤول. تأكد من إعداد بريد المالك على الخادم.",true);}
  finally{bootstrapButton.disabled=false;}
});
approveSelfButton.addEventListener("click",async()=>{
  approveSelfButton.disabled=true;
  try{await approveInstructor({instructorUid:currentUser.uid});await currentUser.getIdToken(true);showMessage(adminFeedback,"تم اعتماد حسابك كمدرّب. حدّث الصفحة.");location.reload();}
  catch(error){showMessage(adminFeedback,acadMsg(error)||"تعذر اعتماد الحساب.",true);}
  finally{approveSelfButton.disabled=false;}
});
approveForm.addEventListener("submit",async event=>{
  event.preventDefault();
  const button=approveForm.querySelector("button");button.disabled=true;
  try{
    const instructorUid=String(new FormData(approveForm).get("instructorUid")||"").trim();
    await approveInstructor({instructorUid});
    approveForm.reset();showMessage(adminFeedback,"تم اعتماد حساب المدرّب. يجب عليه تسجيل الخروج والدخول لتحديث صلاحياته.");
  }catch(error){showMessage(adminFeedback,acadMsg(error)||"تعذر اعتماد المدرّب.",true);}
  finally{button.disabled=false;}
});
createForm.addEventListener("submit",async event=>{
  event.preventDefault();
  if(!isInstructor)return;
  const submit=createForm.querySelector('button[type="submit"]');
  submit.disabled=true;showMessage(feedback,"جارٍ إنشاء غرفة الفصل…");
  const form=new FormData(createForm);
  const localDate=String(form.get("startsAt")||"");
  const startsAt=new Date(localDate);
  try {
    if(!Number.isFinite(startsAt.getTime()))throw new Error("اختار موعدًا صحيحًا.");
    await createClass({
      title:String(form.get("title")||"").trim(),
      description:String(form.get("description")||"").trim(),
      startsAt:startsAt.toISOString(),
      durationMinutes:Number(form.get("durationMinutes")||60),
      capacity:Number(form.get("capacity")||12),
      groupId:String(form.get("groupId")||"")
    });
    createForm.reset();
    showMessage(feedback,"تم إنشاء الفصل وغرفة البث. سيظهر الفصل في القائمة.");
    await loadClasses();
  } catch(error) {
    showMessage(feedback,acadMsg(error) || "تعذر إنشاء الفصل.",true);
  } finally {submit.disabled=false;}
});
await authPersistenceReady;
onAuthStateChanged(auth,async user=>{
  currentUser=user;
  if(!user){
    account.textContent="سجّل الدخول لمشاهدة الفصول والتسجيل فيها.";
    const link=document.createElement("a");link.href="login.html?next=live-academy.html";link.textContent="تسجيل الدخول";link.className="live-pill";account.append(" ",link);
    list.replaceChildren();const empty=document.createElement("div");empty.className="live-empty";empty.textContent="يلزم تسجيل الدخول لعرض الفصول.";list.append(empty);return;
  }
  try {
    const token=await user.getIdTokenResult();
    isInstructor=token.claims.liveRole==="instructor"&&token.claims.liveInstructorApproved===true;
    const isAdmin=token.claims.liveRole==="admin"||token.claims.admin===true;
    createPanel.hidden=!isInstructor;
    adminPanel.hidden=!isAdmin;
    if(isInstructor){
      try{
        const groupsResult=await listMyGroups();
        const ownedGroups=groupsResult.data?.groups||[];
        groupSelect.replaceChildren(new Option("فصل مفتوح لجميع الطلاب المسجلين",""));
        ownedGroups.forEach(group=>groupSelect.add(new Option(group.name,group.id)));
      }catch(error){showMessage(account,"تعذر تحميل مجموعاتك: "+(acadMsg(error)||"حاول تحديث الصفحة."),true);}
    }
    bootstrapButton.hidden=true; // owner bootstrap stays hidden: admin tools are not offered to learners
    account.textContent=isAdmin?"تم التحقق من صلاحيات مسؤول الأكاديمية.":isInstructor?"تم التحقق من حساب المدرّب المعتمد.":"أهلًا بك في أكاديمية CodeQuest المباشرة.";
    await loadClasses();
  } catch(error) {
    account.textContent="تعذر التحقق من صلاحيات الحساب. حدّث الصفحة بعد قليل.";
  }
});
