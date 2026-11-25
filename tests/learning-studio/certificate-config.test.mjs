import test from 'node:test';import assert from 'node:assert/strict';
import {certificatesUrl} from '../../learning-studio/certificate-config.mjs';
import {makeCertificateFetcher} from '../../learning-studio/certificate-source.mjs';
test('url is absolute https on the configured origin only',()=>{
 assert.equal(certificatesUrl('https://x.example'),'https://x.example/api/certificates');
 for(const b of [null,'','/api','http://x.example','https://x.example/sub','https://u:p@x.example','https://x.example?a=1','not a url'])assert.equal(certificatesUrl(b),null);
 assert.equal(certificatesUrl('https://x.example','/other'),null);
});
test('fetcher rejects when unconfigured and never calls fetch',async()=>{
 let n=0;const f=makeCertificateFetcher(()=>({getIdToken:async()=>'t'}),{base:null,fetchImpl:async()=>{n++}});
 await assert.rejects(f,/not-configured/);assert.equal(n,0);
});
test('fetcher sends bearer token to the absolute URL and no uid',async()=>{
 let seen;const f=makeCertificateFetcher(()=>({getIdToken:async()=>'t'}),{base:'https://x.example',fetchImpl:async(u,o)=>{seen=[u,o];return {ok:true,json:async()=>({certificates:[]})}}});
 await f();assert.equal(seen[0],'https://x.example/api/certificates');assert.equal(seen[1].headers.Authorization,'Bearer t');assert.ok(!/uid/i.test(seen[0]));
});
