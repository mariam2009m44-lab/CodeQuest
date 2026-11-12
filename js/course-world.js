import { requireUser, getLessonProgress, getUserProfile } from "./auth.js";

const CONFIG = {
 python:{name:"Python",description:"من أول أمر طباعة لحد بناء مشروعك الأول.",file:"json/python_curriculum.json",url:(c,l)=>`python-lesson.html?ch=${c+1}&lesson=${l+1}`},
 javascript:{name:"JavaScript",description:"اصنع صفحات ويب تفاعلية وتعلّم التفكير البرمجي.",file:"json/js_curriculum.json",url:(c,l)=>`lecture.html?lang=javascript&chapter=${c}&lesson=${l}`},
 cpp:{name:"C++",description:"ابنِ أساسًا قويًا في البرمجة والخوارزميات وحل المشكلات.",file:"json/cpp_curriculum.json",url:(c,l)=>`lecture.html?lang=cpp&chapter=${c}&lesson=${l}`},
 java:{name:"Java",description:"تعلّم بناء البرامج المنظمة خطوة بخطوة.",file:"json/java_curriculum.json",url:(c,l,id)=>`java-lessons.html?lesson=${encodeURIComponent(id)}`}
};
const params=new URLSearchParams(location.search);
const language=(params.get("lang")||"python").toLowerCase();
const cfg=CONFIG[language],map=document.getElementById("cwMap");
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const CODY='<span class="cody-character is-waving"><span class="cody-character__antenna"></span><span class="cody-character__head"><span class="cody-character__eye cody-character__eye--left"></span><span class="cody-character__eye cody-character__eye--right"></span><span class="cody-character__mouth"></span></span><span class="cody-character__body"><span class="cody-character__core">✦</span></span><span class="cody-character__arm cody-character__arm--left"></span><span class="cody-character__arm cody-character__arm--right"></span><span class="cody-character__leg cody-character__leg--left"></span><span class="cody-character__leg cody-character__leg--right"></span></span>';
let uid=null,curriculumChapters=[],lastRecords=[],lastLocal=[],courseStats={completed:0,total:0,percent:0,firstIndex:0};

function setCody(mood,message){
 const host=document.getElementById("cwCody");if(!host)return;
 host.className="cw-cody cw-cody--"+(mood||"wave");
 const character=CODY.replace("is-waving",mood==="happy"?"is-celebrating":mood==="thinking"?"is-waving":mood==="talk"?"is-waving":"is-waving");
 host.innerHTML=character;
 if(mood==="thinking")host.classList.add("cw-cody--thinking");
 const speech=document.getElementById("cwSpeech");if(speech)speech.textContent=message;
}
function getLocalDone(){
 try{
  const generic=JSON.parse(localStorage.getItem("codequest_lesson_progress_"+uid+"_"+language)||"[]");
  const python=JSON.parse(localStorage.getItem("codequest_"+uid+"_cody_python_completed_lessons")||"[]");
  const java=JSON.parse(localStorage.getItem("cody_java_progress_"+uid)||"{}");
  const javaRecords=Object.entries(java||{}).filter(([,v])=>v?.completed===true).map(([id])=>({id,completed:true}));
  const list=[...(Array.isArray(generic)?generic:[]),...(Array.isArray(python)?python.map(key=>({id:String(key),completed:true})):[]),...javaRecords];
  if(language==="java"&&Array.isArray(java?.completed))list.push(...java.completed.flatMap(chapter=>[{chapter:Number(chapter)-1,lesson:0,completed:true},{chapter:Number(chapter)-1,lesson:1,completed:true}]));
  return list;
 }catch{return []}
}
function isDone(item,ci,li,records,local){
 const id=String(item.id||""),pythonKey=(ci+1)+"_"+li;
 const match=x=>x?.completed===true&&(
  (Number.isInteger(Number(x.chapter))&&Number.isInteger(Number(x.lesson))&&Number(x.chapter)===ci&&Number(x.lesson)===li)||
  String(x.lessonId||x.id||"")===id||String(x.id||"")===pythonKey
 );
 return records.some(match)||local.some(match);
}
function makeRoadPath(points){
 if(!points.length)return "";
 let d=`M ${points[0].x} ${points[0].y}`;
 for(let i=1;i<points.length;i++){const prev=points[i-1],next=points[i],mid=(prev.y+next.y)/2;d+=` C ${prev.x} ${mid}, ${next.x} ${mid}, ${next.x} ${next.y}`;}
 return d;
}
function nodeX(index){return [50,78,67,31,22,50,78,67,31,22][index%10]}
function scrollToCurrent(){
 const target=map?.querySelector(".cw-road-node.is-current")||map?.querySelector(".cw-road-node.is-done:last-of-type");
 target?.scrollIntoView({behavior:"smooth",block:"center",inline:"nearest"});
}
function showWelcome(){
 const overlay=document.getElementById("cwWelcome"),key="cq_cody_intro_"+uid+"_"+language;
 const hasSeenIntro=()=>{
  try{return sessionStorage.getItem(key)==="1"}catch(error){console.warn("تعذر قراءة حالة الترحيب:",error);return false}
 };
 const rememberIntro=()=>{
  try{sessionStorage.setItem(key,"1")}catch(error){console.warn("تعذر حفظ حالة الترحيب:",error)}
 };
 if(!overlay||hasSeenIntro()){scrollToCurrent();return}
 const next=document.getElementById("cwWelcomeNext"),skip=document.getElementById("cwWelcomeSkip"),mascot=document.getElementById("cwWelcomeMascot"),title=document.getElementById("cwWelcomeTitle"),copy=document.getElementById("cwWelcomeText"),dots=overlay.querySelectorAll(".cw-welcome-dots i");
 if(!next||!skip||!mascot||!title||!copy){scrollToCurrent();return}
 const previousFocus=document.activeElement;
 let step=0,busy=false;
 const focusable=()=>[next,skip].filter(button=>!button.disabled&&!button.hidden);
 const handleDialogKeys=event=>{
  if(event.key==="Escape"){event.preventDefault();finish();return}
  if(event.key!=="Tab")return;
  const controls=focusable();
  if(!controls.length){event.preventDefault();return}
  const first=controls[0],last=controls[controls.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 };
 overlay.hidden=false;document.body.classList.add("cw-welcome-open");
 overlay.addEventListener("keydown",handleDialogKeys);
 const finish=()=>{
  if(busy)return;busy=true;rememberIntro();
  mascot.classList.remove("is-waving");mascot.classList.add("is-launching");
  title.textContent="يلا بينا! 🚀";copy.textContent="كودي وصل للمكان اللي هتكمل منه. الطريق قدامك، وكل إنجاز هيفتح لك الخطوة اللي بعدها.";
  next.disabled=true;skip.disabled=true;next.innerHTML="انطلقنا! <i class='ri-rocket-2-line'></i>";
  setTimeout(()=>{overlay.classList.add("is-leaving");setTimeout(()=>{
   overlay.hidden=true;overlay.classList.remove("is-leaving");document.body.classList.remove("cw-welcome-open");
   overlay.removeEventListener("keydown",handleDialogKeys);
   scrollToCurrent();
   const currentButton=map?.querySelector(".cw-road-node.is-current .cw-node");
   if(currentButton)currentButton.focus({preventScroll:true});
   else if(previousFocus&&previousFocus!==document.body&&typeof previousFocus.focus==="function")previousFocus.focus({preventScroll:true});
   setCody("wave","وصلنا لمكانك على الطريق! أنا هفضل جنبك في كل درس. دوس على المحطة المضيئة ونبدأ.");
  },480)},780);
 };
 next.addEventListener("click",()=>{
  if(busy)return;
  if(step===0){step=1;title.textContent="هنمشيها خطوة بخطوة!";copy.textContent="كل دائرة درس، وكل مجموعة دروس وحدة. لما تخلص درس، هتلاقي الطريق بيتقدم وكودي بينط للمحطة الجديدة.";dots.forEach((dot,i)=>dot.classList.toggle("active",i<=1));next.innerHTML="ورّيني الطريق <i class='ri-arrow-left-line'></i>";return}
  finish();
 });
 skip.addEventListener("click",finish);
 next.focus({preventScroll:true});
}
function render(chapters,records,local){
 const flat=[];
 chapters.forEach((chapter,ci)=>(chapter.lessons||[]).forEach((lesson,li)=>flat.push({chapter,lesson,ci,li,done:isDone(lesson,ci,li,records,local)})));
 let first=flat.findIndex(item=>!item.done);if(first<0)first=flat.length;
 const completed=flat.filter(item=>item.done).length,total=flat.length,percent=total?Math.round(completed/total*100):0;
 courseStats={completed,total,percent,firstIndex:first};
 document.getElementById("cwTitle").textContent="رحلة "+cfg.name;
 document.getElementById("cwDescription").textContent=cfg.description;
 document.getElementById("cwProgressText").textContent=percent+"% مكتمل";
 document.getElementById("cwLessonCount").textContent=completed+" من "+total+" درس";
 document.getElementById("cwProgressBar").style.width=percent+"%";
 const units=chapters.map((chapter,ci)=>{
  const lessons=chapter.lessons||[],unitDone=lessons.filter((lesson,li)=>isDone(lesson,ci,li,records,local)).length;
  const height=Math.max(230,150+(lessons.length-1)*145+85);
  const points=lessons.map((lesson,li)=>({x:nodeX(li),y:65+li*145}));
  const path=makeRoadPath(points),completedCount=unitDone;
  const progressPath=completedCount?makeRoadPath(points.slice(0,Math.min(completedCount,points.length))):"";
  const nodes=lessons.map((lesson,li)=>{
   const globalIndex=flat.findIndex(item=>item.ci===ci&&item.li===li),done=isDone(lesson,ci,li,records,local);
   const current=!done&&globalIndex===first,locked=!done&&!current;
   const icon=done?"ri-check-line":locked?"ri-lock-2-line":"ri-play-fill";
   const title=lesson.title||("الدرس "+(li+1)),href=cfg.url(ci,li,lesson.id),{x,y}=points[li];
   return `<div class="cw-road-node ${current?"is-current":done?"is-done":"is-locked"}" data-lesson-index="${globalIndex}" style="left:${x}%;top:${y}px">${current?'<div class="cw-cody cw-cody--node">'+CODY+'</div>':""}<button class="cw-node ${done?"is-done":current?"is-current":""}" type="button" ${locked?'disabled aria-label="درس مقفول"':'data-href="'+escapeHTML(href)+'" aria-label="'+escapeHTML(title)+'"'}><i class="${icon}"></i></button><span class="cw-node-label">${escapeHTML(title)}</span><span class="cw-node-sub">${done?"مكتمل":current?"ابدأ هنا":"افتح بعد السابق"}</span></div>`;
  }).join("");
  const unitPercent=lessons.length?Math.round(unitDone/lessons.length*100):0;
  return `<section class="cw-unit ${unitPercent===100?"is-complete":""}"><header class="cw-unit-head"><span class="cw-unit-number">${ci+1}</span><div class="cw-unit-title"><h3>${escapeHTML(chapter.title||("الوحدة "+(ci+1)))}</h3><p>${lessons.length} دروس · ${unitDone} مكتمل</p><div class="cw-unit-progress"><span style="width:${unitPercent}%"></span></div></div><span class="cw-unit-status">${unitPercent===100?"✓ مكتملة":unitDone+" / "+lessons.length}</span></header><div class="cw-road" style="height:${height}px"><svg class="cw-road-svg" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"></path><path class="cw-road-glow" d="${progressPath}"></path></svg>${nodes}</div><div class="cw-unit-foot"><strong><i class="${unitPercent===100?"ri-trophy-line":"ri-flag-2-line"}"></i> ${unitPercent===100?"أنهيت الوحدة بنجاح!":"محطة نهاية الوحدة"}</strong><span>${unitPercent===100?"أحسنت! كل دروس الوحدة اكتملت. كودي فخور بيك.":"أكمل الدروس بالترتيب عشان تفتح الوحدة التالية."}</span></div></section>`;
 }).join("");
 map.innerHTML=units||'<div class="cw-empty">المنهج لسه مفيهوش دروس متاحة.</div>';
 map.querySelectorAll("[data-href]").forEach(button=>button.addEventListener("click",()=>{
  const mascot=document.querySelector(".cw-cody:not(.cw-cody--node)");mascot?.classList.add("cw-cody--launching");
  setTimeout(()=>location.href=button.dataset.href,360);
 }));
 const jump=document.getElementById("cwJumpCurrent");if(jump){jump.hidden=percent===100;jump.onclick=scrollToCurrent}
 map.querySelectorAll(".cw-road-node.is-done").forEach(node=>node.addEventListener("mouseenter",()=>setCody("happy","عاش! المحطة دي خلصتها بالفعل. كمل رحلتك!")));
 if(percent===100){
  setCody("happy","يا سلام! خلصت المسار كله. أنت وصلت للنهاية!");
  const finish=document.getElementById("cwFinish");
  if(finish){finish.hidden=false;finish.innerHTML=`<div class="cw-finish-card"><div class="cw-finish-confetti">✦ ✧ ★ ✦</div><div class="cw-finish-icon"><i class="ri-trophy-fill"></i></div><span class="cw-kicker">إنجاز يستحق الاحتفال</span><h2>أكملت مسار ${escapeHTML(cfg.name)}!</h2><p>وصلت لنهاية الرحلة. كل درس أنهيته كان خطوة في بناء مهاراتك.</p><div class="cw-finish-stats"><div><strong>${completed}</strong><span>درس مكتمل</span></div><div><strong>${chapters.length}</strong><span>وحدة مكتملة</span></div><div><strong>100%</strong><span>إنجاز المسار</span></div></div><button type="button" id="cwReviewPath"><i class="ri-refresh-line"></i> راجع دروس المسار</button></div>`;document.getElementById("cwReviewPath")?.addEventListener("click",()=>{finish.hidden=true;scrollToCurrent()})}
 }else{
  const finish=document.getElementById("cwFinish");if(finish)finish.hidden=true;
  const currentUnit=flat[first]?.ci??0;
  setCody("wave",`أهلًا بعودتك! أنت خلصت ${completed} من ${total} درس. كمل من الوحدة ${currentUnit+1}، وأنا معاك!`);
 }
}
async function refreshProgress(){
 if(!cfg||!uid)return;
 try{let records=[];try{records=await getLessonProgress(language)}catch(error){console.warn(error)}
 lastRecords=records;lastLocal=getLocalDone();render(curriculumChapters,lastRecords,lastLocal);
 }catch(error){console.error("Could not refresh course progress",error)}
}
async function init(){
 if(!cfg){map.innerHTML='<div class="cw-empty">المسار المطلوب غير موجود. ارجع واختار لغة من المسارات.</div>';return}
 try{
  // Load the curriculum before account data so a temporary authentication
  // or Firestore issue cannot prevent the learning map from being displayed.
  if(language==="python"){
   await Promise.all(Array.from({length:12},(_,index)=>import(`./chapters/ch${index+1}.js`)));
   curriculumChapters=Array.from({length:12},(_,index)=>
    window.CHAPTERS?.[index+1]||{title:"الفصل "+(index+1),lessons:[]}
   );
  }else{
   const response=await fetch(cfg.file,{cache:"no-store"});
   if(!response.ok)throw new Error(`تعذر تحميل المنهج (${response.status}): ${cfg.file}`);
   const curriculum=await response.json();
   curriculumChapters=Array.isArray(curriculum.chapters)?curriculum.chapters:[];
  }

  if(!curriculumChapters.length ||
     curriculumChapters.some(chapter=>!Array.isArray(chapter.lessons)||chapter.lessons.length===0)){
   throw new Error("ملفات المنهج غير مكتملة أو لا تحتوي على دروس.");
  }

  try{
   const user=await requireUser();
   uid=user?.uid||null;
  }catch(error){
   console.warn("Account unavailable; showing the course map without cloud progress:",error);
   uid=null;
  }

  if(uid){
   try{lastRecords=await getLessonProgress(language)}
   catch(error){console.warn("Cloud progress unavailable; using local cache",error)}
  }
  lastLocal=getLocalDone();
  render(curriculumChapters,lastRecords,lastLocal);
  try{const profile=await getUserProfile();document.getElementById("cwXp").textContent=String(profile?.xp??0);document.getElementById("cwStars").textContent=String(profile?.stars??0)}
  catch{document.getElementById("cwXp").textContent="—";document.getElementById("cwStars").textContent="—"}
  showWelcome();
 }catch(error){console.error("Course path initialization failed:",error);const reason=error?.message||"خطأ غير معروف";if(map)map.innerHTML='<div class="cw-empty"><strong>مقدرتش أحمل خريطة المسار.</strong><p>حدّث الصفحة أو ارجع للمسارات وحاول تاني.</p><small>'+escapeHTML(reason)+'</small></div>';setCody("thinking","واجهت مشكلة أثناء تجهيز الرحلة. جرّب تحديث الصفحة، ولو استمرت المشكلة ابعت رسالة الخطأ الظاهرة.")}
}
window.addEventListener("codequest:lesson-completed",refreshProgress);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshProgress()});
init();
