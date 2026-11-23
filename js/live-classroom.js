import { auth, db, functions, authPersistenceReady } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";
import { doc, onSnapshot, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const status=document.getElementById("roomStatus");
const syncStatus=document.getElementById("workspaceSync");
const editorHost=document.getElementById("sharedCodeEditor");
const languageSelect=document.getElementById("workspaceLanguage");
const params=new URLSearchParams(location.search);
const classId=params.get("classId");
let requested=false;
let editor=null;
let stopWorkspace=null;
let saveTimer=null;
let currentUser=null;
let isInstructor=false;
let applyingRemote=false;
let pendingLocalEdit=false;

function setStatus(message,error=false){status.textContent=message;status.style.color=error?"#fca5a5":"#aab0bd";}
function setSync(message,state=""){syncStatus.textContent=message;syncStatus.dataset.state=state;}
function editorMode(language){
  return language==="python"?"python":language==="javascript"?"javascript":"text/x-java";
}
function initializeEditor(){
  if(!window.CodeMirror)throw new Error("محرر الأكواد لم يتم تحميله.");
  editor=window.CodeMirror.fromTextArea(editorHost,{
    mode:"python",theme:"material-darker",lineNumbers:true,indentUnit:4,tabSize:4,
    lineWrapping:true,autocorrect:false,spellcheck:false,viewportMargin:Infinity
  });
  editor.setSize("100%","360px");
  editor.on("change",()=>{
    if(applyingRemote||!currentUser)return;
    pendingLocalEdit=true;
    setSync("توجد تعديلات — جارٍ المزامنة…");
    clearTimeout(saveTimer);
    saveTimer=setTimeout(saveSharedCode,450);
  });
  languageSelect.addEventListener("change",saveLanguage);
}
async function saveSharedCode(){
  if(!editor||!currentUser)return;
  const content=editor.getValue();
  const language=languageSelect.value;
  try{
    const workspaceRef=doc(db,"liveClasses",classId,"workspace","shared");
    await setDoc(workspaceRef,{code:content,language,updatedBy:currentUser.uid,updatedAt:serverTimestamp()},{merge:true});
    pendingLocalEdit=false;
    setSync("تمت مزامنة الكود مع الفصل","ok");
  }catch(error){
    pendingLocalEdit=false;
    setSync(error?.message||"تعذرت مزامنة الكود. تحققي من اتصالك وصلاحية التسجيل.","error");
  }
}
async function saveLanguage(){
  if(!isInstructor){languageSelect.value=editor?.getOption("mode")==="python"?"python":languageSelect.value;return;}
  if(!currentUser)return;
  try{
    await setDoc(doc(db,"liveClasses",classId,"workspace","shared"),{
      language:languageSelect.value,updatedBy:currentUser.uid,updatedAt:serverTimestamp()
    },{merge:true});
    editor.setOption("mode",editorMode(languageSelect.value));
    setSync("تم تحديث لغة الفصل","ok");
  }catch(error){setSync(error?.message||"تعذر تغيير لغة الفصل.","error");}
}
function connectWorkspace(){
  initializeEditor();
  languageSelect.disabled=!isInstructor;
  const workspaceRef=doc(db,"liveClasses",classId,"workspace","shared");
  stopWorkspace=onSnapshot(workspaceRef,snapshot=>{
    if(!snapshot.exists()){
      setSync("لم يتم تجهيز مساحة الأكواد لهذا الفصل.","error");
      editor.setOption("readOnly",true);
      return;
    }
    const data=snapshot.data();
    const language=["python","javascript","cpp","java"].includes(data.language)?data.language:"python";
    languageSelect.value=language;
    editor.setOption("mode",editorMode(language));
    if(!pendingLocalEdit&&editor.getValue()!==String(data.code||"")){
      applyingRemote=true;
      editor.setValue(String(data.code||""));
      applyingRemote=false;
    }
    if(!pendingLocalEdit)setSync("متصل — يتم استقبال تعديلات المشاركين مباشرة","ok");
    editor.setOption("readOnly",false);
  },error=>{
    setSync(error?.message||"لا تملك صلاحية الوصول إلى مساحة الأكواد.","error");
    editor.setOption("readOnly",true);
  });
}
await authPersistenceReady;
onAuthStateChanged(auth,async user=>{
 if(requested)return;
 if(!user){setStatus("سجّلي الدخول أولًا للانضمام إلى الفصل.",true);return;}
 if(!classId){setStatus("رابط الفصل غير مكتمل.",true);return;}
 requested=true;currentUser=user;
 try{
  const token=await user.getIdTokenResult();
  isInstructor=token.claims.liveRole==="instructor"&&token.claims.liveInstructorApproved===true;
  const join=httpsCallable(functions,"joinLiveClass");
  const response=await join({classId});
  const authToken=response.data?.authToken;
  if(!authToken)throw new Error("لم يصل رمز الانضمام من الخادم.");
  await customElements.whenDefined("rtk-meeting");
  if(!window.RealtimeKitClient?.init)throw new Error("مكوّن الاتصال المباشر لم يتم تحميله.");
  const meeting=await window.RealtimeKitClient.init({authToken});
  document.getElementById("classroom").meeting=meeting;
  setStatus("تم التحقق من تسجيلك. يمكنك الانضمام إلى الجلسة واستخدام محرر الأكواد المشترك.");
  connectWorkspace();
 }catch(error){
  setStatus(error?.message||"تعذر الانضمام إلى الفصل. تحققي من التسجيل وموعد الجلسة.",true);
  setSync("مساحة الأكواد غير متاحة قبل التحقق من الفصل.","error");
 }
});
window.addEventListener("beforeunload",()=>{if(stopWorkspace)stopWorkspace();clearTimeout(saveTimer);});
