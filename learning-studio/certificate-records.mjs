// Adapter for the learner's own issued certificates. The only accepted source is a server-recorded
// track completion for the signed-in account. No such source exists yet, so this returns an empty
// list. It must never derive eligibility from local progress or return other learners' records.
export const CERT_SOURCE=null;
const TRACKS=['python','javascript','cpp','java'];
export function normalizeRecords(raw){
 if(!Array.isArray(raw))return [];
 return raw.filter(r=>r&&TRACKS.includes(r.language)&&r.certId&&!Number.isNaN(Date.parse(r.completedAt))&&r.serverRecorded===true)
  .map(r=>({language:r.language,certId:String(r.certId),issuedAt:r.completedAt}));
}
export async function listMyCertificates(source=CERT_SOURCE){
 if(typeof source!=='function')return [];
 try{return normalizeRecords(await source())}catch{return []}
}
