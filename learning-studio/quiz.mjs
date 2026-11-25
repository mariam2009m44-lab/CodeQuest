import {gradeCode,summarize,byLesson,isPassed,PASS_PERCENT,MCQ_POINTS,CODE_POINTS} from './quiz-core.mjs';
import {selectExecutor} from './execution.mjs';
import {setProse} from './prose.mjs';
const q=new URLSearchParams(location.search),lang=q.get('lang')||'python',unit=Number(q.get('unit')||1);
const $=id=>document.getElementById(id);
const quizzes=await (await fetch('quizzes.json')).json();const data=quizzes[lang+'-'+unit];
const units=await (await fetch('units.json')).json();const pack=units.find(u=>u.language===lang&&u.unit===unit);
$('mapLink').href='/course-path.html?lang='+encodeURIComponent(lang);
if(!data||!pack){$('quizTitle').textContent='لا يوجد اختبار لهذه الوحدة بعد.'}
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
   order.forEach(k=>{const o=it.options[k];const b=document.createElement('button');b.type='button';setProse(b,o);b.onclick=()=>{if(answers[i])return;answers[i]={correct:k===it.answer};box.querySelectorAll('button').forEach(x=>x.disabled=true);b.setAttribute('aria-pressed','true');box.querySelectorAll('button').forEach((x,xi)=>{if(order[xi]===it.answer)x.classList.add('quiz-right');else if(x===b)x.classList.add('quiz-wrong')});fb.className='bubble reply '+(k===it.answer?'fit':'retry');setProse(fb,(k===it.answer?'صح. ':'إجابتك مش صح، والصح: '+it.options[it.answer]+'. ')+it.why);fb.hidden=false;upd();done()};box.append(b)});
   card.append(box,fb);
  }else{
   const ta=document.createElement('textarea');ta.className='quiz-code';ta.dir='ltr';ta.rows=8;ta.value=it.starter||'';ta.setAttribute('aria-label','كود السؤال '+(i+1));
   const out=document.createElement('pre');out.dir='ltr';out.className='quiz-out';out.textContent='';
   const stdinBox=it.tests.some(t=>t.stdin)?Object.assign(document.createElement('textarea'),{rows:2,dir:'ltr',className:'quiz-stdin',placeholder:'مدخلات للتجربة (اختياري)'}):null;
   const tryBtn=document.createElement('button');tryBtn.type='button';tryBtn.textContent='جرّب (مش بيتحسب)';
   const sub=document.createElement('button');sub.type='button';sub.className='primary';sub.textContent='سلّم الحل (مرة واحدة)';
   tryBtn.onclick=async()=>{if(busy)return;busy=true;out.textContent='بيشتغل...';try{const ex=await selectExecutor(lang);const r=await ex(ta.value,stdinBox?stdinBox.value:'');out.textContent=r.ok?r.stdout:(r.message||r.stdout||'حصل خطأ')}catch(e){out.textContent='تعذر التشغيل دلوقتي.'}busy=false};
   sub.onclick=async()=>{if(busy||answers[i])return;busy=true;sub.disabled=tryBtn.disabled=true;ta.readOnly=true;fb.hidden=false;fb.className='bubble reply';fb.textContent='بنصحح...';
    let g;try{g=await gradeCode(it,ta.value,await selectExecutor(lang))}catch(e){g={passed:false,results:[],ran:false}}
    if(!g.ran&&!g.passed&&g.results.every(r=>!r.ran)){answers[i]=undefined;sub.disabled=tryBtn.disabled=false;ta.readOnly=false;fb.className='bubble reply retry';fb.textContent='الكود ما اشتغلش أو الخدمة مش متاحة، فالتسليم ما اتحسبش. صلّح الخطأ وسلّم تاني. '+(g.results[0]?.message||'');busy=false;return}
    answers[i]={correct:g.passed};fb.className='bubble reply '+(g.passed?'fit':'retry');setProse(fb,(g.passed?'صح. الناتج مطابق في كل الحالات. ':'الناتج مش مطابق في حالة أو أكتر. ')+it.why);busy=false;upd();done()};
   card.append(ta);if(stdinBox)card.append(stdinBox);card.append(tryBtn,sub,out,fb);
  }
  $('quizBody').append(card);cards.push(card);
 });
 function done(){
  if(answers.filter(Boolean).length<items.length)return;
  const s=summarize(items,answers);const r=$('quizResult');r.hidden=false;r.replaceChildren();
  const h=document.createElement('h2');h.textContent='نتيجتك: '+s.percent+'% ('+s.earned+' من '+s.total+') - '+s.band;r.append(h);const ok=isPassed(s.percent);const st=document.createElement('p');st.className='quiz-status '+(ok?'pass':'review');st.textContent=ok?'ناجح: تقدر تكمّل للوحدة الجاية.':'محتاج مراجعة: النجاح من '+PASS_PERCENT+'%. راجع الدروس تحت ثم أعد الاختبار.';r.append(st);
  const n=document.createElement('p');n.textContent=s.missedLessons.length?'راجع: '+s.missedLessons.map(titleOf).join('، '):'كل الإجابات صح.';r.append(n);
  const ul=document.createElement('ul');ul.className='quiz-lessons';
  byLesson(items,answers).forEach(x=>{const li=document.createElement('li');const a=document.createElement('a');a.href='/learning.html?lang='+encodeURIComponent(lang)+'&lesson='+encodeURIComponent(x.lesson);a.textContent=titleOf(x.lesson);const sp=document.createElement('span');sp.textContent=x.earned+' من '+x.total+' ('+x.percent+'%)';li.append(a,sp);if(x.percent<100){const m=document.createElement('em');m.textContent='راجع الدرس ده';li.append(m)}ul.append(li)});
  const hh=document.createElement('h3');hh.textContent='أسئلة الاختبار المرتبطة بكل درس';r.append(hh,ul);
  const cov=document.createElement('p');cov.className='small';cov.textContent='دي أسئلة قليلة (من '+items.length+') بتغطي بعض مفاهيم الدرس بس، فمش تقييم كامل للدرس.';r.append(cov);const note=document.createElement('p');note.textContent='النسبة دي نتيجة هذا الاختبار فقط ومحفوظة على هذا الجهاز، مش تقييم لمستواك الكامل ولا مكافأة.';r.append(note);
  const nu=units.find(u=>u.language===lang&&u.unit===unit+1);
  if(ok&&nu){const g=document.createElement('a');g.className='primary';g.href='/learning.html?lang='+encodeURIComponent(lang)+'&unit='+nu.unit+'&lesson='+encodeURIComponent(nu.lessons[0].id);g.textContent='كمّل: الوحدة '+nu.unit+' - '+nu.title;g.style.marginInlineEnd='10px';r.append(g)}
  else if(ok){const e=document.createElement('p');e.textContent='ده آخر اختبار في المسار.';r.append(e)}
  const again=document.createElement('a');again.className='primary';again.href=location.href;again.textContent='ابدأ اختبار جديد';r.append(again);
  try{localStorage.setItem('codequest_studio_quiz_'+lang+'_'+unit,JSON.stringify({percent:s.percent,passed:ok,earned:s.earned,total:s.total,lessons:byLesson(items,answers),at:Date.now(),source:'studio-device-only'}))}catch{}
  r.scrollIntoView();
 }
}
