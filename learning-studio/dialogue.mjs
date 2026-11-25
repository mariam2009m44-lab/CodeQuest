// Fixed authored chat: Cody and the student profile trade short bubbles. Records no evidence and awards nothing.
import {setProse} from './prose.mjs';
export let STUDENT_NAME='أنا';
// Cody is the platform's own CSS mascot (same markup as the Python lesson chat). The learner avatar is the
// markup the platform's avatar module renders for the account; until it is set, the platform default is used.
const CODY_HTML='<span class="cody-character is-waving"><span class="cody-character__antenna"></span><span class="cody-character__head"><span class="cody-character__eye cody-character__eye--left"></span><span class="cody-character__eye cody-character__eye--right"></span><span class="cody-character__mouth"></span></span><span class="cody-character__body"><span class="cody-character__core">✦</span></span><span class="cody-character__arm cody-character__arm--left"></span><span class="cody-character__arm cody-character__arm--right"></span><span class="cody-character__leg cody-character__leg--left"></span><span class="cody-character__leg cody-character__leg--right"></span></span>';
let studentHTML='';
export function setStudent({html,name}={}){if(typeof html==='string')studentHTML=html;if(typeof name==='string'&&name.trim())STUDENT_NAME=name.trim().slice(0,40)}
function row(doc,who,cls){
 const r=doc.createElement('div');r.className='msg '+who+(cls?' '+cls:'');
 const av=doc.createElement(who==='cody'?'span':'div');av.className='avatar';av.setAttribute('role','img');av.setAttribute('aria-label',who==='cody'?'كودي':'الطالب');
 av.innerHTML=who==='cody'?CODY_HTML:studentHTML;
 const name=doc.createElement('span');name.className='who';name.textContent=who==='cody'?'كودي':STUDENT_NAME;
 const b=doc.createElement('p');b.className='bubble';
 const col=doc.createElement('div');col.className='col';col.append(name,b);r.append(av,col);return {r,b};
}
export function renderDialogue(container,turns,intro){
 container.replaceChildren();container.hidden=!Array.isArray(turns)||!turns.length;
 if(container.hidden)return;
 const doc=container.ownerDocument;
 const log=doc.createElement('div');log.className='chatlog';log.setAttribute('role','log');container.append(log);
 if(intro){const m=row(doc,'cody');setProse(m.b,intro);log.append(m.r)}
 const show=i=>{
  const turn=turns[i];if(!turn)return;
  const ask=row(doc,'cody');setProse(ask.b,turn.ask);log.append(ask.r);
  const choices=doc.createElement('div');choices.className='choices';
  let mine=null,answer=null,done=false;
  turn.options.forEach(option=>{
   const button=doc.createElement('button');button.type='button';setProse(button,option.text);
   button.onclick=()=>{
    choices.querySelectorAll('button').forEach(b=>b.removeAttribute('aria-pressed'));button.setAttribute('aria-pressed','true');
    if(mine)mine.r.remove();if(answer)answer.r.remove();
    mine=row(doc,'student');setProse(mine.b,option.text);
    answer=row(doc,'cody',option.fit?'fit':'retry');setProse(answer.b,option.reply);
    log.append(mine.r,answer.r);answer.r.setAttribute('role','status');
    if(option.fit&&!done){done=true;show(i+1)}
   };
   choices.append(button);
  });
  log.append(choices);
 };
 show(0);
}
