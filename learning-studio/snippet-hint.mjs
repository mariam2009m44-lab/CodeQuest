// Code in questions is shown with one line per source line and scrolls sideways on narrow screens.
// When a snippet is wider than its box, show a plain hint under it so the cut-off line is not read as missing code.
const HINT='↔ السطر أطول من الشاشة: اسحب الكود يمين وشمال لتشوف باقيه.';
function check(pre){
  if(!pre.isConnected)return;
  const next=pre.nextElementSibling,has=next&&next.classList.contains('scroll-hint');
  const over=pre.scrollWidth>pre.clientWidth+1;
  if(over&&!has){const p=document.createElement('p');p.className='scroll-hint';p.textContent=HINT;pre.after(p)}
  else if(!over&&has)next.remove()}
function scan(){document.querySelectorAll('pre.quiz-snippet').forEach(check)}
let t=0;const later=()=>{clearTimeout(t);t=setTimeout(scan,30)};
if(typeof document!=='undefined'){new MutationObserver(later).observe(document.documentElement,{childList:true,subtree:true});addEventListener('resize',later);later()}
export {scan};
