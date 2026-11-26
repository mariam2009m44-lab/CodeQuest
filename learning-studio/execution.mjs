// Production adapter reuses the application's authenticated, isolated server runner.
// It never downgrades to emulated output when the compiler is unavailable.
export function compilerAdapter(language,runCodeOnServer){
 if(!['python','javascript','cpp','java'].includes(language)||typeof runCodeOnServer!=='function')throw new TypeError('compiler adapter');
 return async(code,stdin='')=>{
  const result=await runCodeOnServer(language,code,stdin);
  if(result?.ok!==true){const message=[result?.compileOutput,result?.stderr,result?.message,result?.status].filter(Boolean).join('\n')||'لم يكتمل تشغيل الكود.';return {ok:false,stdout:result?.stdout??'',message,errorCode:result?.errorCode,student:!result?.errorCode&&(Boolean(result?.compileOutput||result?.stderr)||(Number(result?.statusId)>=5&&Number(result?.statusId)<=12))}}
  if(typeof result.stdout!=='string')throw new Error('لم يصل ناتج نصي صحيح من خدمة التنفيذ.');
  return {ok:true,stdout:result.stdout};
 };
}
export async function selectExecutor(language){
 // JavaScript runs in the learner's browser sandbox: no server quota, no external service.
 if(language==='javascript'&&typeof document!=='undefined'&&!new URLSearchParams(location.search).has('serverjs')){const {runJavaScript}=await import('./js-sandbox.mjs');return async(code)=>{const r=await runJavaScript(code);return r.ok?{ok:true,stdout:r.stdout}:{ok:false,stdout:r.stdout,message:r.message,student:!/المتصفح منع/.test(r.message||'')}}}
 if(location.hostname==='localhost'||location.hostname==='127.0.0.1'){
  // The development endpoint exists only in the local verification server.
  // Never include a process-execution server in a hosted static page.
  return compilerAdapter(language,async(lang,code,stdin)=>{const c=new AbortController(),timer=setTimeout(()=>c.abort(),12000);try{const response=await fetch('/__local_verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:lang,code,stdin}),signal:c.signal});if(!response.ok)throw new Error('خدمة المراجعة المحلية غير متاحة');return await response.json()}finally{clearTimeout(timer)}});
 }
 const {runCodeOnServer}=await import('/js/code-runner.js');return compilerAdapter(language,runCodeOnServer);
}
