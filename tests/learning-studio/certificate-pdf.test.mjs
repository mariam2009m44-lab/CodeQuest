import test from 'node:test';import assert from 'node:assert/strict';
import {buildPdf,fmtDate,trackLabel} from '../../learning-studio/certificate-pdf.mjs';
test('buildPdf makes a one-page A4 landscape PDF with the JPEG embedded and a valid xref',()=>{
 const jpeg=new Uint8Array([0xFF,0xD8,0xFF,0xE0,1,2,3,0xFF,0xD9]);const pdf=buildPdf(jpeg,3369,2382);const txt=Buffer.from(pdf).toString('latin1');
 assert.ok(txt.startsWith('%PDF-1.4'));assert.ok(txt.trimEnd().endsWith('%%EOF'));
 assert.match(txt,/\/MediaBox \[0 0 841\.89 595\.28\]/);assert.match(txt,/\/Count 1/);assert.match(txt,/\/Filter \/DCTDecode \/Length 9/);
 const sx=Number(/startxref\n(\d+)/.exec(txt)[1]);assert.equal(txt.slice(sx,sx+4),'xref');
 const offs=[...txt.slice(sx).matchAll(/(\d{10}) 00000 n/g)].map(m=>Number(m[1]));assert.equal(offs.length,6);
 offs.forEach((o,i)=>assert.ok(txt.slice(o).startsWith((i+1)+' 0 obj'),'object '+(i+1)));
 assert.ok(Buffer.from(pdf).includes(Buffer.from(jpeg)));
});
test('date and track labels',()=>{assert.equal(fmtDate('2026-11-25T12:00:00'),'25 / 11 / 2026');assert.equal(fmtDate('x'),'');assert.equal(trackLabel('cpp'),'C++');assert.equal(trackLabel('java'),'Java')});
test('the certificate page never invents a record and shows no QR or learner lookup',async()=>{
 const fs=await import('node:fs');const m=fs.readFileSync(new URL('../../learning-studio/certificate.mjs',import.meta.url),'utf8');
 assert.ok(!/qr/i.test(m));assert.ok(/demo/.test(m)&&/localhost/.test(m));assert.ok(!/fetch\(/.test(m));
});
