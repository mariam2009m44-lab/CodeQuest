const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const extract=(file,start,end,name)=>{const s=fs.readFileSync(file,'utf8'),ctx={};vm.runInNewContext(s.slice(s.indexOf(start),s.indexOf(end,s.indexOf(start)))+`;this.data=${name}`,ctx);return JSON.parse(JSON.stringify(ctx.data));};
const puzzles=extract('game-build.html','const puzzles =','let seq =','puzzles');
for(const [level,p]of Object.entries(puzzles)){
 const code=p.correct.join('\n'),r=spawnSync('python3',['-I','-c',code],{encoding:'utf8',timeout:3000});assert.equal(r.status,0,level+': '+r.stderr);
 const expected={easy:'Hello\n5\n',medium:'Hello Cody\n',hard:'Cody\n'}[level];assert.equal(r.stdout,expected,level);console.log('runnable build '+level+' => '+JSON.stringify(r.stdout));
}
const bugs=extract('game-bug.html','const levels =','let ended =','levels');
const easy=bugs.easy.lines.join('\n').replace('return reslt','return result');assert.equal(spawnSync('python3',['-I','-c',easy],{encoding:'utf8'}).stdout,'8\n');
const medium=bugs.medium.lines.join('\n').replace('let sum = x + y;','let sum = x + Number(y);');let logs=[];vm.runInNewContext(medium,{console:{log:x=>logs.push(x)}});assert.deepEqual(logs,[15]);
const hard=bugs.hard.lines.join('\n').replace('i <= arr.length','i < arr.length');const ctx={};vm.runInNewContext(hard+';this.answers=[findMax([-9,-2,-5]),findMax([1,5,3])]',ctx);assert.equal(JSON.stringify(ctx.answers),'[-2,5]');
const qs=extract('game-quiz.html','const questionBank =','let currentQs =','questionBank');for(const group of Object.values(qs))for(const q of group){assert.ok(q.a>=0&&q.a<q.opts.length);assert.ok(!q.opts.includes('for i in range():'));}
assert.equal(qs.medium.find(q=>q.q.includes('main()')).a,1);assert.ok(qs.hard.find(q=>q.q.includes('Closure')).opts[0].includes('نطاقها الخارجي'));
console.log('bug repairs execute correctly; quiz answer indices and corrected concepts checked');
