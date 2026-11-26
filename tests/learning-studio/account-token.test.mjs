import test from 'node:test';import assert from 'node:assert/strict';
import {accountToken} from '../../learning-studio/progress-api.mjs';
const jwt=sub=>'h.'+Buffer.from(JSON.stringify({sub})).toString('base64url')+'.s';
test('token only for the account the record belongs to',async()=>{
 assert.equal(await accountToken('A',{currentUser:{uid:'A',getIdToken:async()=>jwt('A')}}),jwt('A'));
 assert.equal(await accountToken('A',{currentUser:{uid:'B',getIdToken:async()=>jwt('B')}}),null);
 assert.equal(await accountToken('A',{currentUser:null}),null);
 assert.equal(await accountToken(null,{currentUser:{uid:'A',getIdToken:async()=>jwt('A')}}),null)});
test('account switches while the token is being fetched: the other account token is never returned for A',async()=>{
 const auth={currentUser:{uid:'A',getIdToken:async()=>{auth.currentUser={uid:'B',getIdToken:async()=>jwt('B')};return jwt('B')}}};
 assert.equal(await accountToken('A',auth),null)});
test('token whose sub is another account is withheld',async()=>{
 assert.equal(await accountToken('A',{currentUser:{uid:'A',getIdToken:async()=>jwt('B')}}),null)});
