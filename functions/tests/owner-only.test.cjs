// requireLiveAdmin is extracted from functions/index.js and run in isolation (no Firebase needed).
const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const src = fs.readFileSync(require('node:path').join(__dirname, '../index.js'), 'utf8');
const fn = src.slice(src.indexOf('function requireLiveAdmin'), src.indexOf('function requireApprovedLiveInstructor'));
function make(owner) { const env = owner === undefined ? {} : { ACADEMY_OWNER_UID: owner }; const sb = { process: { env }, HttpsError: class extends Error { constructor(c, m) { super(m); this.code = c; } } }; vm.runInNewContext(fn + ';this.f=requireLiveAdmin', sb); return sb.f; }
const req = (uid, token) => ({ auth: { uid, token } });
test('owner-only: unset owner refuses everyone, even with admin claims', () => {
  const f = make(undefined); assert.throws(() => f(req('owner', { admin: true })), /permission|مسؤول/); assert.throws(() => f(req('x', { liveRole: 'admin' })));
});
test('owner-only: exact uid plus admin claim passes; other claimed admins, near-miss uid, no claim and no auth are refused', () => {
  const f = make('ownerUid'); assert.equal(f(req('ownerUid', { admin: true })), 'ownerUid'); assert.equal(f(req('ownerUid', { liveRole: 'admin' })), 'ownerUid');
  assert.throws(() => f(req('otherAdmin', { admin: true }))); assert.throws(() => f(req('owneruid', { admin: true }))); assert.throws(() => f(req('ownerUid', {}))); assert.throws(() => f({}));
});
