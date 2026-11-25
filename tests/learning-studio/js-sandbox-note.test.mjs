import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('JavaScript executor does not use the shared server quota and the sandbox has no account access',()=>{
 const e=fs.readFileSync(new URL('../../learning-studio/execution.mjs',import.meta.url),'utf8');const s=fs.readFileSync(new URL('../../learning-studio/js-sandbox.mjs',import.meta.url),'utf8');
 assert.match(e,/language==='javascript'[\s\S]*js-sandbox/);assert.match(s,/sandbox','allow-scripts'/);assert.doesNotMatch(s,/allow-same-origin/);assert.match(s,/terminate/);
});
test('sandbox frame carries a CSP that blocks all network (connect-src none) and remote scripts',()=>{
 const s=fs.readFileSync(new URL('../../learning-studio/js-sandbox.mjs',import.meta.url),'utf8');
 assert.match(s,/connect-src 'none'/);assert.match(s,/default-src 'none'/);assert.doesNotMatch(s,/script-src[^"]*https?:/);
});
