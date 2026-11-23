const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, getDocs, collection, setDoc, serverTimestamp } = require('firebase/firestore');

const host = process.env.FIRESTORE_EMULATOR_HOST;

test('student profile and lesson progress require the correct account and server quiz evidence', { skip: !host }, async t => {
  assert.match(host, /^(127\.0\.0\.1|localhost):\d+$/);
  const env = await initializeTestEnvironment({
    projectId: 'demo-codequest-audit',
    firestore: { rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8') }
  });
  t.after(() => env.cleanup());

  const uid = `student-rules-${process.pid}-${Date.now()}`;
  const studentDb = env.authenticatedContext(uid).firestore();
  const otherDb = env.authenticatedContext(`${uid}-other`).firestore();
  const profilePath = `users/${uid}`;
  const lessonPath = `${profilePath}/lessonProgress/python_0_0`;
  const profile = {
    uid, displayName: 'طالبة تجريبية', email: 'student@example.test',
    xp: 0, stars: 0, coins: 0, level: 1, streak: 0,
    completedLessons: 0, completedProjects: 0,
    languageProgress: { python: 0, javascript: 0, cpp: 0, java: 0 },
    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
  };
  await assertSucceeds(setDoc(doc(studentDb, profilePath), profile));
  await assertSucceeds(getDoc(doc(studentDb, profilePath)));
  await assertFails(getDoc(doc(otherDb, profilePath)));

  const progress = { language: 'python', chapter: 0, lesson: 0, completed: true, updatedAt: serverTimestamp() };
  await assertFails(setDoc(doc(studentDb, lessonPath), progress));
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), `${profilePath}/quizResults/lesson_python_0_0`), {
      uid, language: 'python', chapter: 0, lesson: 0,
      verificationVersion: 1, serverVerified: true, passed: true
    });
  });
  await assertSucceeds(setDoc(doc(studentDb, lessonPath), progress));
  assert.equal((await assertSucceeds(getDoc(doc(studentDb, lessonPath)))).data().completed, true);
  await assertFails(getDoc(doc(otherDb, lessonPath)));
});


test('Live Academy protects class writes, private meeting data, and enrollment lists', { skip: !host }, async t => {
  assert.match(host, /^(127\.0\.0\.1|localhost):\d+$/);
  const env = await initializeTestEnvironment({
    projectId: 'demo-codequest-audit',
    firestore: { rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8') }
  });
  t.after(() => env.cleanup());

  const classId = 'live-class-rules-001';
  const classPath = `liveClasses/${classId}`;
  const ownerUid = `instructor-${process.pid}-${Date.now()}`;
  const studentUid = `student-${process.pid}-${Date.now()}`;
  const otherUid = `other-${process.pid}-${Date.now()}`;

  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, classPath), {
      title: 'Python Foundations',
      status: 'scheduled',
      instructorUid: ownerUid,
      startsAt: new Date(Date.now() + 60 * 60 * 1000),
      enrollmentCount: 1
    });
    await setDoc(doc(db, `liveClassPrivate/${classId}`), {
      providerMeetingId: 'private-provider-id'
    });
    await setDoc(doc(db, `${classPath}/enrollments/${studentUid}`), {
      uid: studentUid,
      status: 'enrolled'
    });
  });

  const studentDb = env.authenticatedContext(studentUid).firestore();
  const otherDb = env.authenticatedContext(otherUid).firestore();
  const instructorDb = env.authenticatedContext(ownerUid, {
    liveRole: 'instructor',
    liveInstructorApproved: true
  }).firestore();
  const outsiderInstructorDb = env.authenticatedContext(otherUid, {
    liveRole: 'instructor',
    liveInstructorApproved: true
  }).firestore();

  await assertSucceeds(getDoc(doc(studentDb, classPath)));
  await assertFails(getDoc(doc(studentDb, `liveClassPrivate/${classId}`)));
  await assertFails(setDoc(doc(studentDb, classPath), {
    title: 'Unauthorized class',
    status: 'live',
    instructorUid: studentUid
  }));
  await assertSucceeds(getDoc(doc(studentDb, `${classPath}/enrollments/${studentUid}`)));
  await assertFails(getDoc(doc(otherDb, `${classPath}/enrollments/${studentUid}`)));
  await assertFails(setDoc(doc(studentDb, `${classPath}/enrollments/${otherUid}`), {
    uid: otherUid,
    status: 'enrolled'
  }));
  await assertSucceeds(getDocs(collection(instructorDb, `${classPath}/enrollments`)));
  await assertFails(getDocs(collection(outsiderInstructorDb, `${classPath}/enrollments`)));
});
