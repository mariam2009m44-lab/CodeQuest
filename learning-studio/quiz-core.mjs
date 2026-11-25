// Chapter quiz scoring. Only the graded answers count: one choice per question and one
// submission per code task. Free "run" clicks, lesson steps and hints are never scored.
export const MCQ_POINTS=1,CODE_POINTS=2;
// Owner-approved (Mariam, 15:56): pass at 50 percent or more, inclusive.
export const PASS_PERCENT=50;
export const isPassed=percent=>percent>=PASS_PERCENT;
export const BANDS=[[90,'ممتاز'],[75,'جيد جدًا'],[60,'جيد'],[0,'محتاج مراجعة']];
export function normalizeOutput(s){return String(s??'').replace(/\r\n/g,'\n').split('\n').map(x=>x.replace(/[ \t]+$/,'')).join('\n').replace(/\n+$/,'')}
export function outputMatches(actual,expected){return normalizeOutput(actual)===normalizeOutput(expected)}
export async function gradeCode(item,code,execute){
 const results=[];
 for(const t of item.tests){
  let r;try{r=await execute((t.prelude??'')+code+(t.append?'\n'+t.append:''),t.stdin??'')}catch(e){r={ok:false,stdout:'',message:'تعذر التشغيل'}}
  results.push({ok:r.ok===true&&outputMatches(r.stdout,t.expected),ran:r.ok===true,stdout:r.stdout??'',message:r.message??''});
 }
 return {passed:results.every(x=>x.ok),results,ran:results.every(x=>x.ran)};
}
export function summarize(items,answers){
 let earned=0,total=0;const missed=[];
 items.forEach((it,i)=>{const w=it.kind==='code'?CODE_POINTS:MCQ_POINTS;total+=w;const a=answers[i];if(a&&a.correct)earned+=w;else missed.push(it.lesson)});
 const percent=total?Math.round(earned*100/total):0;
 const band=BANDS.find(b=>percent>=b[0])[1];
 return {earned,total,percent,band,missedLessons:[...new Set(missed)]};
}
export function byLesson(items,answers){
 const m=new Map();
 items.forEach((it,i)=>{const w=it.kind==='code'?CODE_POINTS:MCQ_POINTS;const e=m.get(it.lesson)||{lesson:it.lesson,earned:0,total:0};e.total+=w;if(answers[i]&&answers[i].correct)e.earned+=w;m.set(it.lesson,e)});
 return [...m.values()].map(e=>({...e,percent:e.total?Math.round(e.earned*100/e.total):0}));
}
