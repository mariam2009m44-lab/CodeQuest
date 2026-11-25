// Canonical links contain only authored course identifiers, never learner data.
export function resolveRoute(packs,search=''){
 const p=new URLSearchParams(search),language=p.get('lang'),lessonId=p.get('lesson'),unit=Number(p.get('unit'));
 const candidates=packs.filter(x=>x.language===language);
 const pool=candidates.length?candidates:packs.filter(x=>x.language===packs[0]?.language);
 if(lessonId){for(const pack of pool){const lesson=pack.lessons.find(x=>x.id===lessonId);if(lesson)return {pack,lesson}}}
 const pack=pool.find(x=>x.unit===unit)??pool[0],index=p.get('index'),n=index!==null&&/^\d+$/.test(index)?Number(index):0;return {pack,lesson:pack?.lessons[n]??pack?.lessons[0]};
}
export function routeSearch(pack,lesson){return '?'+new URLSearchParams({lang:pack.language,unit:String(pack.unit),lesson:lesson.id})}
export function nextLesson(packs,pack,lesson){
 const i=pack.lessons.indexOf(lesson);if(i<0)return null;
 if(i+1<pack.lessons.length)return {pack,lesson:pack.lessons[i+1]};
 const next=packs.filter(x=>x.language===pack.language&&x.unit>pack.unit).sort((a,b)=>a.unit-b.unit)[0];
 return next?{pack:next,lesson:next.lessons[0]}:null;
}
