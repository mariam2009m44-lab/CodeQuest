import { auth, functions, authPersistenceReady } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";

const state=document.getElementById("communityState");
const teacherTools=document.getElementById("teacherTools");
const instructorDirectory=document.getElementById("instructorDirectory");
const groupDirectory=document.getElementById("groupDirectory");
const myGroupsPanel=document.getElementById("myGroupsPanel");
const myGroups=document.getElementById("myGroups");
const postsPanel=document.getElementById("postsPanel");
const postsNode=document.getElementById("instructorPosts");
const postsTitle=document.getElementById("postsTitle");
const postForm=document.getElementById("postForm");
const groupForm=document.getElementById("groupForm");
const refreshButton=document.getElementById("refreshCommunity");
const calls={
 instructors:httpsCallable(functions,"listApprovedInstructors"),
 groups:httpsCallable(functions,"listPublicTeacherGroups"),
 myGroups:httpsCallable(functions,"listMyTeacherGroups"),
 posts:httpsCallable(functions,"listInstructorPosts"),
 createPost:httpsCallable(functions,"createInstructorPost"),
 createGroup:httpsCallable(functions,"createTeacherGroup"),
 requestJoin:httpsCallable(functions,"requestTeacherGroupMembership"),
 requests:httpsCallable(functions,"listTeacherGroupJoinRequests"),
 reviewMembership:httpsCallable(functions,"reviewTeacherGroupMembership")
};
let currentUser=null;
let isInstructor=false;
function el(tag,cls,text){const item=document.createElement(tag);if(cls)item.className=cls;if(text!==undefined)item.textContent=String(text);return item;}
function setMessage(target,text,error=false){target.textContent=text;target.style.color=error?"#d86b78":"#39b98d";}
function safeLink(value,label){if(typeof value!=="string"||!/^https:\/\//i.test(value))return null;const a=el("a","",label);a.href=value;a.target="_blank";a.rel="noopener noreferrer";return a;}
function tags(values){const wrap=el("div","community-tags");for(const value of values||[])wrap.append(el("span","community-tag",value));return wrap;}
function empty(target,text){target.replaceChildren(el("p","community-empty",text));}
function renderInstructors(items){
 instructorDirectory.replaceChildren();
 if(!items.length){empty(instructorDirectory,"لا يوجد مدرّسون معتمدون منشورون حتى الآن.");return;}
 for(const item of items){
  const card=el("article","community-card");
  card.append(el("h3","",item.displayName||"مدرّس CodeQuest"));
  card.append(el("p","community-meta",(item.experience||"مدرّس معتمد")+(item.qualifications?" · "+item.qualifications:"")));
  card.append(el("p","",item.bio||"لا توجد نبذة متاحة."));
  card.append(tags(item.specialties));
  if(item.teachingStyles?.length)card.append(el("p","community-meta","أسلوب التدريس: "+item.teachingStyles.join("، ")));
  if(item.ageGroups?.length)card.append(el("p","community-meta","الفئات العمرية: "+item.ageGroups.join("، ")));
  if(item.teachingLevels?.length)card.append(el("p","community-meta","المستويات: "+item.teachingLevels.join("، ")));
  const links=el("div","community-links");
  for(const [key,label] of [["portfolioUrl","Portfolio"],["linkedinUrl","LinkedIn"],["introVideoUrl","فيديو تعريفي"],["teachingDemoUrl","عينة شرح"]]){
   const a=safeLink(item[key],label);if(a)links.append(a);
  }
  for(const [i,url] of (item.sampleWorkLinks||[]).entries()){const a=safeLink(url,"عينة عمل "+(i+1));if(a)links.append(a);}
  card.append(links);
  const actions=el("div","community-actions");
  const posts=el("button","","عرض المنشورات");
  posts.type="button";posts.addEventListener("click",()=>loadPosts(item.uid,item.displayName));
  actions.append(posts);card.append(actions);instructorDirectory.append(card);
 }
}
async function loadPosts(uid,name){
 postsPanel.hidden=false;postsTitle.textContent="منشورات "+name;empty(postsNode,"جارٍ تحميل المنشورات…");
 try{
  const response=await calls.posts({instructorUid:uid});const items=response.data?.posts||[];
  if(!items.length){empty(postsNode,"لا توجد منشورات لهذا المدرّس حتى الآن.");return;}
  postsNode.replaceChildren();
  for(const post of items){const card=el("article","community-card");card.append(el("h3","",post.instructorName),el("p","",""+post.text),el("p","community-meta",post.createdAt?new Intl.DateTimeFormat("ar-EG",{dateStyle:"medium",timeStyle:"short"}).format(new Date(post.createdAt)):""));const links=el("div","community-links");for(const [i,url] of (post.links||[]).entries()){const a=safeLink(url,"رابط "+(i+1));if(a)links.append(a);}card.append(links);postsNode.append(card);}
  postsPanel.scrollIntoView({behavior:"smooth",block:"start"});
 }catch(error){empty(postsNode,error.message||"تعذر تحميل المنشورات.");}
}
async function loadGroups(){
 const response=await calls.groups({});const items=response.data?.groups||[];
 groupDirectory.replaceChildren();
 if(!items.length){empty(groupDirectory,"لا توجد مجموعات منشورة حاليًا.");return;}
 for(const group of items){
  const card=el("article","community-card");card.append(el("h3","",group.name),el("p","community-meta","المدرّس: "+group.instructorName+" · الأعضاء: "+group.memberCount),el("p","",""+(group.description||"")),tags([group.topic].filter(Boolean)));
  if(!isInstructor){
   const actions=el("div","community-actions");
   const join=el("button","","طلب الانضمام");join.type="button";
   join.addEventListener("click",async()=>{join.disabled=true;try{await calls.requestJoin({groupId:group.id});join.textContent="تم إرسال الطلب";}catch(error){join.disabled=false;join.textContent="طلب الانضمام";setMessage(state,error.message||"تعذر إرسال الطلب.",true);}});
   actions.append(join);card.append(actions);
  }
  groupDirectory.append(card);
 }
}
async function loadMyGroups(){
 const response=await calls.myGroups({});const data=response.data||{};myGroupsPanel.hidden=false;myGroups.replaceChildren();
 const groups=data.groups||[];
 if(!groups.length){empty(myGroups,"لم تنضم إلى مجموعات بعد.");return;}
 for(const group of groups){
  const card=el("article","community-card");card.append(el("h3","",group.name),el("p","",""+(group.description||"")),el("p","community-meta",group.instructorName||""));
  if(data.role==="instructor"){
   card.append(el("p","community-meta","طلبات الانضمام المعلقة: "+(group.pendingRequests||0)));
   const requestWrap=el("div","");
   const button=el("button","community-manage-button","عرض طلبات الانضمام");button.type="button";
   button.addEventListener("click",async()=>{
    button.disabled=true;requestWrap.replaceChildren(el("p","community-meta","جارٍ تحميل الطلبات…"));
    try{
     const result=await calls.requests({groupId:group.id});requestWrap.replaceChildren();
     const requests=result.data?.requests||[];
     if(!requests.length)requestWrap.append(el("p","community-meta","لا توجد طلبات معلقة."));
     for(const request of requests){
      const row=el("div","community-request");
      row.append(el("strong","",request.displayName),el("p","community-meta",(request.ageBand||"")+(request.skillLevel?" · "+request.skillLevel:"")),el("p","community-meta","الاهتمامات: "+(request.interests||[]).join("، ")));
      const actions=el("div","community-actions");
      for(const [label,decision] of [["قبول","approve"],["رفض","reject"]]){
       const action=el("button","",label);action.type="button";
       action.addEventListener("click",async()=>{action.disabled=true;try{await calls.reviewMembership({groupId:group.id,studentUid:request.uid,decision});row.remove();}catch(error){action.disabled=false;setMessage(state,error.message||"تعذر تحديث الطلب.",true);}});
       actions.append(action);
      }
      row.append(actions);requestWrap.append(row);
     }
    }catch(error){requestWrap.replaceChildren(el("p","community-meta",error.message||"تعذر تحميل الطلبات."));}
    finally{button.disabled=false;}
   });
   card.append(button,requestWrap);
  }
  myGroups.append(card);
 }
}
async function loadAll(){
 refreshButton.disabled=true;setMessage(state,"جارٍ تحميل بيانات المجتمع من Firebase…");
 try{
  const [instructors]=await Promise.all([calls.instructors({})]);
  renderInstructors(instructors.data?.instructors||[]);
  await loadGroups();
  await loadMyGroups();
  setMessage(state,"تم تحميل بيانات المدرّسين والمجموعات من قاعدة البيانات.");
 }catch(error){setMessage(state,error.message||"تعذر تحميل المجتمع. تأكد من نشر وظائف Firebase.",true);}
 finally{refreshButton.disabled=false;}
}
postForm.addEventListener("submit",async event=>{
 event.preventDefault();if(!isInstructor)return;
 const button=postForm.querySelector('button[type="submit"]');button.disabled=true;
 try{
  const links=postForm.elements.links.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  await calls.createPost({text:postForm.elements.text.value.trim(),links});
  postForm.reset();setMessage(document.getElementById("postFeedback"),"تم نشر التحديث وحفظه في قاعدة البيانات.");
 }catch(error){setMessage(document.getElementById("postFeedback"),error.message||"تعذر نشر التحديث.",true);}
 finally{button.disabled=false;}
});
groupForm.addEventListener("submit",async event=>{
 event.preventDefault();if(!isInstructor)return;
 const button=groupForm.querySelector('button[type="submit"]');button.disabled=true;
 try{
  await calls.createGroup({name:groupForm.elements.name.value.trim(),topic:groupForm.elements.topic.value.trim(),description:groupForm.elements.description.value.trim()});
  groupForm.reset();setMessage(document.getElementById("groupFeedback"),"تم إنشاء المجموعة وحفظها. ستظهر في دليل المجموعات.");
  await loadGroups();await loadMyGroups();
 }catch(error){setMessage(document.getElementById("groupFeedback"),error.message||"تعذر إنشاء المجموعة.",true);}
 finally{button.disabled=false;}
});
document.getElementById("closePosts").addEventListener("click",()=>{postsPanel.hidden=true;});
refreshButton.addEventListener("click",loadAll);
await authPersistenceReady;
onAuthStateChanged(auth,async user=>{
 currentUser=user;
 if(!user){setMessage(state,"سجّل الدخول بحساب CodeQuest لعرض المجتمع.");const link=el("a","","تسجيل الدخول");link.href="login.html?next=academy-community.html";state.append(" ",link);return;}
 try{
  const token=await user.getIdTokenResult();isInstructor=token.claims.liveRole==="instructor"&&token.claims.liveInstructorApproved===true;
  teacherTools.hidden=!isInstructor;
  setMessage(state,isInstructor?"تم التحقق من اعتماد المدرّس. يمكنك إدارة منشوراتك ومجموعاتك.":"تم تسجيل الدخول. يمكنك استكشاف المدرّسين والمجموعات وإرسال طلبات الانضمام.");
  await loadAll();
 }catch(error){setMessage(state,error.message||"تعذر التحقق من الحساب.",true);}
});