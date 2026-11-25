// Per-lesson test. Four equally weighted questions, so 2 of 4 is exactly 50 percent and passes.
// Only the answers given in this test count. Reference solutions and chat answers are never scored.
import {isPassed} from './quiz-core.mjs';
export const QUESTIONS_PER_LESSON=4;
export function scoreLessonTest(items,answers){
 const total=items.length,earned=items.filter((_,i)=>answers[i]?.correct===true).length;
 const percent=total?Math.round(earned*100/total):0;
 return {earned,total,percent,passed:total>0&&answers.filter(Boolean).length===total&&isPassed(percent),missed:items.map((it,i)=>answers[i]?.correct===true?null:i).filter(i=>i!==null)};
}
// Keyed by account uid so two accounts on one device never share a result.
export const lessonTestKey=(lang,lessonId,uid)=>'codequest_studio_lessontest_'+(uid||'anon')+'_'+lang+'_'+lessonId;
// Structural checks used by the content validator and tests.
export function validateItem(it){
 const errs=[];
 if(typeof it.q!=='string'||it.q.trim().length<6)errs.push('q');
 if(!Array.isArray(it.options)||it.options.length!==3||new Set(it.options.map(String)).size!==3)errs.push('options');
 if(!Number.isInteger(it.answer)||it.answer<0||it.answer>2)errs.push('answer');
 if(typeof it.why!=='string'||it.why.length<15)errs.push('why');
 if(JSON.stringify(it).includes('\u2014'))errs.push('emdash');
 return errs;
}
