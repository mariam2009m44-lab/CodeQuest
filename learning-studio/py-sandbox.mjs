// Runs the learner's Python in the learner's own browser with Pyodide, so it never uses the shared server quota.
// Same isolation as js-sandbox.mjs: a sandboxed iframe (opaque origin: no cookies, storage or account access,
// CSP connect-src 'none') hosts a Worker. Pyodide files are served from this site and handed to the Worker as
// bytes by the parent; inside the sandbox fetch and importScripts only serve those in-memory files, so the
// learner's code has no network path. A run longer than the limit kills the whole frame.
const FILES=[['pyodide.js','text/javascript'],['pyodide.asm.js','text/javascript'],['pyodide.asm.wasm','application/wasm'],['python_stdlib.zip','application/zip'],['pyodide-lock.json','application/json']];
const WORKER_SOURCE=`
let py=null,B=new Map(),U=new Map();
const base=u=>String(u&&u.url||u).split('?')[0].split('/').pop();
const realImport=self.importScripts.bind(self);
self.importScripts=(...a)=>realImport(...a.map(x=>U.get(base(x))||x));
self.fetch=async u=>{const n=base(u);if(!B.has(n))throw new TypeError('network disabled');const [buf,type]=B.get(n);return new Response(buf.slice(0),{status:200,headers:{'content-type':type}})};
const dec=new TextDecoder();
onmessage=async e=>{const d=e.data;
 if(d.files){try{for(const [n,buf,type] of d.files){B.set(n,[buf,type]);U.set(n,URL.createObjectURL(new Blob([buf],{type})))}
  realImport(U.get('pyodide.js'));py=await loadPyodide({indexURL:'https://pyodide.invalid/'});postMessage({ready:true})}catch(err){postMessage({ready:false,message:String(err&&err.message||err)})}return}
 let out='',err='';
 const lines=(d.stdin||'').split('\\n');let li=0;
 try{
  py.setStdout({write:b=>{out+=dec.decode(b,{stream:true});if(out.length>100000)throw new Error('الناتج كبير جدًا.');return b.length}});
  py.setStderr({write:b=>{err+=dec.decode(b,{stream:true});return b.length}});
  py.setStdin({stdin:()=>li<lines.length&&!(li===lines.length-1&&lines[li]==='')?lines[li++]:undefined});
  const g=py.globals.get('dict')();
  try{await py.runPythonAsync(d.code,{globals:g})}finally{g.destroy()}
  postMessage({id:d.id,ok:true,stdout:out})
 }catch(ex){const m=String(ex&&ex.message||ex);postMessage({id:d.id,ok:false,stdout:out,message:m.replace(/^Traceback[\\s\\S]*?(?=\\n[A-Za-z]*Error|\\n[A-Za-z]*Exception|$)/,'').trim()||m})}
};
`;
const FRAME=`<!doctype html><meta charset=utf-8><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'"><script>
const src=${JSON.stringify(WORKER_SOURCE)};let w;
onmessage=e=>{const d=e.data;
 if(d.files){try{w=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})))}catch(err){parent.postMessage({ready:false,message:'المتصفح منع تشغيل الكود هنا.'},'*');return}
  w.onmessage=m=>parent.postMessage(m.data,'*');w.onerror=m=>parent.postMessage({ready:false,message:String(m.message||'Error')},'*');w.postMessage({files:d.files},d.files.map(f=>f[1]).filter(b=>b.byteLength));return}
 w&&w.postMessage(d)};
<\/script>`;
let frame=null,readyP=null,counter=0,queue=Promise.resolve();
const kill=()=>{if(frame){frame.remove();frame=null}readyP=null};
async function ensure(base,doc){
 if(readyP)return readyP;
 readyP=(async()=>{
  const files=await Promise.all(FILES.map(async([n,t])=>{const r=await fetch(base+n,{credentials:'omit'});if(!r.ok)throw new Error('تعذر تحميل مشغّل Python.');return [n,await r.arrayBuffer(),t]}));
  const f=doc.createElement('iframe');f.setAttribute('sandbox','allow-scripts');f.hidden=true;f.srcdoc=FRAME;frame=f;
  await new Promise((res,rej)=>{const to=setTimeout(()=>{removeEventListener('message',on);rej(new Error('تحميل مشغّل Python أخد وقت طويل.'))},90000);
   const on=e=>{if(e.source!==f.contentWindow||!('ready' in (e.data||{})))return;clearTimeout(to);removeEventListener('message',on);e.data.ready?res():rej(new Error(e.data.message||'تعذر تشغيل Python.'))};
   addEventListener('message',on);f.onload=()=>f.contentWindow.postMessage({files},'*',files.map(x=>x[1]));doc.body.append(f)});
 })().catch(e=>{kill();throw e});
 return readyP;
}
export function runPython(code,{stdin='',timeoutMs=4000,doc=globalThis.document,base='/learning-studio/pyodide/'}={}){
 if(typeof code!=='string'||code.length>50000)return Promise.resolve({ok:false,stdout:'',message:'الكود غير صالح أو طويل جدًا.'});
 const job=queue.then(async()=>{
  try{await ensure(base,doc)}catch(e){return {ok:false,stdout:'',message:String(e.message||e),errorCode:'runner-unavailable'}}
  const id=++counter,f=frame;
  return new Promise(resolve=>{
   let done=false;const finish=r=>{if(done)return;done=true;clearTimeout(t);removeEventListener('message',on);resolve(r)};
   const on=e=>{if(e.source!==f.contentWindow||e.data?.id!==id)return;const {ok,stdout,message}=e.data;finish(ok?{ok:true,stdout:stdout??''}:{ok:false,stdout:stdout??'',message})};
   const t=setTimeout(()=>{kill();finish({ok:false,stdout:'',message:'الكود أخد وقت طويل وتم إيقافه (حلقة لا تنتهي؟).'})},timeoutMs);
   addEventListener('message',on);f.contentWindow.postMessage({id,code,stdin},'*');
  });
 });
 queue=job.catch(()=>{});return job;
}
