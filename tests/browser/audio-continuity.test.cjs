const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright'),fs=require('fs/promises'),path=require('path');const root=path.resolve(__dirname,'../..');
// Same track on the next page continues from the saved position with a very short fade; other track or old position starts at 0 with the normal fade.
async function open(page,saved,musicOn=true){const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const p=await b.newPage();
 await p.route('**/*',async r=>{const u=r.request().url();if(u.endsWith('.ogg'))return r.fulfill({contentType:'audio/ogg',body:await fs.readFile(root+'/assets/audio/'+(u.includes('area-lesson')?'area-lesson.ogg':'orbit-loop.ogg'))});return r.fulfill({contentType:'text/html',body:'<button id="t">x</button>'})});
 await p.goto('http://fixture/'+page);let s=await fs.readFile(root+'/js/game-audio.js','utf8');s=s.replace('function mountControls() {','window.audioTest={get offset(){return playOffset},get playing(){return !!orbitSource},get fade(){return musicBus?.gain.value},get dur(){return playDuration},url:()=>AREA_URL};\n  function mountControls() {');
 await p.evaluate(([m,sv])=>{if(m)localStorage.setItem('cq_music','on');else localStorage.removeItem('cq_music');if(sv)localStorage.setItem('cq_music_pos',JSON.stringify(sv));else localStorage.removeItem('cq_music_pos')},[musicOn,saved?{url:'__URL__',pos:saved.pos,at:Date.now()-saved.agoMs}:null]);
 return {b,p,s}}
async function run(page,saved,musicOn=true){const {b,p,s}=await open(page,null,musicOn);try{
 // learn the url by loading once without start
 await p.addScriptTag({content:s.replace('if(musicEnabled&&!document.hidden)startMusic();','')});const url=await p.evaluate(()=>window.audioTest.url());
 await p.evaluate(([u,sv])=>{if(sv)localStorage.setItem('cq_music_pos',JSON.stringify({url:u,pos:sv.pos,at:Date.now()-sv.agoMs}))},[url,saved]);
 // fresh document, auto-start at load
 await p.goto('http://fixture/'+page);await p.addScriptTag({content:s});await p.waitForTimeout(1200);
 return await p.evaluate(()=>({playing:window.audioTest.playing,offset:window.audioTest.offset,dur:window.audioTest.dur}))}finally{await b.close()}}
test('same track, recent: continues from saved position and starts at load without a tap',async()=>{const r=await run('course-path.html',{pos:10,agoMs:1500});assert.equal(r.playing,true);assert.ok(r.offset>10.5&&r.offset<12.5,'offset '+r.offset)});
test('old saved position (over 20 s): starts from the beginning',async()=>{const r=await run('course-path.html',{pos:10,agoMs:60000});assert.equal(r.playing,true);assert.equal(r.offset,0)});
test('different track: starts from the beginning',async()=>{const {b,p,s}=await open('shop.html',null);try{await p.addScriptTag({content:s.replace('if(musicEnabled&&!document.hidden)startMusic();','')});await p.evaluate(()=>localStorage.setItem('cq_music_pos',JSON.stringify({url:'http://fixture/assets/audio/area-lesson.ogg',pos:10,at:Date.now()})));await p.goto('http://fixture/shop.html');await p.addScriptTag({content:s});await p.waitForTimeout(1200);const r=await p.evaluate(()=>({playing:window.audioTest.playing,offset:window.audioTest.offset}));assert.equal(r.playing,true);assert.equal(r.offset,0)}finally{await b.close()}});
test('music off: nothing starts at load',async()=>{const r=await run('course-path.html',{pos:10,agoMs:1000},false);assert.equal(r.playing,false)});
