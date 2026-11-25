// After a lesson is genuinely complete (all phases done), show where the learner is and
// where they go next. Never moves on by itself: the learner presses the button.
// Nothing here marks completion; it only reacts to a completed session.
let timer=null,shownFor=null;
export function stopJourney(){clearInterval(timer);timer=null;shownFor=null;const j=document.getElementById('journey');if(j)j.remove()}
export function startJourney({anchor,pack,lesson,next,goNext,quizUrl,testUrl=null}){
 if(shownFor===lesson.id)return;stopJourney();shownFor=lesson.id;
 const index=pack.lessons.indexOf(lesson)+1,total=pack.lessons.length,sameUnit=next&&next.pack===pack;
 const box=document.createElement('section');box.id='journey';box.setAttribute('role','status');box.setAttribute('aria-live','polite');
 const h=document.createElement('h3');h.textContent='الوحدة '+pack.unit+' · الدرس '+index+' من '+total;
 const p=document.createElement('p');
 const dots=document.createElement('div');dots.className='journey-dots';pack.lessons.forEach((l,i)=>{const d=document.createElement('span');d.className=i<index?'done':'';dots.append(d)});
 const row=document.createElement('div');row.className='journey-actions';
 const main=document.createElement('button');main.type='button';main.className='primary';
 const stay=document.createElement('button');stay.type='button';stay.textContent='ابقى هنا';
 let action;
 if(testUrl){p.textContent='خلصت خطوات الدرس. الخطوة الجاية اختبار الدرس: ٤ أسئلة جديدة، والنجاح من ٥٠٪. بعد النتيجة تضغطي «التالي» بنفسك.';main.textContent='ابدأ اختبار الدرس';action=()=>{location.href=testUrl}}
 else if(sameUnit){p.textContent='الدرس الجاي: '+next.lesson.title+'.';main.textContent='الدرس اللي بعده';action=goNext}
 else{p.textContent='خلصت كل دروس الوحدة '+pack.unit+'. الخطوة الجاية اختبار الوحدة، بيوريك أنهي درس يحتاج مراجعة.';main.textContent='ابدأ اختبار الوحدة';action=()=>{location.href=quizUrl}}
 main.onclick=()=>{stopJourney();action()};
 row.append(main,stay);box.append(h,dots,p,row);anchor.after(box);
 stay.hidden=true; // No automatic movement: the learner chooses when to continue.
}
