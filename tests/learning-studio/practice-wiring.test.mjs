import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {practiceBankHash,practicePayload} from '../../learning-studio/progress-api.mjs';
const units=JSON.parse(fs.readFileSync(new URL('../../learning-studio/units.json',import.meta.url),'utf8'));
const idx=JSON.parse(fs.readFileSync(new URL('../../cloudflare-worker/practice-index.json',import.meta.url),'utf8'));
test('client practice bank hash equals the server index hash for every practice and transfer task in all 4 tracks',()=>{
 let n=0;for(const u of units)for(const l of u.lessons)for(const ph of ['practice','transfer']){const e=idx[l.id]?.[ph];if(!e)continue;assert.equal(practiceBankHash(u.language,l,ph),e.h,l.id+':'+ph);n++}
 assert.equal(n,238);
});
test('payload carries only task identity, bank hash and code; empty code or wrong phase is refused',()=>{
 const u=units[0],l=u.lessons[0];const p=practicePayload({language:u.language,lesson:l,phase:'practice',code:'print(1)',version:'v1'});
 assert.deepEqual(Object.keys(p).sort(),['bank','code','language','lessonId','phase','version']);
 assert.equal(practicePayload({language:u.language,lesson:l,phase:'practice',code:' '}),null);assert.equal(practicePayload({language:u.language,lesson:l,phase:'worked',code:'x'}),null);
});
test('ui wiring is flag-gated and runs only after a passed practice/transfer run',()=>{
 const ui=fs.readFileSync(new URL('../../learning-studio/ui.mjs',import.meta.url),'utf8');
 assert.match(ui,/features\.serverAssessment!==true\|\|!window\.studioAccountUser\)return/);assert.match(ui,/if\(result\.ok&&\(submittedPhase==='practice'\|\|submittedPhase==='transfer'\)\)sendPractice/);
});
