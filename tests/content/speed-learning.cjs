const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('js/speed-learning-bank.js','utf8'),ctx);const bank=ctx.window.CQSpeedBank;
assert.equal(bank.length,24);for(const level of ['easy','medium','hard'])assert.equal(bank.filter(q=>q.level===level).length,8);
for(const q of bank){const p=spawnSync('python3',['-I','-c',q.code],{encoding:'utf8',timeout:2000});assert.equal(p.status,0,q.id);assert.equal(p.stdout.trim(),q.output,q.id);assert.equal(q.a,q.output===q.claim,q.id);assert.ok(q.explain.length>30)}
const html=fs.readFileSync('game-match.html','utf8'),start=html.indexOf('    const lessons = ['),end=html.indexOf('    let lessonIndex',start),out={};vm.runInNewContext(html.slice(start,end)+';this.lessons=lessons',out);
for(const lesson of out.lessons){const logs=[];vm.runInNewContext(lesson.pieces.join('\n'),{console:{log:x=>logs.push(String(x))}},{timeout:1000});assert.equal(logs.join('\n'),lesson.output,lesson.title)}
console.log('24 Python speed snippets and 4 JavaScript puzzle solutions execute with exact claimed outputs');
