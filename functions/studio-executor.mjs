// Isolated compiler service. Never executes learner code in this Node process.
const languages=Object.freeze({javascript:63,python:71,cpp:54,java:62});
export function isolatedExecutor({baseUrl,fetchImpl=fetch,sleep=ms=>new Promise(r=>setTimeout(r,ms))}){
 const base=new URL(baseUrl);if(base.protocol!=='https:')throw new TypeError('HTTPS execution service required');
 const json=async(url,options,deadline)=>{const response=await fetchImpl(url,{...options,signal:AbortSignal.timeout(Math.max(1,Math.min(10000,deadline-Date.now())))});if(!response.ok)throw new Error('Execution service unavailable');const data=await response.json();if(!data||typeof data!=='object')throw new Error('Invalid execution response');return data};
 return async(language,code,stdin='')=>{
  if(!Object.hasOwn(languages,language)||typeof code!=='string'||!code.trim()||code.length>15000||typeof stdin!=='string'||stdin.length>10000)throw new TypeError('Invalid execution input');
  const deadline=Date.now()+20000;
  const created=await json(new URL('/submissions?base64_encoded=false&wait=false',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source_code:code,language_id:languages[language],stdin,cpu_time_limit:2,wall_time_limit:5,memory_limit:128000,max_file_size:64,enable_network:false})},deadline);
  if(typeof created.token!=='string'||!created.token||created.token.length>200)throw new Error('Missing execution token');
  for(let attempt=0;attempt<8;attempt++){
   if(Date.now()>=deadline)throw new Error('Execution deadline exceeded');await sleep(750);const result=await json(new URL('/submissions/'+encodeURIComponent(created.token)+'?base64_encoded=false',base),{method:'GET',headers:{Accept:'application/json'}},deadline);
   if(!Number.isInteger(result.status?.id))throw new Error('Invalid execution status');
   if(result.status.id<=2)continue;
   if(result.status.id===13)throw new Error('Execution service internal error');
   if(result.status.id!==3)return {ok:false,stdout:''};
   const stdout=result.stdout??'';if(typeof stdout!=='string'||stdout.length>64000)throw new Error('Execution output limit');return {ok:true,stdout};
  }
  throw new Error('Execution deadline exceeded');
 };
}
