import { requireUser, getLessonProgress, getUserProfile } from "./auth.js";

// Lessons open in the interactive studio lesson from the same map. Chapter/lesson indexes match the studio units one to one.
const studioUrl=(lang,c,l)=>`learning.html?from=map&lang=${lang}&unit=${c+1}&index=${l}`;
const CONFIG = {
 python:{name:"Python",description:"من أول أمر طباعة لحد بناء مشروعك الأول.",file:"json/python_curriculum.json",url:(c,l)=>studioUrl('python',c,l),legacyUrl:(c,l)=>`python-lesson.html?ch=${c+1}&lesson=${l+1}`},
 javascript:{name:"JavaScript",description:"اصنع صفحات ويب تفاعلية وتعلّم التفكير البرمجي.",file:"json/js_curriculum.json",url:(c,l)=>studioUrl('javascript',c,l)},
 cpp:{name:"C++",description:"ابنِ أساسًا قويًا في البرمجة والخوارزميات وحل المشكلات.",file:"json/cpp_curriculum.json",url:(c,l)=>studioUrl('cpp',c,l)},
 java:{name:"Java",description:"تعلّم بناء البرامج المنظمة خطوة بخطوة.",file:"json/java_curriculum.json",url:(c,l)=>studioUrl('java',c,l)}
};
const params=new URLSearchParams(location.search);
const language=(params.get("lang")||"python").toLowerCase();
const cfg=CONFIG[language],map=document.getElementById("cwMap");
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const CODY='<span class="cody-character is-waving"><span class="cody-character__antenna"></span><span class="cody-character__head"><span class="cody-character__eye cody-character__eye--left"></span><span class="cody-character__eye cody-character__eye--right"></span><span class="cody-character__mouth"></span></span><span class="cody-character__body"><span class="cody-character__core">✦</span></span><span class="cody-character__arm cody-character__arm--left"></span><span class="cody-character__arm cody-character__arm--right"></span><span class="cody-character__leg cody-character__leg--left"></span><span class="cody-character__leg cody-character__leg--right"></span></span>';
let studioUnits=[],uid=null,curriculumChapters=[],lastRecords=[],lastLocal=[],courseStats={completed:0,total:0,percent:0,firstIndex:0};

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
  // A passed lesson test is an existing, assessed, per-account record: it also marks its map node, so lessons finished before map recording was fixed do not need repeating.
  if(uid){const pre="codequest_studio_lessontest_"+uid+"_"+language+"_";
   for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||!k.startsWith(pre))continue;
    let rec=null;try{rec=JSON.parse(localStorage.getItem(k)||"null")}catch{}
    if(rec?.passed!==true)continue;const id=k.slice(pre.length);
    const pack=studioUnits.find(x=>x.language===language&&x.lessons.some(l=>l.id===id));
    if(pack)list.push({id:"lesson-test-"+id,chapter:pack.unit-1,lesson:pack.lessons.findIndex(l=>l.id===id),completed:true,source:"lesson-test-pass"});}}
  return list;
 }catch{return []}
}
// A lesson whose chat is finished but whose test is not passed yet: the map shows it honestly and links straight to the test.
function pendingTest(){
 try{const p=JSON.parse(localStorage.getItem("cq_lt_pending")||"null");
  if(p&&uid&&p.uid===uid&&p.language===language&&typeof p.lessonId==="string"&&Number.isSafeInteger(p.unit)&&Number.isSafeInteger(p.index))return p}catch{}
 return null;
}
function celebration(){
 try{const c=JSON.parse(localStorage.getItem("cq_map_celebrate")||"null");
  if(c&&uid&&c.uid===uid&&c.language===language&&Date.now()-Number(c.at)<10*60*1000)return c}catch{}
 return null;
}
// The unit exam is the map node after the studio lessons of a unit (Python: lesson 5 of each chapter). It opens the unit exam page and is done when that exam is passed (or a record exists).
function examIndex(ci){
 const pack=studioUnits.find(x=>x.language===language&&x.unit===ci+1),n=pack?.lessons?.length||0,last=(curriculumChapters[ci]?.lessons||[]).length;
 return n&&last===n+1&&/^امتحان|^الامتحان/.test(String(curriculumChapters[ci].lessons[n]?.title||""))?n:-1;
}
// Per account on this device: a different signed-in learner, or nobody, never inherits a pass.
// Account record (only when server assessment is ON and the Worker answered for THIS account): lets a pass made on another device show here.
// Unknown (Worker down, not signed in, token for a different account, flag OFF) adds nothing and never removes a device pass.
let serverPasses={uid:null,units:new Set()};
async function loadServerPasses(){
 if(!finalLinkOn||!uid)return false;const owner=uid;
 try{
  const {auth}=await import('/js/firebase-config.js');if(auth.currentUser?.uid!==owner)return false;
  const {ENDPOINT,ownerBound}=await import('/learning-studio/progress-api.mjs');
  const token=await ownerBound(owner,async force=>auth.currentUser?.uid===owner?auth.currentUser.getIdToken(force===true):null)(false);if(!token||auth.currentUser?.uid!==owner)return false;
  const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),6000);
  const res=await fetch(ENDPOINT+'/api/progress/get',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:'{}',signal:ctl.signal,cache:'no-store'}).finally(()=>clearTimeout(to));
  if(!res.ok)return false;const d=await res.json();if(!d||d.success!==true||!d.exams||typeof d.exams!=='object')return false;
  if(uid!==owner)return false;
  const units=new Set();for(const [k,v] of Object.entries(d.exams)){const m=k.match(/^(.+)-(\d+)$/);if(m&&m[1]===language&&v&&v.passed===true)units.add(Number(m[2]))}
  serverPasses={uid:owner,units};return true;
 }catch{return false}
}
function unitExamPassed(ci){if(!uid)return false;if(serverPasses.uid===uid&&serverPasses.units.has(ci+1))return true;try{return JSON.parse(localStorage.getItem("codequest_studio_quiz_"+uid+"_"+language+"_"+(ci+1))||"null")?.passed===true}catch{return false}}
function lessonRecordDone(item,ci,li,records,local){
 const id=String(item.id||""),pythonKey=(ci+1)+"_"+li;
 const match=x=>x?.completed===true&&(
  (Number.isInteger(Number(x.chapter))&&Number.isInteger(Number(x.lesson))&&Number(x.chapter)===ci&&Number(x.lesson)===li)||
  (id!==""&&String(x.lessonId||x.id||"")===id)||String(x.id||"")===pythonKey
 );
 return records.some(match)||local.some(match);
}
// The unit exam node is done only when its unit's lessons are done too: a stored exam pass on this device (for example from opening the exam page directly) never marks the exam done on the map while lessons are still locked.
function isDone(item,ci,li,records,local){
 const ex=examIndex(ci);
 if(ex>0&&li===ex){
  const lessons=curriculumChapters[ci]?.lessons||[];
  if(!unitExamPassed(ci))return lessonRecordDone(item,ci,li,records,local)&&lessons.slice(0,ex).every((l,i)=>lessonRecordDone(l,ci,i,records,local));
  return lessons.slice(0,ex).every((l,i)=>lessonRecordDone(l,ci,i,records,local));
 }
 return lessonRecordDone(item,ci,li,records,local);
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
// Unit projects (learning-studio/projects.json). The link shows only after every lesson of the unit is done.
const UNIT_PROJECTS={python:{4:"py-p1",8:"py-p2",12:"py-p3"}};
function render(chapters,records,local){
 const flat=[];
 chapters.forEach((chapter,ci)=>(chapter.lessons||[]).forEach((lesson,li)=>flat.push({chapter,lesson,ci,li,done:isDone(lesson,ci,li,records,local)})));
 let first=flat.findIndex(item=>!item.done);if(first<0)first=flat.length;
 // The next unit opens only after the previous unit exam is passed (50 percent or more).
 let examGate=0;
 if(first<flat.length&&flat[first].ci>0&&flat[first].li===0){
  const prev=flat[first].ci;let passed=false;
  passed=unitExamPassed(prev-1)
  if(!passed)examGate=prev;
 }
 const completed=flat.filter(item=>item.done).length,total=flat.length,percent=total?Math.round(completed/total*100):0;
 courseStats={completed,total,percent,firstIndex:first};
 document.getElementById("cwTitle").textContent="رحلة "+cfg.name;
 document.getElementById("cwDescription").textContent=cfg.description;
 document.getElementById("cwProgressText").textContent=percent+"% مكتمل";
 document.getElementById("cwLessonCount").textContent=completed+" من "+total+" محطة";
 document.getElementById("cwProgressBar").style.width=percent+"%";
 {const old=document.getElementById("cwExamGate");if(old)old.remove();
  // After the last lesson: link the last unit exam, then (Python only) the final exam. Local flags only choose which link to show; the Worker decides access.
  let endLink=null;
  if(!examGate&&flat.length&&first===flat.length){
   const last=chapters.length;let lastPassed=false;
   lastPassed=unitExamPassed(last-1)
   if(!lastPassed)endLink={href:"/learning-studio/quiz.html?lang="+encodeURIComponent(language)+"&unit="+last,text:"اختبار الوحدة "+last+": انجح فيه (٥٠٪ أو أكثر) علشان تكمل المسار"};
   else if(language==="python"&&finalLinkOn)endLink={href:"/python-exam.html",text:"الامتحان الشامل لبايثون: بيفتح بعد ما تنجح في امتحانات الوحدات كلها"};
  }
  if(endLink){const a=document.createElement("a");a.id="cwExamGate";a.className="cw-exam-gate";a.href=endLink.href;a.textContent=endLink.text;a.style.cssText="display:block;margin:12px auto;max-width:520px;padding:12px 16px;border-radius:12px;background:#674ac1;color:#fff;text-align:center;font-weight:700;text-decoration:none";document.getElementById("cwProgressBar").closest("section,div")?.after(a)}
  if(examGate){const a=document.createElement("a");a.id="cwExamGate";a.className="cw-exam-gate";a.href="/learning-studio/quiz.html?lang="+encodeURIComponent(language)+"&unit="+examGate;a.textContent="اختبار الوحدة "+examGate+": انجح فيه (٥٠٪ أو أكثر) علشان تفتح الوحدة اللي بعدها";a.style.cssText="display:block;margin:12px auto;max-width:520px;padding:12px 16px;border-radius:12px;background:#674ac1;color:#fff;text-align:center;font-weight:700;text-decoration:none";document.getElementById("cwProgressBar").closest("section,div")?.after(a)}}
 const units=chapters.map((chapter,ci)=>{
  const lessons=chapter.lessons||[],unitDone=lessons.filter((lesson,li)=>isDone(lesson,ci,li,records,local)).length;
  const height=Math.max(285,205+(lessons.length-1)*145+85);
  const points=lessons.map((lesson,li)=>({x:nodeX(li),y:120+li*145}));
  const path=makeRoadPath(points),completedCount=unitDone;
  const progressPath=completedCount?makeRoadPath(points.slice(0,Math.min(completedCount,points.length))):"";
  const nodes=lessons.map((lesson,li)=>{
   const globalIndex=flat.findIndex(item=>item.ci===ci&&item.li===li),done=isDone(lesson,ci,li,records,local);
   const current=!done&&globalIndex===first&&!examGate,locked=!done&&!current;
   const icon=done?"ri-check-line":locked?"ri-lock-2-line":"ri-play-fill";
   const pt=pendingTest(),needsTest=current&&pt&&pt.lessonId===lesson.id&&pt.unit===ci+1&&pt.index===li;
   const title=lesson.title||("الدرس "+(li+1)),href=needsTest?"/learning-studio/lesson-test.html?lang="+encodeURIComponent(language)+"&lesson="+encodeURIComponent(lesson.id):li===examIndex(ci)?"/learning-studio/quiz.html?lang="+encodeURIComponent(language)+"&unit="+(ci+1):cfg.url(ci,li,lesson.id),{x,y}=points[li];
   return `<div data-ci="${ci}" data-li="${li}" class="cw-road-node ${current?"is-current":done?"is-done":"is-locked"}${needsTest?" needs-test":""}" data-lesson-index="${globalIndex}" style="left:${x}%;top:${y}px">${current?'<div class="cw-cody cw-cody--node">'+CODY+'</div>':""}<button class="cw-node ${done?"is-done":current?"is-current":""}" type="button" ${locked?'disabled aria-label="درس مقفول"':'data-href="'+escapeHTML(href)+'" aria-label="'+escapeHTML(title)+'"'}><i class="${icon}"></i></button><span class="cw-node-label">${escapeHTML(title)}</span><span class="cw-node-sub">${done?"مكتمل":needsTest?"خلصت الدرس، فاضل الاختبار":current?"ابدأ هنا":"افتح بعد السابق"}</span></div>`;
  }).join("");
  const unitPercent=lessons.length?Math.round(unitDone/lessons.length*100):0;
  const projectId=UNIT_PROJECTS[language]?.[ci+1],projectLink=projectsOn&&unitPercent===100&&projectId?`<a class="cw-project-link" id="cwProject${ci+1}" href="/learning-studio/project.html?project=${projectId}" style="display:inline-block;margin-top:8px;padding:8px 14px;border-radius:10px;background:#674ac1;color:#fff;font-weight:700;text-decoration:none">مشروع الوحدة: ابنِ بنفسك</a>`:"";
  const exIdx=examIndex(ci),lessonsOnlyDone=lessons.every((lesson,li)=>(exIdx>0&&li===exIdx)||isDone(lesson,ci,li,records,local)),footState=(unitPercent===100&&unitExamPassed(ci))||(unitPercent===100&&language==="python"&&exIdx>0)?2:lessonsOnlyDone?1:0;
  return `<section class="cw-unit ${unitPercent===100?"is-complete":""}"><header class="cw-unit-head"><span class="cw-unit-number">${ci+1}</span><div class="cw-unit-title"><h3>${escapeHTML(chapter.title||("الوحدة "+(ci+1)))}</h3><p>${examIndex(ci)>0?examIndex(ci)+" دروس + امتحان الوحدة":lessons.length+" دروس"} · ${unitDone} مكتمل</p><div class="cw-unit-progress"><span style="width:${unitPercent}%"></span></div>${projectLink}</div><span class="cw-unit-status">${unitPercent===100?"✓ مكتملة":unitDone+" من "+lessons.length}</span></header><div class="cw-road" style="height:${height}px"><svg class="cw-road-svg" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"></path><path class="cw-road-glow" d="${progressPath}"></path></svg>${nodes}</div><div class="cw-unit-foot"><strong><i class="${footState===2?"ri-trophy-line":"ri-flag-2-line"}"></i> ${footState===2?"أنهيت الوحدة بنجاح!":footState===1?"باقي امتحان الوحدة":"محطة نهاية الوحدة"}</strong><span>${footState===2?"أحسنت! كل دروس الوحدة اكتملت. كودي فخور بيك.":footState===1?"الدروس خلصت. انجح في امتحان الوحدة (٥٠٪ أو أكتر) عشان تفتح الوحدة التالية.":"أكمل الدروس بالترتيب عشان تفتح الوحدة التالية."}</span></div></section>`;
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
  const waiting=map.querySelector(".cw-road-node.needs-test");
  if(waiting)setCody("thinking","خلصتي الدرس! فاضل اختبار قصير ونعدّي للدرس اللي بعده. دوسي على المحطة المضيئة.");
  playCelebration();
 }
}
// Shown once, only after a lesson test pass recorded for this account in the last 10 minutes.
function playCelebration(){
 const c=celebration();if(!c||!map)return;
 try{localStorage.removeItem("cq_map_celebrate")}catch{}
 const doneNode=[...map.querySelectorAll(".cw-road-node.is-done")].find(n=>{return Number(n.dataset.ci)===c.unit-1&&Number(n.dataset.li)===c.index});
 if(!doneNode)return;
 const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 doneNode.classList.add("just-done");
 const next=map.querySelector(".cw-road-node.is-current");
 const burst=document.createElement("div");burst.className="cw-burst";burst.setAttribute("aria-hidden","true");
 for(let i=0;i<14;i++){const s=document.createElement("i");s.style.setProperty("--a",(i*360/14)+"deg");s.style.setProperty("--d",(46+(i%3)*14)+"px");burst.append(s)}
 doneNode.append(burst);
 let lockFx=null;
 if(next&&next!==doneNode){
  next.classList.add("cody-arrives");
  const btn=next.querySelector(".cw-node");
  if(!reduce&&btn){
   next.classList.add("unlocking");
   // The next station was locked a moment ago: a lock shakes, opens and fades, then Cody travels from the finished station to it.
   lockFx=document.createElement("span");lockFx.className="cw-lock-fx";lockFx.setAttribute("aria-hidden","true");lockFx.innerHTML='<i class="ri-lock-2-line"></i><i class="ri-lock-unlock-line"></i>';btn.append(lockFx);
   const cody=next.querySelector(".cw-cody--node");
   const from=doneNode.querySelector(".cw-node"),a=from.getBoundingClientRect(),b=btn.getBoundingClientRect();
   const dx=a.left-b.left,dy=a.top-b.top;
   if(cody&&cody.animate)cody.animate([{transform:`translate(${dx}px,${dy}px) translateX(50%) scale(.56)`,offset:0},{transform:`translate(${dx*.45}px,${dy*.45-46}px) translateX(50%) scale(.56)`,offset:.45},{transform:"translateX(50%) scale(.56)",offset:1}],{duration:1500,delay:1100,easing:"cubic-bezier(.4,0,.2,1)",fill:"both"});
  }
 }
 setCody("happy","عاشت! الدرس اتحسب والقفل اتفتح. أنا جاي معاكي للمحطة اللي بعدها!");
 setTimeout(()=>{burst.remove();lockFx?.remove();doneNode.classList.remove("just-done");next?.classList.remove("cody-arrives","unlocking")},reduce?300:3200);
 scrollToCurrent();
}
async function refreshProgress(){
 if(!cfg||!uid)return;
 try{let records=[];try{records=await getLessonProgress(language)}catch(error){console.warn(error)}
 lastRecords=records;lastLocal=getLocalDone();render(curriculumChapters,lastRecords,lastLocal);
 }catch(error){console.error("Could not refresh course progress",error)}
}
// The Python final link shows only when server assessment is ON: with it OFF the exam page still uses its legacy chapter-record gate, which Studio progress does not satisfy.
let finalLinkOn=false,projectsOn=false;
async function init(){
 try{const ft=await fetch('/learning-studio/features.json',{cache:'no-store'}).then(r=>r.json());finalLinkOn=ft.serverAssessment===true;projectsOn=ft.unitProjects===true}catch{finalLinkOn=false;projectsOn=false}
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

  // Display titles follow the lesson that actually opens. Layout, ids and legacy progress identity stay untouched.
  try{
   const studio=await (await fetch("learning-studio/units.json",{cache:"no-store"})).json();studioUnits=Array.isArray(studio)?studio:[];
   curriculumChapters.forEach((chapter,ci)=>{
    const pack=studio.find(x=>x.language===language&&x.unit===ci+1);if(!pack)return;
    const prefix=String(chapter.title||"").split(":")[0];chapter.title=prefix&&prefix!==chapter.title?prefix+": "+pack.title:pack.title;
    pack.lessons.forEach((entry,li)=>{if(chapter.lessons[li])chapter.lessons[li].title=entry.title;else chapter.lessons.push({id:entry.id,title:entry.title})});
   });
  }catch(error){console.warn("Studio titles unavailable; keeping map titles",error)}

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
  loadServerPasses().then(ok=>{if(ok){lastLocal=getLocalDone();render(curriculumChapters,lastRecords,lastLocal)}});
  try{const profile=await getUserProfile();document.getElementById("cwXp").textContent=String(profile?.xp??0);document.getElementById("cwStars").textContent=String(profile?.stars??0)}
  catch{document.getElementById("cwXp").textContent="—";document.getElementById("cwStars").textContent="—"}
  showWelcome();
 }catch(error){console.error("Course path initialization failed:",error);const reason=error?.message||"خطأ غير معروف";if(map)map.innerHTML='<div class="cw-empty"><strong>مقدرتش أحمل خريطة المسار.</strong><p>حدّث الصفحة أو ارجع للمسارات وحاول تاني.</p><small>'+escapeHTML(reason)+'</small></div>';setCody("thinking","واجهت مشكلة أثناء تجهيز الرحلة. جرّب تحديث الصفحة، ولو استمرت المشكلة ابعت رسالة الخطأ الظاهرة.")}
}
window.addEventListener("codequest:lesson-completed",refreshProgress);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshProgress()});
init();
