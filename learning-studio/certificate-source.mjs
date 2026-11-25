// Authenticated fetch for GET /api/certificates. Used only when the endpoint flag is enabled.
// The uid is never sent; the server takes it from the verified ID token.
export function makeCertificateFetcher(getUser,fetchImpl=(...a)=>fetch(...a)){
 return async()=>{
  const user=getUser();if(!user)throw new Error('signed-out');
  const token=await user.getIdToken();
  const res=await fetchImpl('/api/certificates',{headers:{Authorization:'Bearer '+token},cache:'no-store',credentials:'omit'});
  if(!res.ok)throw new Error('http-'+res.status);
  return res.json();
 };
}
