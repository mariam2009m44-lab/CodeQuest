import { requireUser, getLessonProgress, getUserProfile } from "./auth.js";

const CONFIG = {
 python:{name:"Python",description:"من أول أمر طباعة لحد بناء مشروعك الأول.",file:"json/python_curriculum.json",url:(c,l)=>`python-lesson.html?ch=${c+1}&lesson=${l+1}`,color:"python"},
 javascript:{name:"JavaScript",description:"اصنع صفحات ويب تفاعلية وتعلّم التفكير البرمجي.",file:"json/js_curriculum.json",url:(c,l)=>`lecture.html?lang=javascript&chapter=${c}&lesson=${l}`,color:"javascript"},
 cpp:{name:"C++",description:"ابنِ أساسًا قويًا في البرمجة والخوارزميات وحل المشكلات.",file:"json/cpp_curriculum.json",url:(c,l)=>`lecture.html?lang=cpp&chapter=${c}&lesson=${l}`,color:"cpp"},
 java:{name:"Java",description:"تعلّم بناء البرامج المنظمة خطوة بخطوة.",color:"java",chapters:[
  ["الطباعة","أول برنامج Java","تنسيق المخرجات"],["المتغيرات","إنشاء المتغيرات","تحديث القيم"],["العمليات الحسابية","العمليات الأساسية","أولوية العمليات"],["الشروط","if و else","المقارنات"],["الحلقات","حلقة for","حلقة while"],["المصفوفات","إنشاء المصفوفات","الوصول إلى العناصر"],["الدوال","إنشاء الدوال","المعاملات والقيم المرجعة"],["النصوص","التعامل مع String","عمليات النصوص"]
 ],url:(c,l)=>`java-lessons.html?lesson=java-${c+1}-${l+1}`}
};
const p=new URLSearchParams(location.search);const language=(p.get("lang")||"python").toLowerCase();const cfg=CONFIG[language];const map=document.getElementById("cwMap");
const safe=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const codyMarkup='<div class="cody-3d-scene cody-3d--wave" aria-hidden="true"><div class="cody-3d-shadow"></div><div class="cody-3d"><div class="cody-3d-antenna"><i></i></div><div class="cody-3d-head"><i class="cody-3d-ear left"></i><i class="cody-3d-ear right"></i><i class="cody-3d-eye left"></i><i class="cody-3d-eye right"></i><i class="cody-3d-mouth"></i><i class="cody-3d-cheek left"></i><i class="cody-3d-cheek right"></i></div><div class="cody-3d-neck"></div><div class="cody-3d-body"><i class="cody-3d-core">✦</i></div><div class="cody-3d-arm left"></div><div class="cody-3d-arm right"></div><div class="cody-3d-leg left"></div><div class="cody-3d-leg right"></div></div></div>';
function setCody(mood,message){const c=document.getElementById("cwCody");c.className="cody-3d-scene cody-3d--"+mood;c.innerHTML=codyMarkup;document.getElementById("cwSpeech").textContent=message;}
function getLocalDone(){try{return JSON.parse(localStorage.getItem("codequest_lesson_progress_"+uid+"_"+language)||"[]")}catch{return []}}
let uid=null;
function keyOf(x){return x?.chapter+":"+x?.lesson}
function isDone(item,ci,li,records,local){const id=String(item.id||"");return records.some(x=>x.completed===true&&(keyOf(x)===ci+":"+li||String(x.lessonId||x.id||"")===id))||local.some(x=>x.completed===true&&(keyOf(x)===ci+":"+li||String(x.lessonId||x.id||"")===id));}
function render(chapters,records,local){const flat=[];chapters.forEach((ch,ci)=>(ch.lessons||[]).forEach((lesson,li)=>flat.push({ch,lesson,ci,li,done:isDone(lesson,ci,li,records,local)})));let first=flat.findIndex(x=>!x.done);if(first<0)first=flat.length;
const completed=flat.filter(x=>x.done).length,percent=flat.length?Math.round(completed/flat.length*100):0;
document.getElementById("cwTitle").textContent="رحلة "+cfg.name;document.getElementById("cwDescription").textContent=cfg.description;document.getElementById("cwProgressText").textContent=percent+"% مكتمل";document.getElementById("cwLessonCount").textContent=completed+" من "+flat.length+" درس";document.getElementById("cwProgressBar").style.width=percent+"%";
const units=chapters.map((ch,ci)=>{const lessons=ch.lessons||[];const unitDone=lessons.filter((x,li)=>isDone(x,ci,li,records,local)).length;const nodes=lessons.map((lesson,li)=>{const index=flat.findIndex(x=>x.ci===ci&&x.li===li),done=isDone(lesson,ci,li,records,local),current=!done&&index===first,locked=!done&&!current;const icon=done?"ri-check-line":locked?"ri-lock-2-line":current?"ri-play-fill":"ri-star-fill";const title=lesson.title||("الدرس "+(li+1));const href=cfg.url(ci,li);return '<div class="cw-node-wrap '+(current?"is-current":"")+'">'+(current?'<div class="cw-node-cody">'+codyMarkup+'</div>':"")+'<button class="cw-node '+(done?"is-done":current?"is-current":"")+'" type="button" '+(locked?'disabled aria-label="درس مقفول"':'data-href="'+safe(href)+'" aria-label="'+safe(title)+'"')+'><i class="'+icon+'"></i></button><span class="cw-node-label">'+safe(title)+'</span><span class="cw-node-sub">'+(done?"مكتمل":current?"ابدأ هنا":"افتح بعد السابق")+'</span></div>'}).join("");return '<section class="cw-unit"><header class="cw-unit-head"><span class="cw-unit-number">'+(ci+1)+'</span><div><h3>'+safe(ch.title||("الوحدة "+(ci+1)))+'</h3><p>'+lessons.length+' دروس · '+unitDone+' مكتمل</p></div><span class="cw-unit-status">'+(unitDone===lessons.length?"✓ مكتملة":unitDone+" / "+lessons.length)+'</span></header><div class="cw-nodes">'+nodes+'</div></section>'}).join("");
map.innerHTML=units||'<div class="cw-empty">المنهج لسه مفيهوش دروس متاحة.</div>';map.querySelectorAll("[data-href]").forEach(b=>b.addEventListener("click",()=>location.href=b.dataset.href));
setCody(percent===100?"happy":"wave",percent===100?"يا سلام! خلصت المسار كله. فخور بتقدمك!":"أنا واقف عند أول درس متاح ليك. نبدأ سوا، وكل ما تخلص درس هنفتح اللي بعده!");
}
async function init(){if(!cfg){map.innerHTML='<div class="cw-empty">المسار المطلوب غير موجود. ارجع واختار لغة من المسارات.</div>';return}
try{const user=await requireUser();uid=user.uid;let chapters;
if(language==="java"){chapters=cfg.chapters.map((lessons,i)=>({title:"الوحدة "+(i+1)+": "+lessons[0],lessons:lessons.slice(1).map((title,j)=>({id:`java-${i+1}-${j+1}`,title}))}));}
else{const res=await fetch(cfg.file,{cache:"no-store"});if(!res.ok)throw new Error("تعذر تحميل المنهج");const data=await res.json();chapters=data.chapters||[]}
let records=[];try{records=await getLessonProgress(language)}catch(error){console.warn("Cloud progress unavailable; using local cache",error)}
const local=getLocalDone();render(chapters,records,local);
try{const profile=await getUserProfile();document.getElementById("cwXp").textContent=String(profile?.xp??0);document.getElementById("cwStars").textContent=String(profile?.stars??0)}catch{document.getElementById("cwXp").textContent="—";document.getElementById("cwStars").textContent="—"}
}catch(error){console.error(error);map.innerHTML='<div class="cw-empty">مقدرتش أحمل خريطة المسار. حدّث الصفحة أو ارجع للمسارات وحاول تاني.</div>';setCody("think","فيه مشكلة بسيطة في تحميل الرحلة. جرّب تحدّث الصفحة.");}}
init();
