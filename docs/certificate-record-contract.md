# Certificate record contract (proposal for the backend owner)

Goal: the profile and certificate page can show a learner's certificate only from a record the server wrote when the learner finished a track. Nothing is derived in the browser.

## Endpoint (owner's shape)
`GET /api/certificates` with the learner's Firebase ID token. uid comes from the verified token only. No uid, name or other learner in the request.

200: `{ "certificates": [ { "track": "python|javascript|cpp|java", "trackName": "...", "issuedAt": "ISO8601 UTC (Z)", "lessonsCompleted": n, "lessonsTotal": n, "unitExamsPassed": n, "unitExamsTotal": n, "codeTasksVerified": true, "recordId": "opaque 8-64 chars [A-Za-z0-9_-]" } ] }`
401 when signed out. At most one per track. Learner name comes from the account profile server-side. No QR fields in v1.

## Server rules
Emitted only when, for that uid, every lesson and lesson test of the track passed, every unit exam passed, and the code tasks were verified server-side (multiple-choice alone never qualifies). Until code-task verification exists the backend must emit nothing. The client cannot create or edit a record.

## Client rules (implemented in learning-studio/certificate-records.mjs, endpoint disabled)
- States: disabled, signedout, ok (list or empty), error. A failed load is shown as "can't load", never as "no certificates".
- A response is dropped if the signed-in uid changed or signed out while loading. Latest request wins.
- Strict validation: any malformed entry (bad track, recordId, non-UTC date, future date, lessonsCompleted != lessonsTotal, unitExamsPassed != unitExamsTotal (or total 0), codeTasksVerified not exactly true, duplicate track) makes the whole response an error.
- localStorage is never used as a source.

## Backend implementation notes (branch progress-backend, not deployed)
- `GET /api/certificates` returns only records the server wrote. `POST /api/certificates/issue {language}` creates one only when `certificateEligibility` is met for that uid (owner rule of Nov 26 10:33 PM: every unit exam of the track passed on the server, plus the Python final exam for Python. Lesson tests, lesson practice and separately verified code tasks are not required). It ignores any client-supplied name, id or score.
- `recordId` is a private opaque random 32-hex id. It is NOT a public verification ID: there is no QR, no public lookup and no directory. It is only the handle the learner's own account uses to open its own certificate.
- Issuance has its own switch (`CERT_ISSUANCE=on` in the Worker environment), off by default, separate from deployment.
- The learner name is not stored in the record; the page reads the account profile.


## Public verification (QR)

The certificate carries a QR that opens `learning-studio/verify.html?id=<recordId>`. The page calls `GET /api/certificates/verify?id=<32 hex>` on the Worker.

- The server registers `{recordId, track, issuedAt}` in a certificate registry (a named instance of the existing StudentProgress class, no new Durable Object namespace) when a certificate is issued, and idempotently when the learner reads their own certificates. A registered number is never overwritten.
- The endpoint needs no sign-in but still requires an allowed Origin. It returns only `valid`, `track`, `trackName` and `issuedAt`. It never stores or returns a uid, email or learner name. Unknown or malformed numbers answer a clean 404.
- The number is 128 random bits, so it works as the lookup key. There is still no directory or listing. Showing a name publicly would need a per-learner opt-in and is not done.
