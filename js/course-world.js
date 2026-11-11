import { requireUser, getLessonProgress, getUserProfile } from "./auth.js";

const CONFIG = {
 python:{name:"Python",description:"من أول أمر طباعة لحد بناء مشروعك الأول.",file:"json/python_curriculum.json",url:(c,l)=>`python-lesson.html?ch=${c+1}&lesson=${l+1}`},
 javascript:{name:"JavaScript",description:"اصنع صفحات ويب تفاعلية وتعلّم التفكير البرمجي.",file:"json/js_curriculum.json",url:(c,l)=>`lecture.html?lang=javascript&chapter=${c}&lesson=${l}`},
 cpp:{name:"C++",description:"ابنِ أساسًا قويًا في البرمجة والخوارزميات وحل المشكلات.",file:"json/cpp_curriculum.json",url:(c,l)=>`lecture.html?lang=cpp&chapter=${c}&lesson=${l}`},
 java:{name:"Java",description:"تعلّم بناء البرامج المنظمة خطوة بخطوة.",file:"json/java_curriculum.json",url:(c,l,id)=>`java-lessons.html?lesson=${encodeURIComponent(id)}`}
};
const params=new URLSearchParams(location.search);
const language=(params.get("lang")||"python").toLowerCase();
const cfg=CONFIG[language];
const map=document.getElementById("cwMap");
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const CODY='<span class="cody-character is-waving"><span class="cody-character__antenna"></span><span class="cody-character__head"><span class="cody-character__eye cody-character__eye--left"></span><span class="cody-character__eye cody-character__eye--right"></span><span class="cody-character__mouth"></span></span><span class="cody-character__body"><span class="cody-character__core">✦</span></span><span class="cody-character__arm cody-character__arm--left"></span><span class="cody-character__arm cody-character__arm--right"></span><span class="cody-character__leg cody-character__leg--left"></span><span class="cody-character__leg cody-character__leg--right"></span></span>';
let uid=null;
function setCody(mood,message){
 const host=document.getElementById("cwCody");if(!host)return;
 host.className="cw-cody cw-cody--"+(mood||"wave");
 host.innerHTML=CODY.replace("is-waving",mood==="happy"?"is-happy":mood==="thinking"?"is-waving":"is-waving");
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
function keyOf(x){return x?.chapter+":"+x?.lesson}
function isDone(item,ci,li,records,local){
 const id=String(item.id||"");
 const pythonKey=(ci+1)+"_"+li;
 const match=x=>x?.completed===true&&(keyOf(x)===ci+":"+li||String(x.lessonId||x.id||"")===id||String(x.id||"")===pythonKey);
 return records.some(match)||local.some(match);
}
function makeRoadPath(points){
 if(!points.length)return "";
 let d=`M ${points[0].x} ${points[0].y}`;
 for(let i=1;i<points.length;i++){
  const prev=points[i-1],next=points[i],mid=(prev.y+next.y)/2;
  d+=` C ${prev.x} ${mid}, ${next.x} ${mid}, ${next.x} ${next.y}`;
 }
 return d;
}
function nodeX(index,total){
 const pattern=[50,78,67,31,22,50,78,67,31,22];
 return pattern[index%pattern.length];
}
function render(chapters,records,local){
 const flat=[];
 chapters.forEach((chapter,ci)=>(chapter.lessons||[]).forEach((lesson,li)=>flat.push({chapter,lesson,ci,li,done:isDone(lesson,ci,li,records,local)})));
 let first=flat.findIndex(item=>!item.done);if(first<0)first=flat.length;
 const completed=flat.filter(item=>item.done).length;
 const percent=flat.length?Math.round(completed/flat.length*100):0;
 document.getElementById("cwTitle").textContent="رحلة "+cfg.name;
 document.getElementById("cwDescription").textContent=cfg.description;
 document.getElementById("cwProgressText").textContent=percent+"% مكتمل";
 document.getElementById("cwLessonCount").textContent=completed+" من "+flat.length+" درس";
 document.getElementById("cwProgressBar").style.width=percent+"%";
 const units=chapters.map((chapter,ci)=>{
  const lessons=chapter.lessons||[];
  const unitDone=lessons.filter((lesson,li)=>isDone(lesson,ci,li,records,local)).length;
  const height=Math.max(230,150+(lessons.length-1)*145+85);
  const points=lessons.map((lesson,li)=>({x:nodeX(li,lessons.length),y:65+li*145}));
  const path=makeRoadPath(points);
  const completedCount=lessons.reduce((n,lesson,li)=>n+(isDone(lesson,ci,li,records,local)?1:0),0);
  const progressPath=completedCount>0?makeRoadPath(points.slice(0,Math.min(completedCount,points.length))):"";
  const nodes=lessons.map((lesson,li)=>{
   const globalIndex=flat.findIndex(item=>item.ci===ci&&item.li===li);
   const done=isDone(lesson,ci,li,records,local);
   const current=!done&&globalIndex===first;
   const locked=!done&&!current;
   const icon=done?"ri-check-line":locked?"ri-lock-2-line":"ri-play-fill";
   const title=lesson.title||("الدرس "+(li+1));
   const href=cfg.url(ci,li,lesson.id);
   const x=points[li].x,y=points[li].y;
   return `<div class="cw-road-node ${current?"is-current":done?"is-done": "is-locked"}" style="left:${x}%;top:${y}px">${current?'<div class="cw-cody cw-cody--node">'+CODY+'</div>':""}<button class="cw-node ${done?"is-done":current?"is-current":""}" type="button" ${locked?'disabled aria-label="درس مقفول"': 'data-href="'+escapeHTML(href)+'" aria-label="'+escapeHTML(title)+'"'}><i class="${icon}"></i></button><span class="cw-node-label">${escapeHTML(title)}</span><span class="cw-node-sub">${done?"مكتمل":current?"ابدأ هنا":"افتح بعد السابق"}</span></div>`;
  }).join("");
  return `<section class="cw-unit"><header class="cw-unit-head"><span class="cw-unit-number">${ci+1}</span><div><h3>${escapeHTML(chapter.title||("الوحدة "+(ci+1)))}</h3><p>${lessons.length} دروس · ${unitDone} مكتمل</p></div><span class="cw-unit-status">${unitDone===lessons.length?"✓ مكتملة":unitDone+" / "+lessons.length}</span></header><div class="cw-road" style="height:${height}px"><svg class="cw-road-svg" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"></path><path class="cw-road-glow" d="${progressPath}"></path></svg>${nodes}</div><div class="cw-unit-foot"><strong><i class="ri-flag-2-line"></i> ${unitDone===lessons.length?"أنهيت هذه الوحدة!":"نهاية الوحدة"}</strong><span>${unitDone===lessons.length?"أحسنت! تقدّم إلى الوحدة التالية.":"أكمل دروس الوحدة بالترتيب للوصول إلى المحطة التالية."}</span></div></section>`;
 }).join("");
 map.innerHTML=units||'<div class="cw-empty">المنهج لسه مفيهوش دروس متاحة.</div>';
 map.querySelectorAll("[data-href]").forEach(button=>button.addEventListener("click",()=>location.href=button.dataset.href));
 map.querySelectorAll(".cw-road-node.is-current").forEach(()=>setCody("wave","أنا كودي! وصلت للمحطة اللي عليك دلوقتي. اضغط على الدائرة ونبدأ الدرس سوا."));
 map.querySelectorAll(".cw-road-node.is-done").forEach(node=>node.addEventListener("mouseenter",()=>setCody("happy","عاش! المحطة دي خلصتها بالفعل. كمل رحلتك!")));
 if(percent===100)setCody("happy","يا سلام! خلصت المسار كله. فخور بتقدمك!");
 else if(!map.querySelector(".cw-road-node.is-current"))setCody("thinking","مش لاقي درس حالي. راجع حفظ تقدمك أو حدّث الخريطة.");
}
async function init(){
 if(!cfg){map.innerHTML='<div class="cw-empty">المسار المطلوب غير موجود. ارجع واختار لغة من المسارات.</div>';return}
 try{
  const user=await requireUser();uid=user.uid;
  const response=await fetch(cfg.file,{cache:"no-store"});if(!response.ok)throw new Error("تعذر تحميل المنهج");
  const curriculum=await response.json();const chapters=curriculum.chapters||[];
  let records=[];try{records=await getLessonProgress(language)}catch(error){console.warn("Cloud progress unavailable; using local cache",error)}
  const local=getLocalDone();render(chapters,records,local);
  try{const profile=await getUserProfile();document.getElementById("cwXp").textContent=String(profile?.xp??0);document.getElementById("cwStars").textContent=String(profile?.stars??0)}
  catch{document.getElementById("cwXp").textContent="—";document.getElementById("cwStars").textContent="—"}
 }catch(error){console.error(error);map.innerHTML='<div class="cw-empty">مقدرتش أحمل خريطة المسار. حدّث الصفحة أو ارجع للمسارات وحاول تاني.</div>';setCody("thinking","فيه مشكلة بسيطة في تحميل الرحلة. جرّب تحدّث الصفحة.");}
}
init();
