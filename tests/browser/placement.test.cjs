const {test}=require('node:test'),assert=require('node:assert/strict'),{chromium}=require('playwright'),fs=require('fs/promises'),path=require('path');const root=path.resolve(__dirname,'../..');
test('placement quiz: free line, blank answers refused, levels by score, nothing sent',async()=>{
 const b=await chromium.launch();try{const p=await b.newPage({viewport:{width:390,height:900}});const reqs=[];
 await p.route('**/*',async r=>{const u=new URL(r.request().url());if(u.hostname!=='localhost')return r.abort();reqs.push(r.request().method());try{const f=path.join(root,u.pathname);return r.fulfill({contentType:{'.html':'text/html;charset=utf-8','.js':'application/javascript','.css':'text/css'}[path.extname(f)]||'application/octet-stream',body:await fs.readFile(f)})}catch{return r.fulfill({status:404,body:''})}});
 await p.goto('http://localhost:9/placement.html');await p.waitForTimeout(300);
 assert.match(await p.textContent('.pl-free'),/مجاني/);assert.equal(await p.locator('.pl-q').count(),6);
 await p.click('.pl-btn');assert.match(await p.textContent('#plResult'),/أجب عن كل الأسئلة/);
 const right=[0,1,0,1,0,1];for(let i=0;i<6;i++)await p.check(`input[name=q${i}][value="${right[i]}"]`);await p.click('.pl-btn');assert.match(await p.textContent('#plResult'),/متوسط/);
 for(let i=0;i<6;i++)await p.check(`input[name=q${i}][value="2"]`);await p.click('.pl-btn');assert.match(await p.textContent('#plResult'),/مبتدئ/);
 await p.screenshot({path:require('os').tmpdir()+'/placement.png',fullPage:true});assert.ok(reqs.every(m=>m==='GET'))}finally{await b.close()}});
