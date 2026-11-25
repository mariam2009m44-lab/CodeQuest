import {scoreLessonTest,lessonTestKey} from './lesson-test-core.mjs';
import {PASS_PERCENT} from './quiz-core.mjs';
import {setProse} from './prose.mjs';
const $=id=>document.getElementById(id),q=new URLSearchParams(location.search),lang=q.get('lang')||'python',lessonId=q.get('lesson')||'';
const [bank,units]=await Promise.all([fetch('lesson-tests.json').then(r=>r.json()),fetch('units.json').then(r=>r.json())]);
const pack=units.find(u=>u.language===lang&&u.lessons.some(l=>l.id===lessonId)),lesson=pack?.lessons.find(l=>l.id===lessonId),items=bank[lessonId];
$('mapLink').href='/course-path.html?lang='+encodeURIComponent(lang);
const idx=pack?pack.lessons.indexOf(lesson):-1;
function nextTarget(){if(!pack)return null;if(idx+1<pack.lessons.length){const n=pack.lessons[idx+1];return {href:'/learning.html?lang='+encodeURIComponent(lang)+'&unit='+pack.unit+'&lesson='+encodeURIComponent(n.id),text:'التالي: '+n.title}}return {href:'quiz.html?lang='+encodeURIComponent(lang)+'&unit='+pack.unit,text:'التالي: امتحان الوحدة '+pack.unit}}
const link=(href,text,cls='primary')=>{const a=document.createElement('a');a.className=cls;a.href=href;a.textContent=text;a.style.marginInlineEnd='10px';return a};
if(!lesson||!items){$('ltTitle').textContent='اختبار الدرس';$('ltIntro').textContent='لسه مفيش اختبار لهذا الدرس، فبتكمل من غيره. اختبار الوحدة موجود في آخرها.';document.querySelector('.quiz-progress').hidden=true;$('ltBody').hidden=true;const n=nextTarget();if(n)$('ltResult').append(link(n.href,n.text));$('ltResult').hidden=false}
else{
 $('ltTitle').textContent='اختبار الدرس: '+lesson.title;
 $('ltIntro').textContent='٤ أسئلة جديدة عن الدرس. كل سؤال إجابته الأولى هي اللي بتتحسب، والنجاح من '+PASS_PERCENT+'٪ يعني إجابتين صح على الأقل. مفيش حاجة من الشات بتتحسب هنا.';
 const answers=[];let cur=0;
 const draw=()=>{
  const it=items[cur];$('ltProgText').textContent='سؤال '+(cur+1)+' من '+items.length;$('ltBar').style.width=Math.round(cur*100/items.length)+'%';
  const body=$('ltBody');body.replaceChildren();const p=document.createElement('p');setProse(p,it.q);body.append(p);
  if(it.code){const pre=document.createElement('pre');pre.dir='ltr';pre.className='quiz-snippet';pre.textContent=it.code;body.append(pre)}
  const box=document.createElement('div');box.className='choices';const fb=document.createElement('p');fb.className='bubble reply';fb.hidden=true;fb.setAttribute('role','status');
  const order=it.options.map((_,k)=>k);for(let a=order.length-1;a>0;a--){const r=Math.floor(Math.random()*(a+1));[order[a],order[r]]=[order[r],order[a]]}
  const nextBtn=document.createElement('button');nextBtn.type='button';nextBtn.className='primary';nextBtn.hidden=true;nextBtn.textContent=cur+1<items.length?'السؤال اللي بعده':'شوف النتيجة';nextBtn.onclick=()=>{cur++;cur<items.length?draw():finish()};
  order.forEach(k=>{const b=document.createElement('button');b.type='button';setProse(b,it.options[k]);b.onclick=()=>{if(answers[cur])return;const ok=k===it.answer;answers[cur]={correct:ok,picked:k};box.querySelectorAll('button').forEach((x,xi)=>{x.disabled=true;if(order[xi]===it.answer)x.dataset.state='right';else if(order[xi]===k)x.dataset.state='wrong'});fb.hidden=false;setProse(fb,(ok?'صح. ':'مش دي. ')+it.why);nextBtn.hidden=false;nextBtn.focus()};box.append(b)});
  body.append(box,fb,nextBtn);
 };
 const finish=()=>{
  const s=scoreLessonTest(items,answers),r=$('ltResult');$('ltBody').hidden=true;$('ltBar').style.width='100%';$('ltProgText').textContent='خلصت الأسئلة';r.replaceChildren();r.hidden=false;
  const h=document.createElement('h2');h.textContent=s.percent+'٪ ('+s.earned+' من '+s.total+')';const st=document.createElement('p');st.className=s.passed?'':'error';st.textContent=s.passed?'ناجح. تقدري تكملي للدرس اللي بعده.':'محتاج مراجعة. راجعي الدرس وجرّبي تاني، النجاح من '+PASS_PERCENT+'٪.';r.append(h,st);
  const ul=document.createElement('ol');items.forEach((it,i)=>{const li=document.createElement('li');setProse(li,(answers[i].correct?'صح: ':'غلط: ')+it.q+(answers[i].correct?'':' الإجابة الصحيحة: '+it.options[it.answer]));ul.append(li)});r.append(ul);
  const prev=(()=>{try{return JSON.parse(localStorage.getItem(lessonTestKey(lang,lessonId))||'null')}catch{return null}})();
  // A pass is never removed by a later lower attempt.
  const keep=prev?.passed===true;try{localStorage.setItem(lessonTestKey(lang,lessonId),JSON.stringify({percent:keep?Math.max(prev.percent,s.percent):s.percent,passed:keep||s.passed,at:Date.now(),source:'studio-device-only'}))}catch{}
  const n=nextTarget();
  if(s.passed&&n)r.append(link(n.href,n.text));
  else r.append(link('/learning.html?lang='+encodeURIComponent(lang)+'&unit='+pack.unit+'&lesson='+encodeURIComponent(lessonId),'راجعي الدرس','primary'));
  r.append(link(location.href,'أعيدي الاختبار','secondary'));
  const note=document.createElement('p');note.className='small';note.textContent='النتيجة محفوظة على هذا الجهاز فقط، ومش مربوطة بالحساب لسه.';r.append(note);
 };
 draw();
}
