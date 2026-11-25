// Authenticated fetch for GET /api/certificates. Used only when the endpoint flag is enabled.
// The uid is never sent; the server takes it from the verified ID token.
import {certificatesUrl,CERT_API_BASE} from './certificate-config.mjs';
export function makeCertificateFetcher(getUser,{fetchImpl=(...a)=>fetch(...a),base=CERT_API_BASE}={}){
 return async()=>{
  const url=certificatesUrl(base);if(!url)throw new Error('endpoint-not-configured'); // config error is an error state, never an empty list
  const user=getUser();if(!user)throw new Error('signed-out');
  const token=await user.getIdToken();
  const res=await fetchImpl(url,{headers:{Authorization:'Bearer '+token},cache:'no-store',credentials:'omit'});
  if(!res.ok)throw new Error('http-'+res.status);
  return res.json();
 };
}
