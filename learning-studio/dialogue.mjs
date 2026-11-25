// Cody's short choice dialogue. Purely explanatory: it records no evidence and awards nothing.
import {setProse} from './prose.mjs';
export function renderDialogue(container,turns){
 container.replaceChildren();container.hidden=!Array.isArray(turns)||!turns.length;
 if(container.hidden)return;
 const doc=container.ownerDocument;
 turns.forEach(turn=>{
  const box=doc.createElement('div');box.className='turn';
  const ask=doc.createElement('p');ask.className='bubble ask';setProse(ask,turn.ask);
  const choices=doc.createElement('div');choices.className='choices';
  const reply=doc.createElement('p');reply.className='bubble reply';reply.hidden=true;reply.setAttribute('role','status');
  turn.options.forEach(option=>{
   const button=doc.createElement('button');button.type='button';setProse(button,option.text);
   button.onclick=()=>{choices.querySelectorAll('button').forEach(b=>b.removeAttribute('aria-pressed'));button.setAttribute('aria-pressed','true');reply.className='bubble reply '+(option.fit?'fit':'retry');setProse(reply,option.reply);reply.hidden=false};
   choices.append(button);
  });
  box.append(ask,choices,reply);container.append(box);
 });
}
