// A completed lesson leads into a short Cody transition and a clear next action.
// Lesson checks remain available, but they do not interrupt the next lesson in the same unit.
let shownFor=null;
const STYLE_ID='cq-journey-motion-style';

export function stopJourney(){
 shownFor=null;
 document.getElementById('journey')?.remove();
 document.getElementById(STYLE_ID)?.remove();
}

export function startJourney({anchor,pack,lesson,next,goNext,quizUrl,testUrl=null}){
 if(shownFor===lesson.id)return;
 stopJourney();
 shownFor=lesson.id;

 const index=pack.lessons.indexOf(lesson)+1;
 const total=pack.lessons.length;
 const sameUnit=!!next&&next.pack===pack;

 const style=document.createElement('style');
 style.id=STYLE_ID;
 style.textContent=`
 #journey{animation:cqJourneyIn .45s ease-out both}
 #journey .journey-cody{display:flex;align-items:center;gap:12px;margin:0 0 12px}
 #journey .journey-cody-avatar{display:grid;place-items:center;width:54px;height:54px;flex:none;border-radius:18px;background:linear-gradient(145deg,#7955e8,#36bfe5);font-size:30px;box-shadow:0 6px 18px #0003;animation:cqCodyArrive .85s cubic-bezier(.2,.8,.2,1) both}
 #journey .journey-cody-bubble{padding:9px 13px;border-radius:14px;background:#1c2c49;border:1px solid #465a80}
 #journey .journey-cody-bubble strong{display:block;color:#b2f1ff}
 #journey .journey-cody-bubble span{font-size:13px}
 #journey .journey-actions .journey-secondary{background:transparent;border-color:#6479ae}
 @keyframes cqJourneyIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
 @keyframes cqCodyArrive{0%{opacity:0;transform:translateX(22px) scale(.75) rotate(-8deg)}65%{transform:translateX(-4px) scale(1.08) rotate(3deg)}100%{opacity:1;transform:translateX(0) scale(1) rotate(0)}}
 @media(prefers-reduced-motion:reduce){#journey,#journey .journey-cody-avatar{animation:none!important}}
 html[data-theme=light] #journey .journey-cody-bubble{background:#e9effb;color:#14203d;border-color:#c9d4ea}
 html[data-theme=light] #journey .journey-cody-bubble strong{color:#17606d}
 `;
 document.head.append(style);

 const box=document.createElement('section');
 box.id='journey';
 box.setAttribute('role','status');
 box.setAttribute('aria-live','polite');

 const cody=document.createElement('div');
 cody.className='journey-cody';
 const avatar=document.createElement('span');
 avatar.className='journey-cody-avatar';
 avatar.textContent='🤖';
 avatar.setAttribute('aria-hidden','true');
 const bubble=document.createElement('div');
 bubble.className='journey-cody-bubble';
 const name=document.createElement('strong');
 name.textContent='كودي';
 const say=document.createElement('span');
 say.textContent=sameUnit?'ممتاز! خلّصنا الدرس ده. يلا نكمل المغامرة في الدرس اللي بعده.':'رائع! خلّصنا دروس الوحدة. نراجع اللي اتعلمناه قبل فتح الوحدة التالية.';
 bubble.append(name,say);
 cody.append(avatar,bubble);

 const h=document.createElement('h3');
 h.textContent='الوحدة '+pack.unit+' · الدرس '+index+' من '+total;
 const dots=document.createElement('div');
 dots.className='journey-dots';
 dots.setAttribute('aria-label','تقدم دروس الوحدة');
 pack.lessons.forEach((item,i)=>{
  const dot=document.createElement('span');
  dot.className=i<index?'done':'';
  dots.append(dot);
 });

 const p=document.createElement('p');
 const row=document.createElement('div');
 row.className='journey-actions';
 const main=document.createElement('button');
 main.type='button';
 main.className='primary';
 const secondary=testUrl?document.createElement('button'):null;

 if(sameUnit){
  p.textContent='الدرس التالي: '+next.lesson.title+'. كودي جاهز يكمل معاك.';
  main.textContent='ابدأ الدرس التالي';
  main.onclick=()=>{stopJourney();goNext()};
  if(secondary){
   secondary.type='button';
   secondary.className='journey-secondary';
   secondary.textContent='اختبار الدرس الحالي';
   secondary.onclick=()=>{stopJourney();location.assign(testUrl)};
  }
 }else{
  p.textContent='اكتملت دروس الوحدة. الخطوة التالية اختبار الوحدة لفتح المسار التالي.';
  main.textContent='ابدأ اختبار الوحدة';
  main.onclick=()=>{stopJourney();location.assign(quizUrl)};
  if(testUrl){
   const optional=document.createElement('button');
   optional.type='button';
   optional.className='journey-secondary';
   optional.textContent='اختبار الدرس للمراجعة (اختياري)';
   optional.onclick=()=>{stopJourney();location.assign(testUrl)};
   row.append(optional);
  }
 }

 row.append(main);
 if(secondary)row.append(secondary);
 box.append(cody,h,dots,p,row);
 anchor.after(box);
 box.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'nearest'});
}
