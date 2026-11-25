// Runs the learner's JavaScript in the learner's own browser, so it never uses the shared server quota.
// Isolation: a sandboxed iframe (opaque origin, no cookies, storage or account access) hosts a Worker
// that is terminated after the time limit. Output formatting follows Node's console.log for common values.
const WORKER_SOURCE=`
const fmt=(v,top=true,depth=0)=>{
 if(typeof v==='string')return top?v:"'"+v.replace(/\\\\/g,'\\\\\\\\').replace(/'/g,"\\\\'")+"'";
 if(typeof v==='bigint')return v+'n';if(typeof v==='symbol')return v.toString();if(typeof v==='function')return '[Function'+(v.name?': '+v.name:' (anonymous)')+']';
 if(v===null)return 'null';if(v===undefined)return 'undefined';if(Object.is(v,-0))return '-0';
 if(typeof v!=='object')return String(v);
 if(v instanceof Error)return v.stack||String(v);
 if(depth>2)return Array.isArray(v)?'[Array]':'[Object]';
 if(Array.isArray(v)){if(!v.length)return '[]';const parts=v.map(x=>fmt(x,false,depth+1));const one='[ '+parts.join(', ')+' ]';return one.length<=72?one:'[\\n  '+parts.join(',\\n  ')+'\\n]'}
 if(v instanceof Map)return 'Map('+v.size+') { '+[...v].map(([k,x])=>fmt(k,false,depth+1)+' => '+fmt(x,false,depth+1)).join(', ')+' }';
 if(v instanceof Set)return 'Set('+v.size+') { '+[...v].map(x=>fmt(x,false,depth+1)).join(', ')+' }';
 const keys=Object.keys(v);if(!keys.length)return '{}';
 const parts=keys.map(k=>(/^[A-Za-z_$][\\w$]*$/.test(k)?k:"'"+k+"'")+': '+fmt(v[k],false,depth+1));const one='{ '+parts.join(', ')+' }';return one.length<=72?one:'{\\n  '+parts.join(',\\n  ')+'\\n}';
};
let out='';
const line=(...a)=>{out+=a.map((x,i)=>fmt(x,true)).join(' ')+'\\n';if(out.length>100000)throw new RangeError('الناتج كبير جدًا.')};
const console={log:line,info:line,debug:line,error:line,warn:line};
onmessage=e=>{try{(0,eval)('(function(console){"use strict";'+e.data+'\\n})')(console);postMessage({ok:true,stdout:out})}catch(err){postMessage({ok:false,stdout:out,message:String(err&&err.name?err.name+': '+err.message:err)})}};
`;
const FRAME=`<!doctype html><meta charset=utf-8><script>
const src=${JSON.stringify(WORKER_SOURCE)};
let w;onmessage=e=>{if(e.data.kill){try{w&&w.terminate()}catch{}return}
 try{w=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})))}catch(err){parent.postMessage({id:e.data.id,ok:false,message:'المتصفح منع تشغيل الكود هنا.'},'*');return}
 w.onmessage=m=>parent.postMessage({id:e.data.id,...m.data},'*');w.onerror=m=>parent.postMessage({id:e.data.id,ok:false,message:String(m.message||'Error')},'*');w.postMessage(e.data.code)};
<\/script>`;
let counter=0;
export function runJavaScript(code,{timeoutMs=3000,doc=globalThis.document}={}){
 if(typeof code!=='string'||code.length>50000)return Promise.resolve({ok:false,stdout:'',message:'الكود غير صالح أو طويل جدًا.'});
 return new Promise(resolve=>{
  const id=++counter;const frame=doc.createElement('iframe');frame.setAttribute('sandbox','allow-scripts');frame.hidden=true;frame.srcdoc=FRAME;
  let done=false;const finish=r=>{if(done)return;done=true;clearTimeout(t);removeEventListener('message',on);frame.remove();resolve(r)};
  const on=e=>{if(e.source!==frame.contentWindow||e.data?.id!==id)return;const {ok,stdout,message}=e.data;finish(ok?{ok:true,stdout:stdout??''}:{ok:false,stdout:stdout??'',message})};
  const t=setTimeout(()=>{frame.contentWindow?.postMessage({kill:true},'*');finish({ok:false,stdout:'',message:'الكود أخد وقت طويل وتم إيقافه (حلقة لا تنتهي؟).'})},timeoutMs);
  addEventListener('message',on);frame.onload=()=>frame.contentWindow.postMessage({id,code},'*');doc.body.append(frame);
 });
}
