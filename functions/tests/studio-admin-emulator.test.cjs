const{test}=require('node:test'),assert=require('node:assert/strict');
test('Admin transactions isolate accounts and concurrent duplicate requests in actual emulator',{skip:!process.env.FIRESTORE_EMULATOR_HOST},async()=>{
 const{initializeApp,deleteApp}=require('firebase-admin/app'),{getFirestore,FieldValue}=require('firebase-admin/firestore');
 const app=initializeApp({projectId:'demo-codequest-audit'},'studio-admin-'+process.pid),db=getFirestore(app);
 try{const{studioFirestoreStore}=await import('../studio-firestore-store.mjs'),{studioProgressService}=await import('../studio-progress-service.mjs'),{curriculumVersion}=await import('../studio-verification.mjs');
 const uid='studio-admin-'+process.pid+'-'+Date.now(),store=studioFirestoreStore(db,()=>FieldValue.serverTimestamp()),service=studioProgressService({store,execute:async()=>({ok:true,stdout:'Hello\n'})});
 const legacy=db.doc('users/'+uid+'/lessonProgress/python_0_0');await legacy.set({completed:true,marker:'unchanged'});
 const request={lessonId:'py-1-1',curriculumVersion,phase:'prediction',revision:0,answer:0};const results=await Promise.all([service.submit(uid,request),service.submit(uid,request)]);assert(results.every(r=>r.accepted));assert.equal((await service.read(uid,'py-1-1')).revision,1);assert.equal((await service.read(uid+'-other','py-1-1')).revision,0);assert.deepEqual((await legacy.get()).data(),{completed:true,marker:'unchanged'});
 const evidence=await db.collection('users').doc(uid).collection('studioEvidence').get();assert.equal(evidence.size,1);assert.equal(evidence.docs[0].data().completed,false);assert(!Object.hasOwn(evidence.docs[0].data(),'code'));
 await Promise.all([legacy.delete(),...evidence.docs.map(d=>d.ref.delete())]);
 }finally{await deleteApp(app)}
});
