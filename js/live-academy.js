import { auth, functions, authPersistenceReady } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";

const account = document.getElementById("liveAccount");
const list = document.getElementById("classList");
const createPanel = document.getElementById("createPanel");
const createForm = document.getElementById("createClassForm");
const feedback = document.getElementById("createFeedback");
const refreshButton = document.getElementById("refreshClasses");
const listClasses = httpsCallable(functions, "listLiveClasses");
const enrollClass = httpsCallable(functions, "enrollInLiveClass");
const createClass = httpsCallable(functions, "createLiveClass");
const setClassStatus = httpsCallable(functions, "setLiveClassStatus");
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
  count.textContent = "المسجلون: " + item.enrollmentCount;
  meta.append(date,instructor,count);
  const actions = document.createElement("div");
  actions.className = "live-actions";
  if (item.isInstructor) {
    if (item.status === "scheduled") actions.append(makeButton("ابدأ الفصل",async()=>runAction(async()=>{await setClassStatus({classId:item.id,status:"live"});await loadClasses();})));
    if (item.status === "live") {
      actions.append(makeButton("دخول الفصل",()=>location.assign("live-classroom.html?classId="+encodeURIComponent(item.id))));
      actions.append(makeButton("إنهاء الفصل",async()=>runAction(async()=>{await setClassStatus({classId:item.id,status:"ended"});await loadClasses();}),true));
    }
  } else if (item.isEnrolled) {
    if (item.status === "live") actions.append(makeButton("انضم للفصل",()=>location.assign("live-classroom.html?classId="+encodeURIComponent(item.id))));
    else {
      const wait = document.createElement("span"); wait.className="live-pill"; wait.textContent="تم تسجيلك — انتظر بدء الفصل"; actions.append(wait);
    }
  } else if (item.status === "scheduled") {
    actions.append(makeButton("سجّل في الفصل",async()=>runAction(async()=>{await enrollClass({classId:item.id});await loadClasses();})));
  }
  card.append(top,title,description,meta,actions);
  return card;
}
async function runAction(action) {
  try { await action(); }
  catch(error) { showMessage(account,error?.message || "تعذر تنفيذ العملية. حاولي مرة أخرى.",true); }
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
      const empty=document.createElement("div");empty.className="live-empty";empty.textContent="لا توجد فصول متاحة حاليًا. ارجعي لاحقًا للاطلاع على المواعيد الجديدة.";list.append(empty);return;
    }
    classes.forEach(item=>list.append(renderClass(item)));
  } catch(error) {
    list.replaceChildren();
    const empty=document.createElement("div");empty.className="live-empty";empty.textContent="تعذر تحميل الفصول. تأكدي من إعداد خدمة الأكاديمية ثم حاولي مرة أخرى.";list.append(empty);
    showMessage(account,error?.message || "تعذر الاتصال بخدمة الأكاديمية.",true);
  }
}
refreshButton.addEventListener("click",loadClasses);
createForm.addEventListener("submit",async event=>{
  event.preventDefault();
  if(!isInstructor)return;
  const submit=createForm.querySelector('button[type="submit"]');
  submit.disabled=true;showMessage(feedback,"جارٍ إنشاء غرفة الفصل…");
  const form=new FormData(createForm);
  const localDate=String(form.get("startsAt")||"");
  const startsAt=new Date(localDate);
  try {
    if(!Number.isFinite(startsAt.getTime()))throw new Error("اختاري موعدًا صحيحًا.");
    await createClass({
      title:String(form.get("title")||"").trim(),
      description:String(form.get("description")||"").trim(),
      startsAt:startsAt.toISOString(),
      durationMinutes:Number(form.get("durationMinutes")||60)
    });
    createForm.reset();
    showMessage(feedback,"تم إنشاء الفصل وغرفة البث. سيظهر الفصل في القائمة.");
    await loadClasses();
  } catch(error) {
    showMessage(feedback,error?.message || "تعذر إنشاء الفصل.",true);
  } finally {submit.disabled=false;}
});
await authPersistenceReady;
onAuthStateChanged(auth,async user=>{
  currentUser=user;
  if(!user){
    account.textContent="سجّلي الدخول لمشاهدة الفصول والتسجيل فيها.";
    const link=document.createElement("a");link.href="login.html?next=live-academy.html";link.textContent="تسجيل الدخول";link.className="live-pill";account.append(" ",link);
    list.replaceChildren();const empty=document.createElement("div");empty.className="live-empty";empty.textContent="تحتاجين إلى تسجيل الدخول لعرض الفصول.";list.append(empty);return;
  }
  try {
    const token=await user.getIdTokenResult();
    isInstructor=token.claims.liveRole==="instructor"&&token.claims.liveInstructorApproved===true;
    createPanel.hidden=!isInstructor;
    account.textContent=isInstructor?"تم التحقق من حساب المدرّب المعتمد.":"أهلًا بك في أكاديمية CodeQuest المباشرة.";
    await loadClasses();
  } catch(error) {
    account.textContent="تعذر التحقق من صلاحيات الحساب. حدّثي الصفحة بعد قليل.";
  }
});
