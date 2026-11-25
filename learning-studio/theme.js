// Studio theme: shares the platform key (cq_theme). With no saved choice, follows the system setting.
(function(){
 var KEY='cq_theme',root=document.documentElement,mq=window.matchMedia&&matchMedia('(prefers-color-scheme: light)');
 function saved(){try{var v=localStorage.getItem(KEY);return v==='light'||v==='dark'?v:null}catch(e){return null}}
 function apply(t){root.setAttribute('data-theme',t);root.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',t==='light'?'#f4f7ff':'#090f25')}
 function current(){return saved()||(mq&&mq.matches?'light':'dark')}
 apply(current());
 if(mq&&mq.addEventListener)mq.addEventListener('change',function(){if(!saved())apply(current())});
 document.addEventListener('DOMContentLoaded',function(){
  var h=document.querySelector('header');if(!h||document.getElementById('themeToggle'))return;
  var b=document.createElement('button');b.type='button';b.id='themeToggle';b.className='theme-toggle';
  function label(){var l=root.getAttribute('data-theme')==='light';b.textContent=l?'🌙 داكن':'☀️ فاتح';b.setAttribute('aria-label',l?'التبديل إلى الوضع الداكن':'التبديل إلى الوضع الفاتح')}
  b.onclick=function(){var n=root.getAttribute('data-theme')==='light'?'dark':'light';apply(n);try{localStorage.setItem(KEY,n)}catch(e){}label()};
  label();h.append(b);
 });
})();
