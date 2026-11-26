import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const h=fs.readFileSync(new URL('../../profile.html',import.meta.url),'utf8');
test('profile shows a certificates section whose default state is empty and never lists a certificate without a record source',()=>{
 assert.match(h,/id="profileCerts"[^>]*data-cert-source="none"/);
 assert.match(h,/id="certsList" hidden/);assert.ok(!/id="certsEmpty"[^>]*hidden/.test(h));
 assert.ok(!/certificate\.html\?(demo|synthetic)/.test(h));
});
test('profile wires the adapter behind the disabled flag and does not claim a fetched empty list',()=>{
 assert.match(h,/profile-certificates\.mjs/);assert.match(h,/CERT_ENDPOINT_ENABLED/);assert.match(h,/غير مفعّل حاليًا/);
 const m=fs.readFileSync(new URL('../../learning-studio/certificate-records.mjs',import.meta.url),'utf8');assert.match(m,/CERT_ENDPOINT_ENABLED=true/);
 const c=fs.readFileSync(new URL('../../learning-studio/certificate.mjs',import.meta.url),'utf8');assert.ok(/CERT_ENDPOINT_ENABLED/.test(c)&&!/localStorage/.test(c));
});
