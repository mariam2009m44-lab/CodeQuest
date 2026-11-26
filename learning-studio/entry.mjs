// Reuse existing account. No new authentication project or reward writes.
const local=location.hostname==='localhost'||location.hostname==='127.0.0.1';
const showLoadError=()=>{const status=document.getElementById('stageLabel');if(status)status.textContent='تعذر تحميل الدرس. حدّث الصفحة وحاول تاني.';};
async function enter(){
 if(!local){
  try{
   const {requireUser}=await import('/js/auth.js');const user=await requireUser();
   if(!user?.uid)throw new Error('sign-in required');
   const {auth}=await import('/js/firebase-config.js');
   const {onAuthStateChanged}=await import('https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js');
   window.studioAccountUser=user;const uid=user.uid;onAuthStateChanged(auth,current=>{if(current?.uid){if(current.uid!==uid)location.reload();return}setTimeout(()=>{if(!auth.currentUser?.uid)location.replace('/login.html?'+new URLSearchParams({next:'learning.html'+location.search}))},2500)});
  }catch{location.replace('/login.html?'+new URLSearchParams({next:'learning.html'+location.search}));return}
 }
 try{await import('./ui.mjs')}catch{showLoadError()}
}
enter();
