// Admin SDK only. Clients must not have direct writes to studioEvidence.
export function studioFirestoreStore(db,serverTimestamp){
 const ref=(uid,key)=>db.collection('users').doc(uid).collection('studioEvidence').doc(key);
 return {
  async read(uid,key){const s=await ref(uid,key).get();return s.exists?s.data():null},
  async compareAndSet(uid,key,expectedRevision,evidence){
   if(evidence.uid!==uid)throw new Error('Evidence owner mismatch');
   return db.runTransaction(async tx=>{const target=ref(uid,key),s=await tx.get(target),old=s.exists?s.data():null;
    if((old?.revision??0)!==expectedRevision)return false;
    if(old&&(old.uid!==uid||old.curriculumVersion!==evidence.curriculumVersion||old.lessonId!==evidence.lessonId))throw new Error('Evidence identity changed');
    tx.set(target,{...evidence,updatedAt:serverTimestamp()});return true;
   });
  }
 };
}
