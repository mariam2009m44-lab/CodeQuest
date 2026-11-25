// Device-local, account-bound opt-in for the lesson-test server pilot. Default OFF. It changes nothing for other accounts and does not touch global flags.
// The Worker still decides: a write is accepted only for an account on its pilot allowlist (PROGRESS_PILOT_UIDS), and only for the lesson-test route.
export const PILOT_KEY='cq_server_pilot';
export function pilotActive(uid,storage){if(!uid)return false;try{const p=JSON.parse(storage.getItem(PILOT_KEY)||'null');return !!p&&p.uid===uid&&p.on===true}catch{return false}}
export function setPilot(uid,on,storage){if(!uid)return false;if(on)storage.setItem(PILOT_KEY,JSON.stringify({uid,on:true,at:Date.now()}));else storage.removeItem(PILOT_KEY);return true}
export function clearPilot(storage){try{storage.removeItem(PILOT_KEY)}catch{}}
