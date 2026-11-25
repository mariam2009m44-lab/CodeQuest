// Single endpoint configuration for GET /certificates. The API lives on the Cloudflare Worker origin, not the
// static site origin, so a relative URL would 404. Base reused from the existing Worker already used by
// resume sync and the code runner (learning-studio/ui.mjs, js/code-runner.js). The backend owner confirms the
// exact base and path when the endpoint is built; the feature stays disabled (CERT_ENDPOINT_ENABLED=false).
export const CERT_API_BASE='https://codequest.mariam2009m44.workers.dev';
export const CERT_API_PATH='/api/certificates';
// Returns a validated absolute https URL, or null when unconfigured or invalid (never a relative or http URL).
export function certificatesUrl(base=CERT_API_BASE,path=CERT_API_PATH){
 try{const u=new URL(base);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/')return null;
  if(typeof path!=='string'||!path.startsWith('/api/'))return null;return u.origin+path}catch{return null}
}
