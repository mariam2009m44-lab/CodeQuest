import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const h=fs.readFileSync(new URL('../../profile.html',import.meta.url),'utf8');
test('profile shows a certificates section whose default state is empty and never lists a certificate without a record source',()=>{
 assert.match(h,/id="profileCerts"[^>]*data-cert-source="none"/);
 assert.match(h,/id="certsList" hidden/);assert.ok(!/id="certsEmpty"[^>]*hidden/.test(h));
 assert.ok(!/certificate\.html\?(demo|synthetic)/.test(h));
});
