import {parseIntro} from './intro-runner.mjs';
function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
export function checkIntroConcept({lesson,phase,code,language}){
 try{
  const step=lesson.steps.find(s=>s.type===phase),actual=parseIntro(code,language),expected=parseIntro(step.referenceSolution,language);
  // Intro task contract. Formatting, comments, quote style and harmless parentheses
  // do not affect the AST. Broader equivalent algorithms require expanded criteria.
  const clean=ast=>{
   const numericNames=new Set(),aliases=new Map();let nextName=0;const alias=name=>{if(!aliases.has(name))aliases.set(name,'v'+nextName++);return aliases.get(name)};
   const numeric=n=>n&&(n.type==='literal'&&typeof n.value==='number'||n.type==='name'&&numericNames.has(n.name)||n.type==='unary'&&numeric(n.value)||n.type==='binary'&&numeric(n.left)&&numeric(n.right));
   const norm=n=>{if(!n||typeof n!=='object')return n;if(Array.isArray(n))return n.map(norm);const out=Object.fromEntries(Object.entries(n).map(([k,v])=>[k,norm(v)]));if(out.params)out.params=out.params.map(p=>({...p,name:alias(p.name)}));if(typeof out.name==='string'&&out.type!=='conversion')out.name=alias(out.name);if(typeof out.updateName==='string')out.updateName=alias(out.updateName);if(out.type==='binary'&&['>','>='].includes(out.op)){out.op=out.op==='>'?'<':'<=';[out.left,out.right]=[out.right,out.left]}if(out.type==='binary'&&['+','*'].includes(out.op)&&numeric(n)){const pair=[out.left,out.right].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));[out.left,out.right]=pair}return out};
   return ast.filter(n=>n.type!=='return').flatMap(n=>n.type==='cout'?n.items.map(item=>({type:'cout-part',item:item.type==='endl'||item.type==='literal'&&item.value==='\n'?{type:'newline'}:item})):n).map(n=>{const normalized=norm(n);if((n.type==='declare'||n.type==='assign')&&numeric(n.value))numericNames.add(n.name);return normalized});
  };
  if(!same(clean(actual.ast),clean(expected.ast)))return {approved:false,message:'الناتج وحده لا يكفي. '+step.conceptRubric};
  if(['cpp_l3','java-1-2'].includes(lesson.id)&&phase==='transfer'||lesson.id==='cpp_l3'){
   if(!actual.comments.some(x=>x.replace(/[\s/*#]/g,'').length>=5))return {approved:false,message:'أضف تعليقًا مفيدًا يشرح أمر العرض، وليس رموزًا فقط.'};
  }
  return {approved:true,message:'استخدمت الفكرة المطلوبة.'};
 }catch(error){return {approved:false,message:'الكود قد يكون صالحًا للتشغيل، لكن فحص فكرة هذه الوحدة لا يغطي هذه الصيغة بعد. '+error.message}}
}
