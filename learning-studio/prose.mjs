// Isolate whole ASCII code fragments so operators and operands stay together in RTL prose.
export function proseNodes(text,documentRef=document){
 const fragment=documentRef.createDocumentFragment();text=String(text);let start=0;
 for(const match of text.matchAll(/[\u0020-\u007e]+/g)){
  if(!/[A-Za-z0-9_<>=]/.test(match[0]))continue;
  const raw=match[0],leading=raw.match(/^\s*/)[0],trailing=raw.match(/\s*$/)[0],value=raw.trim();
  fragment.append(documentRef.createTextNode(text.slice(start,match.index)+leading));
  const span=documentRef.createElement('bdi');span.dir='ltr';span.textContent=value;fragment.append(span,documentRef.createTextNode(trailing));start=match.index+raw.length;
 }
 fragment.append(documentRef.createTextNode(text.slice(start)));return fragment;
}
export function setProse(element,text){element.replaceChildren(proseNodes(text,element.ownerDocument))}
