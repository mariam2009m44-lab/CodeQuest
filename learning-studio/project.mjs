// A unit project with less guidance than a lesson: goal + requirements, a hint ladder the learner opens on purpose,
// run-before-submit, and a grade against visible and hidden cases. Everything stays on this device for this account:
// no server record, no certificate or reward credit (the page says so).
import {gradeCode} from './quiz-core.mjs';
import {selectExecutor} from './execution.mjs';
const q=new URLSearchParams(location.search),id=q.get('project')||'';
const $=i=>document.getElementById(i);
const el=(tag,props={},...kids)=>{const e=document.createElement(tag);Object.assign(e,props);kids.forEach(k=>e.append(k));return e};
const projects=await (await fetch('projects.json')).json().catch(()=>[]);
const pj=projects.find(p=>p.id===id);
const localHost=location.hostname==='localhost'||location.hostname==='127.0.0.1';
let uid=null;
if(localHost){uid=q.get('uid')||null}
else{try{const {requireUser}=await import('/js/auth.js');const u=await requireUser();if(!u?.uid)throw new Error('sign-in required');uid=u.uid}catch{location.replace('/login.html?'+new URLSearchParams({next:'learning-studio/project.html'+location.search}));await new Promise(()=>{})}}
const body=$('pjBody');
if(!pj){$('pjTitle').textContent='المشروع ده مش موجود.';body.append(el('p',{textContent:'ارجع للخريطة واختار مشروع من وحدة خلصتها.'}))}
else{
 $('mapLink').href='/course-path.html?lang='+encodeURIComponent(pj.language);
 $('pjTitle').textContent=pj.title;$('pjTitle').append(el('span',{className:'pj-level',textContent:pj.level}));
 const key=uid?'codequest_studio_project_'+uid+'_'+pj.id:null;
 let saved={};if(key){try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{saved={}}}
 const persist=()=>{if(!key)return;try{localStorage.setItem(key,JSON.stringify(saved))}catch{}};
 body.append(el('p',{textContent:pj.goal}),el('h2',{textContent:'المطلوب'}));
 const ul=el('ul',{className:'pj-reqs'});pj.requirements.forEach(r=>ul.append(el('li',{textContent:r})));body.append(ul);
 // Hint ladder: closed by default, one step at a time, count kept so the learner sees how much help was used.
 const hintBox=el('div',{className:'pj-hints'});hintBox.setAttribute('role','status');const hintBtn=el('button',{type:'button',className:'pj-hint-btn'});
 let used=Math.min(Number(saved.hints)||0,pj.hints.length);
 const drawHints=()=>{hintBox.replaceChildren();for(let i=0;i<used;i++)hintBox.append(el('div',{className:'pj-hint',textContent:'تلميح '+(i+1)+': '+pj.hints[i]}));
  hintBtn.textContent=used<pj.hints.length?(used===0?'محتاج تلميح؟ (جرّب الأول بنفسك)':'تلميح تاني ('+(used+1)+' من '+pj.hints.length+')'):'مفيش تلميحات تانية';hintBtn.disabled=used>=pj.hints.length};
 hintBtn.onclick=()=>{if(used<pj.hints.length){used++;saved.hints=used;persist();drawHints();hintBox.querySelector('.pj-hint:last-child')?.scrollIntoView({block:'nearest'})}};
 drawHints();body.append(hintBtn,hintBox);
 const ta=el('textarea',{className:'quiz-code',dir:'ltr',rows:12,value:typeof saved.code==='string'&&saved.code!==''?saved.code:pj.starter});ta.setAttribute('aria-label','كود المشروع');
 
 const status=el('p',{id:'pjStatus',className:'pj-note'});status.setAttribute('role','status');
 const drawStatus=()=>{status.textContent=saved.passed&&saved.passedCode===ta.value?'الكود الحالي نجح في كل الحالات.':(saved.passed?'نجحت قبل كده بنسخة تانية من الكود. الكود الحالي لسه ما اتحققش: اضغط تحقق.':'')};
 ta.addEventListener('input',()=>{saved.code=ta.value;persist();if(res.childNodes.length){res.replaceChildren()}drawStatus()});
 body.append(el('h2',{textContent:'كودك'}),ta,status);
 const tryTa=el('textarea',{className:'quiz-stdin pj-try',dir:'ltr',rows:3,value:pj.trySetup});tryTa.setAttribute('aria-label',pj.tryLabel);
 body.append(el('p',{className:'pj-note',textContent:pj.tryLabel}),tryTa);
 const out=el('pre',{className:'quiz-out',dir:'ltr'}),res=el('div',{id:'pjResult'});res.setAttribute('role','status');res.setAttribute('aria-live','polite');
 const tryBtn=el('button',{type:'button',textContent:'جرّب (مش بيتحسب)'}),checkBtn=el('button',{type:'button',className:'primary',textContent:'تحقق من الحل'});
 let busy=false;
 // Account guard (hosted only): if the signed-in account changed in another tab since this page loaded, never run or save under the old one.
 const sameAccount=async()=>{if(localHost)return true;try{const {auth}=await import('/js/firebase-config.js');return !auth.currentUser||auth.currentUser.uid===uid}catch{return true}};
 const accountChanged=()=>{res.replaceChildren(el('p',{className:'bubble reply retry',textContent:'الحساب اتغيّر في تبويب تاني. حدّث الصفحة علشان تكمل بحسابك.'}))};
 tryBtn.onclick=async()=>{if(busy)return;if(!(await sameAccount())){accountChanged();return}busy=true;out.textContent='بيشتغل...';try{const ex=await selectExecutor(pj.language);
   const code=pj.tryMode==='prelude'?tryTa.value+'\n'+ta.value:ta.value+'\n'+tryTa.value;const r=await ex(code,'');out.textContent=r.ok?(r.stdout||'(مفيش ناتج: استخدم print)'):(r.message||r.stdout||'حصل خطأ')}catch{out.textContent='تعذر التشغيل دلوقتي.'}busy=false};
 checkBtn.onclick=async()=>{if(busy)return;if(!(await sameAccount())){accountChanged();return}busy=true;checkBtn.disabled=true;res.replaceChildren(el('p',{textContent:'بنصحح...'}));
  let g;try{g=await gradeCode({tests:pj.tests},ta.value,await selectExecutor(pj.language))}catch{g={passed:false,results:[],ran:false}}
  busy=false;checkBtn.disabled=false;res.replaceChildren();
  if(!g.results.length||g.results.every(r=>!r.ran)){res.append(el('p',{className:'bubble reply retry',textContent:'الكود ما اشتغلش أو خدمة التشغيل مش متاحة، فالتحقق ما اتحسبش. '+(g.results[0]?.message||'صلّح الخطأ وجرّب تاني.')}));return}
  const list=el('ul',{className:'pj-tests'});let hiddenFail=0,hiddenTotal=0;
  pj.tests.forEach((t,i)=>{const r=g.results[i];if(!t.visible){hiddenTotal++;if(!r.ok)hiddenFail++;return}
   const li=el('li',{className:r.ok?'ok':'bad'});li.append(el('strong',{textContent:(r.ok?'نجحت الحالة ':'فشلت الحالة ')+(i+1)}));
   if(!r.ok){li.append(el('pre',{textContent:'المتوقع:\n'+t.expected+'\nالناتج:\n'+(r.ran?r.stdout:(r.message||'خطأ في التشغيل'))}))}list.append(li)});
  res.append(list);
  const note=hiddenTotal?(hiddenFail===0?'كل الحالات المخفية ('+hiddenTotal+') نجحت كمان.':'في '+hiddenFail+' من '+hiddenTotal+' حالات مخفية فشلت. فكّر في الحالات الحدّية: قيمة على الحد، قائمة فاضية، تكرار.'):'';
  if(g.passed){res.append(el('p',{className:'bubble reply fit',textContent:'مشروعك نجح في كل الحالات. '+note}));saved.passed=true;saved.passedCode=ta.value;saved.passedAt=Date.now();saved.hintsAtPass=used;persist();drawStatus();
   res.append(el('h3',{textContent:'جرّب تطوّر مشروعك'}),el('p',{textContent:pj.extension}),el('a',{className:'primary',href:'/playground.html',textContent:'افتح مختبر الأكواد'}))}
  else res.append(el('p',{className:'bubble reply retry',textContent:'لسه في حالات فاشلة. '+note}));
  res.append(el('p',{className:'pj-note',textContent:'ده تدريب: النتيجة محفوظة على هذا الجهاز لحسابك بس، ومش بتتحسب في الشهادة أو المكافآت، والحالات المخفية دي فحص تدريبي مش امتحان رسمي.'}))};
 body.append(el('div',{className:'pj-actions'},tryBtn,checkBtn),out,res);
 drawStatus();
}
