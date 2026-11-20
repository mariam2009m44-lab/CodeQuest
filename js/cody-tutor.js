const MASCOT = `<span class="cody-character is-waving"><span class="cody-character__antenna"></span><span class="cody-character__head"><span class="cody-character__eye cody-character__eye--left"></span><span class="cody-character__eye cody-character__eye--right"></span><span class="cody-character__mouth"></span></span><span class="cody-character__body"><span class="cody-character__core">✦</span></span><span class="cody-character__arm cody-character__arm--left"></span><span class="cody-character__arm cody-character__arm--right"></span><span class="cody-character__leg cody-character__leg--left"></span><span class="cody-character__leg cody-character__leg--right"></span></span>`;
function clean(value){return typeof value==="string"?value.trim():"";}
function makeSteps(lesson){
 const steps=[];
 const intro=clean(lesson?.cody_intro||lesson?.intro);
 const objective=clean(lesson?.objective||lesson?.goal);
 const explanation=clean(lesson?.explanation||lesson?.description||lesson?.concept||lesson?.content);
 const example=clean(lesson?.example||lesson?.code_example||lesson?.starter_code||lesson?.starter||lesson?.code);
 const task=clean(lesson?.task||lesson?.exercise||lesson?.practice);
 const hints=Array.isArray(lesson?.hints)?lesson.hints.map(clean).filter(Boolean):[clean(lesson?.hint)].filter(Boolean);
 const quizExplanation=clean(lesson?.quiz?.explanation);
 if(intro)steps.push({label:"أهلًا! نبدأ سوا",message:intro,mood:"wave"});
 if(objective)steps.push({label:"هدفنا في الدرس",message:objective,mood:"think"});
 if(explanation)steps.push({label:"خلينا نفهم الفكرة",message:explanation,mood:"talk"});
 if(example)steps.push({label:"نشوفها في كود",message:"ركز معايا في المثال. شوف كل سطر بيعمل إيه، وبعدها هنجرّب بإيدينا.",code:example,mood:"think"});
 if(task)steps.push({label:"التحدي بتاعك",message:task,mood:"ready"});
 hints.forEach((hint,index)=>steps.push({label:"تلميح "+(index+1),message:hint,mood:"think"}));
 if(quizExplanation)steps.push({label:"معلومة مهمة",message:quizExplanation,mood:"happy"});
 return steps;
}
export function mountCodyTutor(lesson,language="اللغة الحالية"){
 if(!lesson||typeof document==="undefined")return;
 const host=document.querySelector("#lessonContent .content-grid")||document.querySelector("#lessonContent .workspace")||document.querySelector(".content-grid")||document.querySelector(".workspace");
 if(!host)return;
 document.getElementById("codyInteractiveTutor")?.remove();
 const steps=makeSteps(lesson);if(!steps.length)return;
 const params=new URLSearchParams(location.search);
 const lang=(document.body.dataset.course||params.get("lang")||"python").toLowerCase();
 const panel=document.createElement("section");panel.className="cody-tutor";panel.id="codyInteractiveTutor";panel.setAttribute("aria-label","مدرس كودي التفاعلي");
 panel.innerHTML=`<div class="cody-tutor-top"><div class="cody-tutor-mascot">${MASCOT}</div><div class="cody-tutor-identity"><strong>كودي</strong><span>مدرّسك في ${String(language).replace(/[&<>"]/g,"")}</span></div><a class="cody-tutor-map-link" href="course-path.html?lang=${encodeURIComponent(lang)}"><i class="ri-route-line"></i> خريطة الرحلة</a></div><div class="cody-tutor-progress" aria-hidden="true"><span></span></div><div class="cody-tutor-meta"><strong class="cody-tutor-step-title"></strong><span class="cody-tutor-step-count"></span></div><div class="cody-tutor-message" aria-live="polite"></div><pre class="cody-tutor-code" hidden dir="ltr"></pre><div class="cody-tutor-actions"><button class="cody-tutor-back" type="button" disabled>السابق</button><button class="cody-tutor-next" type="button">متابعة ←</button></div>`;
 host.parentNode.insertBefore(panel,host);
 const title=panel.querySelector(".cody-tutor-step-title"),count=panel.querySelector(".cody-tutor-step-count"),message=panel.querySelector(".cody-tutor-message"),code=panel.querySelector(".cody-tutor-code"),bar=panel.querySelector(".cody-tutor-progress span"),back=panel.querySelector(".cody-tutor-back"),next=panel.querySelector(".cody-tutor-next"),mascot=panel.querySelector(".cody-tutor-mascot");
 let index=0,finished=false;
 function render(){const step=steps[index];title.textContent=step.label;count.textContent="خطوة "+(index+1)+" من "+steps.length;message.textContent=step.message;code.hidden=!step.code;code.textContent=step.code||"";bar.style.width=((index+1)/steps.length*100)+"%";back.disabled=index===0;next.textContent=index===steps.length-1?"ابدأ التطبيق العملي ↓":"متابعة ←";panel.dataset.mood=step.mood||"talk";mascot.className="cody-tutor-mascot";mascot.innerHTML=MASCOT.replace("is-waving",step.mood==="happy"?"is-happy":"is-waving");mascot.classList.toggle("is-thinking",step.mood==="think");}
 back.addEventListener("click",()=>{if(index>0){index--;finished=false;render()}});
 next.addEventListener("click",()=>{if(finished){index=0;finished=false;render();return}if(index<steps.length-1){index++;render();return}const target=document.querySelector("#codeEditor,#pythonCodeInput,.editor-card,.editor-panel,.task-card");target?.scrollIntoView({behavior:"smooth",block:"center"});const editor=document.querySelector("#codeEditor,#pythonCodeInput");editor?.focus({preventScroll:true});finished=true;next.textContent="راجع الشرح مرة أخرى"});
 render();
}
