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
