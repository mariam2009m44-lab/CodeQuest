import {CODY_HTML} from './cody-markup.mjs';
import {gradeCode,summarize,byLesson,isPassed,afterLastUnit,PASS_PERCENT,MCQ_POINTS,CODE_POINTS} from './quiz-core.mjs';
import './snippet-hint.mjs';
import {selectExecutor} from './execution.mjs';
import {setProse} from './prose.mjs';
import {postProgress,postDurable,flushPending,examPayload,codeTaskPayload} from './progress-api.mjs';
const q=new URLSearchParams(location.search),lang=q.get('lang')||'python',unit=Number(q.get('unit')||1);
const localHost=location.hostname==='localhost'||location.hostname==='127.0.0.1';
// The pass flag is kept per signed-in account on this device (never shared between accounts, never a server record).
let uid=null;
if(localHost){uid=q.get('uid')||null}
else{try{const {requireUser}=await import('/js/auth.js');const u=await requireUser();if(!u?.uid)throw new Error('sign-in required');uid=u.uid}catch{location.replace('/login.html?'+new URLSearchParams({next:'learning-studio/quiz.html'+location.search}));await new Promise(()=>{})}}
const $=id=>document.getElementById(id);
const quizzes=await (await fetch('quizzes.json')).json();const data=quizzes[lang+'-'+unit];
const features=await fetch('features.json').then(r=>r.json()).catch(()=>({}));
const serverOn=features.serverAssessment===true;
// A token is only ever used for the account that owns this page: no token is returned (so nothing is posted) if the signed-in account changed before or while it was fetched.
const ownerToken=async(auth,force)=>{if(!uid||auth.currentUser?.uid!==uid)return null;const t=await auth.currentUser.getIdToken(force===true);return auth.currentUser?.uid===uid?t:null};
const durable=async(key,path,payload,extra={})=>{const {auth}=await import('/js/firebase-config.js');if(auth.currentUser?.uid&&auth.currentUser.uid!==uid)return {state:'off'};return postDurable({uid:auth.currentUser?.uid||null,storage:localStorage,key,enabled:serverOn,getToken:force=>ownerToken(auth,force),fetchFn:(u,o)=>fetch(u,o),path,payload,...extra})};
if(serverOn)import('/js/firebase-config.js').then(({auth})=>flushPending({uid:auth.currentUser?.uid||null,storage:localStorage,enabled:true,getToken:force=>ownerToken(auth,force),fetchFn:(u,o)=>fetch(u,o)}).then(async()=>{const {mountPendingNotice}=await import('./pending-notice.mjs');mountPendingNotice({uid:auth.currentUser?.uid||null,storage:localStorage,sendOpts:()=>({getToken:force=>ownerToken(auth,force),fetchFn:(u,o)=>fetch(u,o)})})})).catch(()=>{});
const pendingSync=[];
const units=await (await fetch('units.json')).json();const pack=units.find(u=>u.language===lang&&u.unit===unit);
$('mapLink').href='/course-path.html?lang='+encodeURIComponent(lang);
// The unit exam opens only after every lesson test of the unit is passed on this account (and, from unit 2, the previous unit exam). Pages on localhost skip this unless ?gate=1 (so fixture specs can open the exam directly).
const lessonBankForGate=pack?await fetch('lesson-tests.json').then(r=>r.json()).catch(()=>({})):{};
const gateOpen=(()=>{if(!pack)return true;if(localHost&&q.get('gate')!=='1')return true;if(!uid)return false;
 const ok=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')?.passed===true}catch{return false}};
 // A lesson counts as done when its chat steps were finished and recorded on the map for THIS account (records are per account key), or its test was passed.
 const rec=(()=>{try{const r=JSON.parse(localStorage.getItem('codequest_lesson_progress_'+uid+'_'+lang)||'[]');return Array.isArray(r)?r:[]}catch{return []}})();
 const py=(()=>{if(lang!=='python')return [];try{const r=JSON.parse(localStorage.getItem('codequest_'+uid+'_cody_python_completed_lessons')||'[]');return Array.isArray(r)?r.map(String):[]}catch{return []}})();
 const lessonsOk=pack.lessons.every((l,i)=>ok('codequest_studio_lessontest_'+uid+'_'+lang+'_'+l.id)||rec.some(x=>x?.completed===true&&x.chapter===unit-1&&x.lesson===i)||py.includes(unit+'_'+i));
 const prevOk=unit<=1||ok('codequest_studio_quiz_'+uid+'_'+lang+'_'+(unit-1));
 return lessonsOk&&prevOk})();
if(!gateOpen){document.head.append(Object.assign(document.createElement('link'),{rel:'stylesheet',href:'cody-character.css'}));
 $('quizTitle').textContent='اختبار الوحدة';$('quizIntro').hidden=true;
 const card=document.createElement('section');card.className='exam-locked';card.setAttribute('role','status');
 card.innerHTML='<div class="exam-locked__cody" aria-hidden="true">'+CODY_HTML+'</div><h2>اختبار الوحدة لسه مقفول</h2><p>خلّص دروس الوحدة بالترتيب، وبعدها يتفتح اختبار الوحدة.</p><a class="exam-locked__btn" id="examLockedMap" href="/course-path.html?lang='+encodeURIComponent(lang)+'">الرجوع للخريطة وإكمال الرحلة</a>';
 $('quizIntro').after(card)}
else if(!data||!pack){$('quizTitle').textContent='لا يوجد اختبار لهذه الوحدة بعد.'}
else{
 $('quizTitle').textContent='اختبار: '+pack.title;
 const items=[...data.mcq.map(x=>({...x,kind:'mcq'})),...data.code.map(x=>({...x,kind:'code'}))];
 const titleOf=id=>pack.lessons.find(l=>l.id===id)?.title||id;
 $('quizIntro').textContent='الاختبار ده بيحسب نسبة. كل سؤال اختيار إجابته الأولى بتتحسب، وكل مهمة كود بتتحسب لما تضغط "سلّم الحل" مرة واحدة. زر "جرّب" بيشغّل الكود بس ومش بيتحسب. مفيش تلميحات أثناء الاختبار.';
 const answers=[];let busy=false;const cards=[];
 const prog=document.createElement('div');prog.className='quiz-progress';prog.innerHTML='<div class="quiz-progress-text"></div><div class="quiz-bar"><span></span></div>';$('quizBody').before(prog);
 const upd=()=>{const n=answers.filter(Boolean).length;prog.querySelector('.quiz-progress-text').textContent='أجبت على '+n+' من '+items.length;prog.querySelector('.quiz-bar span').style.width=Math.round(n*100/items.length)+'%'};upd();
 items.forEach((it,i)=>{
  const card=document.createElement('section');card.className='quiz-item';const h=document.createElement('h2');h.textContent='سؤال '+(i+1)+(it.kind==='code'?' (كود، '+CODE_POINTS+' درجات)':' ('+MCQ_POINTS+' درجة)');card.append(h);
  const p=document.createElement('p');setProse(p,it.kind==='code'?it.task:it.q);card.append(p);if(it.code){const pre=document.createElement('pre');pre.dir='ltr';pre.className='quiz-snippet';pre.textContent=it.code;card.append(pre)}
  const fb=document.createElement('p');fb.className='bubble reply';fb.hidden=true;fb.setAttribute('role','status');
  if(it.kind==='mcq'){
   const box=document.createElement('div');box.className='choices';
   const order=it.options.map((_,k)=>k);for(let a=order.length-1;a>0;a--){const r=Math.floor(Math.random()*(a+1));[order[a],order[r]]=[order[r],order[a]]}
   order.forEach(k=>{const o=it.options[k];const b=document.createElement('button');b.type='button';setProse(b,o);b.onclick=()=>{if(answers[i])return;answers[i]={correct:k===it.answer,picked:k};box.querySelectorAll('button').forEach(x=>x.disabled=true);b.setAttribute('aria-pressed','true');box.querySelectorAll('button').forEach((x,xi)=>{if(order[xi]===it.answer)x.classList.add('quiz-right');else if(x===b)x.classList.add('quiz-wrong')});fb.className='bubble reply '+(k===it.answer?'fit':'retry');setProse(fb,(k===it.answer?'صح. ':'إجابتك مش صح، والصح: '+it.options[it.answer]+'. ')+it.why);fb.hidden=false;upd();done()};box.append(b)});
   card.append(box,fb);
  }else{
   const ta=document.createElement('textarea');ta.className='quiz-code';ta.dir='ltr';ta.rows=8;ta.value=it.starter||'';ta.setAttribute('aria-label','كود السؤال '+(i+1));
   const out=document.createElement('pre');out.dir='ltr';out.className='quiz-out';out.textContent='';
   const stdinBox=it.tests.some(t=>t.stdin)?Object.assign(document.createElement('textarea'),{rows:2,dir:'ltr',className:'quiz-stdin',placeholder:'مدخلات للتجربة (اختياري)'}):null;
   const tryBtn=document.createElement('button');tryBtn.type='button';tryBtn.textContent='جرّب (مش بيتحسب)';
   const sub=document.createElement('button');sub.type='button';sub.className='primary';sub.textContent='سلّم الحل (مرة واحدة)';
   tryBtn.onclick=async()=>{if(busy)return;busy=true;out.textContent='بيشتغل...';try{const ex=await selectExecutor(lang);const r=await ex(ta.value,stdinBox?stdinBox.value:'');if(!await sameAccount()){lockOut();return}out.textContent=r.ok?r.stdout:(r.message||r.stdout||'حصل خطأ')}catch(e){out.textContent='تعذر التشغيل دلوقتي.'}busy=false};
   sub.onclick=async()=>{if(busy||answers[i])return;busy=true;sub.disabled=tryBtn.disabled=true;ta.readOnly=true;fb.hidden=false;fb.className='bubble reply';fb.textContent='بنصحح...';
    let g;try{g=await gradeCode(it,ta.value,await selectExecutor(lang))}catch(e){g={passed:false,results:[],ran:false}}
    if(!await sameAccount()){lockOut();return}
    if(!g.ran&&!g.passed&&g.results.every(r=>!r.ran)){answers[i]=undefined;sub.disabled=tryBtn.disabled=false;ta.readOnly=false;fb.className='bubble reply retry';fb.textContent='الكود ما اشتغلش أو الخدمة مش متاحة، فالتسليم ما اتحسبش. صلّح الخطأ وسلّم تاني. '+(g.results[0]?.message||'');busy=false;return}
    answers[i]={correct:g.passed};if(serverOn)pendingSync.push(durable('ct:'+lang+':'+unit+':'+(i-data.mcq.length),'/api/progress/code-task',codeTaskPayload({language:lang,unit,quiz:data,item:i-data.mcq.length,code:ta.value})));fb.className='bubble reply '+(g.passed?'fit':'retry');const se=g.results.find(r=>r.student)?.message;setProse(fb,(g.passed?'صح. الناتج مطابق في كل الحالات. ':se?'في الكود خطأ فالإجابة اتحسبت غلط: '+se+'. ':'الناتج مش مطابق في حالة أو أكتر. ')+it.why);busy=false;upd();done()};
   card.append(ta);if(stdinBox)card.append(stdinBox);card.append(tryBtn,sub,out,fb);
  }
  $('quizBody').append(card);cards.push(card);
 });
 const cu0=import('/js/firebase-config.js').then(({auth})=>auth.currentUser?.uid||null).catch(()=>null);
 let dead=false;
 async function sameAccount(){if(dead)return false;try{const {auth}=await import('/js/firebase-config.js');const cu=auth.currentUser?.uid||null;const base=await cu0;return localHost?(base?cu===base&&(!uid||cu===uid):(!cu||cu===uid)):cu===uid}catch{return localHost}}
 function lockOut(){dead=true;document.querySelectorAll('.quiz-progress').forEach(x=>x.remove());$('quizBody').replaceChildren();const r=$('quizResult');r.hidden=false;r.replaceChildren();const p=document.createElement('p');p.className='quiz-status review';p.textContent='الحساب اتغيّر أثناء الاختبار، فالنتيجة ما اتسجّلتش. افتح الاختبار من جديد بالحساب الصحيح.';r.append(p);$('quizBody').hidden=true}
 function done(){
  if(answers.filter(Boolean).length<items.length)return;
  sameAccount().then(ok=>{if(ok)finish();else lockOut()})}
 function finish(){
  if(serverOn)Promise.all(pendingSync).then(states=>durable('ex:'+lang+':'+unit,'/api/progress/exam',examPayload({language:lang,unit,quiz:data,answers}),{defer:states.some(x=>x.state!=='saved'&&x.state!=='off')}));
  const s=summarize(items,answers);const r=$('quizResult');r.hidden=false;r.replaceChildren();
  const h=document.createElement('h2');h.textContent='نتيجتك: '+s.percent+'% ('+s.earned+' من '+s.total+') - '+s.band;r.append(h);const ok=isPassed(s.percent);const st=document.createElement('p');st.className='quiz-status '+(ok?'pass':'review');st.textContent=ok?'ناجح: تقدر تكمّل للوحدة الجاية.':'محتاج مراجعة: النجاح من '+PASS_PERCENT+'%. راجع الدروس تحت ثم أعد الاختبار.';r.append(st);
  const n=document.createElement('p');n.textContent=s.missedLessons.length?'راجع: '+s.missedLessons.map(titleOf).join('، '):'كل الإجابات صح.';r.append(n);
  const ul=document.createElement('ul');ul.className='quiz-lessons';
  byLesson(items,answers).forEach(x=>{const li=document.createElement('li');const a=document.createElement('a');a.href='/learning.html?lang='+encodeURIComponent(lang)+'&lesson='+encodeURIComponent(x.lesson);a.textContent=titleOf(x.lesson);const sp=document.createElement('span');sp.textContent=x.earned+' من '+x.total+' ('+x.percent+'%)';li.append(a,sp);if(x.percent<100){const m=document.createElement('em');m.textContent='راجع الدرس ده';li.append(m)}ul.append(li)});
  const hh=document.createElement('h3');hh.textContent='أسئلة الاختبار المرتبطة بكل درس';r.append(hh,ul);
  const cov=document.createElement('p');cov.className='small';cov.textContent='دي أسئلة قليلة (من '+items.length+') بتغطي بعض مفاهيم الدرس بس، فمش تقييم كامل للدرس.';r.append(cov);const note=document.createElement('p');note.textContent='النسبة دي نتيجة هذا الاختبار فقط ومحفوظة على هذا الجهاز، مش تقييم لمستواك الكامل ولا مكافأة.';r.append(note);
  const nu=units.find(u=>u.language===lang&&u.unit===unit+1);
  if(ok&&nu){const g=document.createElement('a');g.className='primary';g.href='/learning.html?lang='+encodeURIComponent(lang)+'&unit='+nu.unit+'&lesson='+encodeURIComponent(nu.lessons[0].id);g.textContent='كمّل: الوحدة '+nu.unit+' - '+nu.title;g.style.marginInlineEnd='10px';r.append(g)}
  else if(ok){const e=document.createElement('p');e.textContent='ده آخر اختبار في المسار.';r.append(e);const fl=afterLastUnit({language:lang,passed:ok,hasNextUnit:!!nu,serverOn});if(fl){const g=document.createElement('a');g.className='primary';g.href=fl.href;g.textContent=fl.text;g.style.marginInlineEnd='10px';r.append(g)}}
  const again=document.createElement('a');again.className='primary';again.href=location.href;again.textContent='ابدأ اختبار جديد';r.append(again);
  if(uid)try{localStorage.setItem('codequest_studio_quiz_'+uid+'_'+lang+'_'+unit,JSON.stringify({percent:s.percent,passed:ok,earned:s.earned,total:s.total,lessons:byLesson(items,answers),at:Date.now(),source:'studio-device-only'}))}catch{}
  r.scrollIntoView();
 }
}
