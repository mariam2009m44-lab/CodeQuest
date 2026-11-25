export async function firebaseProgress(user){
 const {auth,functions}=await import('/js/firebase-config.js');
 const {httpsCallable}=await import('https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js');
 const submit=httpsCallable(functions,'submitStudioEvidence',{timeout:125000}),read=httpsCallable(functions,'getStudioEvidence',{timeout:30000});
 return{uid:user.uid,currentUid:()=>auth.currentUser?.uid,submit:async data=>(await submit(data)).data,read:async data=>(await read(data)).data};
}
