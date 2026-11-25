import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {checkIntroConcept} from '../../learning-studio/concept.mjs';import {runIntro} from '../../learning-studio/intro-runner.mjs';
const packs=JSON.parse(fs.readFileSync(new URL('../../learning-studio/units.json',import.meta.url)));
for(const pack of packs)for(const lesson of pack.lessons)for(const phase of ['practice','transfer']){
 const step=lesson.steps.find(s=>s.type===phase),source=step.referenceSolution;
 // Reverse a simple ordered comparison while preserving its meaning.
 const reversed=source.replace(/\b([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\s*(>=|<=|>|<)\s*(\d+)\b/g,(_,name,op,n)=>n+' '+({'>':'<','<':'>','>=':'<=','<=':'>='}[op])+' '+name);
 if(reversed!==source)test(lesson.id+' '+phase+' reversed ordered comparison',()=>{assert.equal(checkIntroConcept({lesson,phase,code:reversed,language:pack.language}).approved,true);for(const c of lesson[phase+'Cases']??[{stdin:'',stdout:step.expectedOutput}])assert.equal(runIntro(reversed,pack.language,c.stdin).stdout.replace(/\n$/,''),c.stdout)});
}
for(const lang of ['python','javascript','cpp','java'])test(lang+' non-equivalent comparison stays rejected',()=>{const pack=packs.find(p=>p.language===lang&&p.lessons.some(l=>l.steps.some(s=>s.type==='practice'&&/\b\w+ >= \d+/.test(s.referenceSolution))));const lesson=pack.lessons.find(l=>l.steps.some(s=>s.type==='practice'&&/\b\w+ >= \d+/.test(s.referenceSolution)));const source=lesson.steps.find(s=>s.type==='practice').referenceSolution;assert.equal(checkIntroConcept({lesson,phase:'practice',language:lang,code:source.replace(/(\b\w+) >= (\d+)/,'$2 >= $1')}).approved,false)});
