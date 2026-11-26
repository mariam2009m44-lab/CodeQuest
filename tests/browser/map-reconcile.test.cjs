const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
(async()=>{const srv=http.createServer((q,s)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]));try{s.writeHead(200,{'content-type':types[path.extname(f)]||'text/plain'});s.end(fs.readFileSync(f))}catch{s.writeHead(404);s.end('')}});
await new Promise(r=>srv.listen(0,r));const L='http://localhost:'+srv.address().port;const b=await chromium.launch();
try{
 async function nodes(uid,seed){const c=await b.newContext({viewport:{width:390,height:900}});await c.route(/^https?:\/\/(?!localhost)/,r=>r.abort());
  await c.route('**/js/auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const requireUser=async()=>({uid:${JSON.stringify(uid)}});export const getLessonProgress=async()=>[];export const getUserProfile=async()=>({xp:0,stars:0});export const logoutUser=async()=>{};export const onUserChange=()=>{};export const getCurrentUser=()=>({uid:${JSON.stringify(uid)}});`}));
  const p=await c.newPage();await p.goto(L+'/learning-studio/index.html');await p.evaluate(s=>{for(const [k,v] of Object.entries(s))localStorage.setItem(k,v)},seed);
  await p.goto(L+'/course-path.html?lang=python');await p.waitForSelector('.cw-road-node',{timeout:8000});
  const r=await p.evaluate(()=>[...document.querySelectorAll('.cw-road-node')].slice(0,4).map(n=>n.classList.contains('is-done')?'done':n.classList.contains('is-current')?'current':'other'));await c.close();return r}
 const pass=JSON.stringify({passed:true,score:4,total:4});
 const withPass=await nodes('u1',{'codequest_studio_lessontest_u1_python_py-1-1':pass,'codequest_studio_lessontest_u1_python_py-1-2':pass});
 assert.deepEqual(withPass.slice(0,3),['done','done','current'],'passed lesson tests mark their map nodes: '+JSON.stringify(withPass));
 const other=await nodes('u2',{'codequest_studio_lessontest_u1_python_py-1-1':pass});
 assert.equal(other[0],'current','another account\'s results never mark this account');
 const failed=await nodes('u1',{'codequest_studio_lessontest_u1_python_py-1-1':JSON.stringify({passed:false})});
 assert.equal(failed[0],'current','a failed test does not mark the node');
 // id-less node must not match an id-less record, and an id-less record with chapter/lesson only marks its own node
 const idless=await nodes('u1',{'codequest_lesson_progress_u1_python':JSON.stringify([{completed:true,chapter:0,lesson:0}])});
 assert.deepEqual(idless.slice(0,3),['done','current','other'],'chapter/lesson record marks only its own node: '+JSON.stringify(idless));
 const noMatch=await nodes('u1',{'codequest_lesson_progress_u1_python':JSON.stringify([{completed:true}])});
 assert.equal(noMatch[0],'current','a record with no id and no position marks nothing: '+JSON.stringify(noMatch));
 console.log('map reconcile ok');
}finally{await b.close();srv.close()}})().catch(e=>{console.error(e);process.exit(1)});
