import {loadMyCertificates,renderCertificates,latestOnly} from './certificate-records.mjs';
// Wires the profile certificates section to the trusted adapter. deps.enabled is false until the backend exists.
export function initProfileCertificates({doc=document,deps}){
 const list=doc.getElementById('certsList'),empty=doc.getElementById('certsEmpty'),guard=latestOnly();
 async function refresh(){
  const t=guard.begin();const r=await loadMyCertificates(deps);
  if(guard.isCurrent(t))renderCertificates(doc,list,empty,r);
  return r.state;
 }
 return {refresh};
}
