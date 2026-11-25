// The original level map (course-path.html) stays the entry point. A lesson opened from it
// shows only that lesson, and finishing it marks the map node done on this device.
const params=new URLSearchParams(location.search);
export const fromMap=params.get('from')==='map';
export function applyMapMode(language){
 if(!fromMap)return;
 document.body.classList.add('from-map');
 const mapUrl='/course-path.html?lang='+encodeURIComponent(language);
 const head=document.querySelector('header a');if(head){head.href=mapUrl;head.textContent='← خريطة المسار';head.removeAttribute('dir');head.setAttribute('aria-label','العودة إلى خريطة المسار')}
 let back=document.getElementById('backToMap');
 if(!back){back=document.createElement('a');back.id='backToMap';back.className='primary map-back';back.href=mapUrl;back.textContent='ارجع للخريطة وكمّل مع كودي';back.hidden=true;document.getElementById('completion')?.after(back)}
 return back;
}
export function recordMapProgress(language,unit,index,uid){
 // Recorded whichever way the lesson was opened (map, tracks page, resume), so the map never lags behind lessons she finished.
 return writeMapProgress(language,unit,index,uid);
}
export function writeMapProgress(language,unit,index,uid){
 if(!uid||!Number.isSafeInteger(unit)||!Number.isSafeInteger(index))return false;
 const key='codequest_lesson_progress_'+uid+'_'+language;
 try{
  const list=JSON.parse(localStorage.getItem(key)||'[]'),records=Array.isArray(list)?list:[];
  if(!records.some(x=>x?.completed===true&&x.chapter===unit-1&&x.lesson===index))records.push({id:'studio-'+language+'-'+unit+'-'+index,chapter:unit-1,lesson:index,completed:true,source:'studio-device-only'});
  localStorage.setItem(key,JSON.stringify(records));return true;
 }catch{return false}
}
