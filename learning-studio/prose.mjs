// Isolate whole ASCII code fragments so operators and operands stay together in RTL prose.
export function proseNodes(text,documentRef=document){
 const fragment=documentRef.createDocumentFragment();text=String(text);let start=0;
 for(const match of text.matchAll(/[\u0020-\u007e]+/g)){
  if(!/[A-Za-z0-9_<>=]/.test(match[0]))continue;
  const raw=match[0],lead=raw.match(/^[\s:;,.!?]*/)[0],trail=raw.slice(lead.length).match(/[\s:,.!?]*$/)[0],value=raw.slice(lead.length,raw.length-trail.length);
  if(!value)continue;const leading=lead,trailing=trail;
  fragment.append(documentRef.createTextNode(text.slice(start,match.index)+leading));
  const span=documentRef.createElement('bdi');span.dir='ltr';span.className='code';span.textContent=value;fragment.append(span,documentRef.createTextNode(trailing?'\u2060\u200f'+trailing:''));start=match.index+raw.length;
 }
 fragment.append(documentRef.createTextNode(text.slice(start)));return fragment;
}
export function setProse(element,text){element.replaceChildren(proseNodes(text,element.ownerDocument))}
