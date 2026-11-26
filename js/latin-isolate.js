// Keeps tokens such as C++ and C# in order inside Arabic (RTL) text. Without an isolate the trailing "+" or "#"
// takes the right-to-left direction and the token shows as "++C". Wrapping changes layout only: textContent stays the same.
(function(){
  var RE=/[A-Za-z][A-Za-z0-9_]*[+#]+/g, SKIP=/^(SCRIPT|STYLE|TEXTAREA|INPUT|PRE|CODE|BDI|OPTION|TITLE|NOSCRIPT)$/;
  function wrap(root){
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      var p=n.parentElement;if(!p||SKIP.test(p.tagName)||p.closest('bdi,pre,code,textarea'))return NodeFilter.FILTER_REJECT;
      RE.lastIndex=0;return RE.test(n.data)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}}),nodes=[],n;
    while((n=walker.nextNode()))nodes.push(n);
    nodes.forEach(function(node){
      var text=node.data,frag=document.createDocumentFragment(),last=0,m;RE.lastIndex=0;
      while((m=RE.exec(text))){
        if(m.index>last)frag.appendChild(document.createTextNode(text.slice(last,m.index)));
        var b=document.createElement('bdi');b.dir='ltr';b.textContent=m[0];frag.appendChild(b);last=m.index+m[0].length}
      if(last<text.length)frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag,node)})}
  function run(){try{wrap(document.body)}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  var t=0;try{new MutationObserver(function(){clearTimeout(t);t=setTimeout(run,60)}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
})();
