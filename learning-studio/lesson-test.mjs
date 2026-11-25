import {scoreLessonTest,lessonTestKey} from './lesson-test-core.mjs';
import {PASS_PERCENT} from './quiz-core.mjs';
import {writeMapProgress} from './map-flow.mjs';
import {setProse} from './prose.mjs';
const $=id=>document.getElementById(id),q=new URLSearchParams(location.search),lang=q.get('lang')||'python',lessonId=q.get('lesson')||'';
const [bank,units]=await Promise.all([fetch('lesson-tests.json').then(r=>r.json()),fetch('units.json').then(r=>r.json())]);
const pack=units.find(u=>u.language===lang&&u.lessons.some(l=>l.id===lessonId)),lesson=pack?.lessons.find(l=>l.id===lessonId),items=bank[lessonId];
$('mapLink').href='/course-path.html?lang='+encodeURIComponent(lang);
const idx=pack?pack.lessons.indexOf(lesson):-1;
// The account is resolved from the real sign-in (same guard as the lesson page). localhost has no sign-in, so tests pass ?uid=.
const localHost=location.hostname==='localhost'||location.hostname==='127.0.0.1';
let uid=null;
if(localHost){uid=q.get('uid')||null}
else{try{const {requireUser}=await import('/js/auth.js');const u=await requireUser();if(!u?.uid)throw new Error('sign-in required');uid=u.uid}catch{location.replace('/login.html?'+new URLSearchParams({next:'learning-studio/lesson-test.html'+location.search}));await new Promise(()=>{})}}
// A pending map step belongs to one account; another account never inherits it.
const pending=(()=>{try{const p=JSON.parse(localStorage.getItem('cq_lt_pending')||'null');return p&&p.lessonId===lessonId&&(localHost&&!uid?true:p.uid===uid)?p:null}catch{return null}})();
const fm=(q.get('from')==='map'?'&from=map':'')+(localHost&&uid?'&uid='+encodeURIComponent(uid):'');
const mapUrl='/course-path.html?lang='+encodeURIComponent(lang),retakeUrl=location.pathname+'?lang='+encodeURIComponent(lang)+'&lesson='+encodeURIComponent(lessonId)+fm+'&retake=1';
if(localHost&&!uid&&pending?.uid)uid=pending.uid;
function nextTarget(){if(!pack)return null;if(idx+1<pack.lessons.length){const n=pack.lessons[idx+1];return {href:'/learning.html?lang='+encodeURIComponent(lang)+'&unit='+pack.unit+'&lesson='+encodeURIComponent(n.id)+fm,text:'التالي: '+n.title}}return {href:'quiz.html?lang='+encodeURIComponent(lang)+'&unit='+pack.unit,text:'التالي: امتحان الوحدة '+pack.unit}}
const link=(href,text,cls='primary')=>{const a=document.createElement('a');a.className=cls;a.href=href;a.textContent=text;a.style.marginInlineEnd='10px';return a};
if(!lesson||!items){$('ltTitle').textContent='اختبار الدرس';$('ltIntro').textContent='لسه مفيش اختبار لهذا الدرس، فبتكمل من غيره. اختبار الوحدة موجود في آخرها.';document.querySelector('.quiz-progress').hidden=true;$('ltBody').hidden=true;const n=nextTarget();if(n)$('ltResult').append(link(n.href,n.text));$('ltResult').hidden=false}
else{
 $('ltTitle').textContent='اختبار الدرس: '+lesson.title;
 $('ltIntro').textContent='٤ أسئلة جديدة عن الدرس. تُحسب الإجابة الأولى لكل سؤال، والنجاح من '+PASS_PERCENT+'% يعني إجابتين صحيحتين على الأقل. لا يُحسب هنا أي شيء من الشات.';
 const saved=(()=>{try{return JSON.parse(localStorage.getItem(lessonTestKey(lang,lessonId,uid))||'null')}catch{return null}})();
 if(saved?.passed===true&&q.get('retake')!=='1'){
  // Reopening (for example with the browser Back button) shows the saved pass; it never silently restarts the exam.
  const r=$('ltResult');$('ltBody').hidden=true;document.querySelector('.quiz-progress').hidden=true;r.hidden=false;r.className='lt-result';
  const score=document.createElement('div');score.className='lt-score';const pct=document.createElement('bdi');pct.dir='ltr';pct.className='lt-big';pct.textContent=saved.percent+'%';score.append(pct);
  const st=document.createElement('p');st.className='lt-status pass';st.textContent='نجحت في هذا الاختبار. الدرس التالي متاح.';r.append(score,st);
  const actions=document.createElement('div');actions.className='lt-actions';
  const mk2=(href,text,cls)=>{const a=document.createElement('a');a.className=cls;a.href=href;a.textContent=text;a.onclick=e=>{e.preventDefault();location.replace(href)};return a};
  const n=nextTarget();if(n)actions.append(mk2(n.href,n.text,'lt-btn lt-primary'));actions.append(mk2(retakeUrl,'إعادة الاختبار','lt-btn lt-secondary'),mk2(mapUrl,'الرجوع إلى الخريطة','lt-btn lt-secondary'));r.append(actions);
 }else{
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
  const s=scoreLessonTest(items,answers),r=$('ltResult');$('ltBody').hidden=true;$('ltBar').style.width='100%';$('ltProgText').textContent='انتهت الأسئلة';r.replaceChildren();r.hidden=false;r.className='lt-result';
  const score=document.createElement('div');score.className='lt-score';
  const big=document.createElement('bdi');big.dir='ltr';big.className='lt-big';big.textContent=s.earned+' / '+s.total;
  const pct=document.createElement('bdi');pct.dir='ltr';pct.className='lt-pct';pct.textContent=s.percent+'%';
  score.append(big,pct);
  const st=document.createElement('p');st.className='lt-status '+(s.passed?'pass':'fail');
  st.textContent=s.passed?'ناجح. الدرس التالي متاح.':'يحتاج مراجعة. حد النجاح '+PASS_PERCENT+'% (إجابتان صحيحتان من أربع).';
  r.append(score,st);
  const ol=document.createElement('ol');ol.className='lt-review';
  items.forEach((it,i)=>{const li=document.createElement('li');li.className=answers[i].correct?'ok':'bad';
   const head=document.createElement('p');head.className='lt-rq';setProse(head,(answers[i].correct?'صحيح. ':'غير صحيح. ')+it.q);li.append(head);
   if(it.code){const pre=document.createElement('pre');pre.dir='ltr';pre.className='quiz-snippet';pre.textContent=it.code;li.append(pre)}
   const ans=document.createElement('p');ans.className='lt-ans';const lab=document.createElement('span');lab.textContent='الإجابة الصحيحة: ';const val=document.createElement('bdi');val.dir='auto';val.className=/^[\x20-\x7e]+$/.test(it.options[it.answer])?'lt-val':'lt-text';val.textContent=it.options[it.answer];ans.append(lab,val);li.append(ans);
   if(!answers[i].correct){const why=document.createElement('p');why.className='lt-why';setProse(why,it.why);li.append(why)}
   ol.append(li)});
  r.append(ol);
  const prev=(()=>{try{return JSON.parse(localStorage.getItem(lessonTestKey(lang,lessonId,uid))||'null')}catch{return null}})();
  // A pass is never removed by a later lower attempt.
  const keep=prev?.passed===true;try{localStorage.setItem(lessonTestKey(lang,lessonId,uid),JSON.stringify({percent:keep?Math.max(prev.percent,s.percent):s.percent,passed:keep||s.passed,at:Date.now(),source:'studio-device-only'}))}catch{}
  // Passing is what completes the node on the map (the lesson page only records the node after this).
  if(s.passed)try{const pend=pending;if(pend){writeMapProgress(pend.language,pend.unit,pend.index,pend.uid);localStorage.removeItem('cq_lt_pending')}}catch{}
  const n=nextTarget();const actions=document.createElement('div');actions.className='lt-actions';
  const mk=(href,text,cls)=>{const a=document.createElement('a');a.className=cls;a.href=href;a.textContent=text;a.onclick=e=>{e.preventDefault();location.replace(href)};return a};
  if(s.passed&&n){actions.append(mk(n.href,n.text,'lt-btn lt-primary'),mk(retakeUrl,'إعادة الاختبار','lt-btn lt-secondary'))}
  else{actions.append(mk(retakeUrl,'إعادة الاختبار','lt-btn lt-primary'),mk('/learning.html?lang='+encodeURIComponent(lang)+'&unit='+pack.unit+'&lesson='+encodeURIComponent(lessonId)+fm,'مراجعة الدرس','lt-btn lt-secondary'))}
  actions.append(mk(mapUrl,'الرجوع إلى الخريطة','lt-btn lt-secondary'));r.append(actions);
  const note=document.createElement('p');note.className='small';note.textContent='النتيجة محفوظة على هذا الجهاز فقط، وغير مرتبطة بالحساب حتى الآن.';r.append(note);
 };
 draw();
 }
}
