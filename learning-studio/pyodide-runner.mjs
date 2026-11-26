// Runs the learner's Python in the learner's own browser (real CPython compiled to WebAssembly, Pyodide), so lessons and quizzes do not depend on the shared server runner.
// The runtime loads from the jsDelivr CDN (about 6 MB, cached by the browser after the first load) inside a Worker that is killed on timeout.
// If the runtime cannot load (offline first visit, blocked CDN, old browser), runPython rejects with code NO_PYODIDE and the caller falls back to the server runner.
export const PYODIDE_BASE='https://cdn.jsdelivr.net/pyodide/v314.0.8/full/';
const WORKER_SOURCE=`
let py,ready;
const boot=async()=>{const {loadPyodide}=await import(${JSON.stringify(PYODIDE_BASE+'pyodide.mjs')});py=await loadPyodide({indexURL:${JSON.stringify(PYODIDE_BASE)}})};
onmessage=async e=>{
 const {id,code,stdin}=e.data;
 try{ready??=boot();await ready}catch(err){postMessage({id,noRuntime:true,message:String(err&&err.message||err)});return}
 postMessage({id,loaded:true});
 let out='';py.setStdout({batched:l=>{out+=l+'\\n';if(out.length>100000)throw new Error('الناتج كبير جدًا.')}});py.setStderr({batched:()=>{}});
 const lines=stdin?String(stdin).split('\\n'):[];let i=0;py.setStdin({stdin:()=>i<lines.length?lines[i++]:undefined});
 let g;try{g=py.globals.get('dict')();await py.runPythonAsync(code,{globals:g});postMessage({id,ok:true,stdout:out})}
 catch(err){const m=String(err&&err.message||err).trim().split('\\n').filter(Boolean);postMessage({id,ok:false,stdout:out,message:m.slice(-1)[0]||'Error'})}
 finally{try{g&&g.destroy()}catch{}}
};`;
let worker=null,counter=0,failedAt=0;const RETRY_MS=5*60*1000;
const noRuntime=why=>{failedAt=Date.now();return Object.assign(new Error('NO_PYODIDE'+(why?': '+why:'')),{code:'NO_PYODIDE'})};
function spawn(){const url=URL.createObjectURL(new Blob([WORKER_SOURCE],{type:'text/javascript'}));const w=new Worker(url,{type:'module'});URL.revokeObjectURL(url);return w}
export function pyodideAvailable(){return Date.now()-failedAt>RETRY_MS&&typeof Worker!=='undefined'&&typeof WebAssembly!=='undefined'&&typeof Blob!=='undefined'}
export function runPython(code,stdin='',{timeoutMs=8000,loadTimeoutMs=60000}={}){
 if(!pyodideAvailable()||typeof code!=='string'||code.length>50000)return Promise.reject(noRuntime());
 return new Promise((resolve,reject)=>{
  const id=++counter;worker??=spawn();const w=worker;let done=false,timer=null;
  const kill=()=>{try{w.terminate()}catch{}if(worker===w)worker=null};
  const finish=(fn,v)=>{if(done)return;done=true;clearTimeout(timer);w.removeEventListener('message',on);w.removeEventListener('error',onErr);fn(v)};
  const onErr=()=>{kill();finish(reject,noRuntime('worker error'))};
  // Two clocks: loading the runtime (a failure falls back to the server runner) and running the program (a hung program is the learner's and is killed).
  const armRun=()=>{clearTimeout(timer);timer=setTimeout(()=>{kill();finish(resolve,{ok:false,stdout:'',message:'الكود أخد وقت طويل وتم إيقافه (حلقة لا تنتهي؟).',student:true})},timeoutMs)};
  const on=e=>{const d=e.data;if(d?.id!==id)return;
   if(d.loaded){armRun();return}
   if(d.noRuntime){kill();finish(reject,noRuntime(d.message));return}
   finish(resolve,d.ok?{ok:true,stdout:d.stdout}:{ok:false,stdout:d.stdout??'',message:d.message,student:true})};
  w.addEventListener('message',on);w.addEventListener('error',onErr);
  timer=setTimeout(()=>{kill();finish(reject,noRuntime('load timeout'))},loadTimeoutMs);
  w.postMessage({id,code,stdin});
 });
}
