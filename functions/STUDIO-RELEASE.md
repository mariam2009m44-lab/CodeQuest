# CodeQuest studio release checklist

Status: source tested locally, not committed, pushed or deployed. Existing CodeQuest production is unchanged. Do not describe this package as a production release.

## Completed checks

- 119 lessons and119 original concept-linked scenes in35units across Python48,JavaScript26,C++23,Java22.
- 921 portable tests.
- All119 lesson browser sequences with real local compilers, including syntax-error and code-preservation paths.
- 41 backend tests with actual Firestore emulator, zero skipped: canonical sequence checks, authentication/schema/owner/version, duplicate and transaction isolation, compiler protocol, legacy rules and rewards.
- Full existing browser suite run in bounded groups:62tests pass, including auth return and account isolation. Extra root entry/compiler smoke and saved/unconfirmed proof-flow fixtures pass.
- Syntax, curriculum structure, dashboard media,49-page local links and diff-whitespace checks pass.
-320/390/1280 visual checks include new-entry separation, learner views, saved/unconfirmed states and private review disclosures.

## Preserved behavior

Existing language cards still open course-path.html with old history. New-unit links are separate. No account resets, billing changes or new games. New studio evidence does not grant rewards or overwrite old progress. Local code/name stay in memory; account evidence stores hashes/phase/version only. Account changes reload and clear local state.

## Administrator-dependent unknowns, do not waive

1. Current Firebase deploy session fails authentication. Target project from existing Firebase config is codequest-6350a. Need administrator Google authorization and verify this project is listed, then verify deployment permission. Learner login is separate and remains user-controlled.
2. Current deployment plan, quota, existing Judge0 service configuration and incremental cost are unverified. New authoritative worked/practice/transfer checks add3compiler executions per ordinary completed lesson, up to5for the lesson with two input cases at each task, in addition to visible existing execution. Callable and Firestore operations also increase. Limit12proof requests/minute per user and max3instances are safeguards, not a free-cost guarantee. No paid upgrade/billing change is authorized. Check limits support memory128MB, CPU2s,wall5s,no network and max file64KB. Stop for approval if an unapproved charge or plan change would result.
3. Actual deployed authenticated four-language compilation, save/read/retry, logout/account switch, reload and old-history preservation remain unverified.

## Resume here when administrator is ready

Do not start an expiring authorization overnight. Use installed Firebase CLI's supported Google sign-in, force reauthorization with `firebase login --reauth --no-localhost` in the remote execution environment. The browser flow must use the administrator's own Google account with project access. Never ask for a password, refresh token or service-account key in chat. Remote flow returns a short-lived authorization code, not a reusable credential; sign-in can be completed through the supported secure browser/code flow. Standard local-machine alternative is `firebase login --reauth` with a browser on that machine. Do not use deprecated login:ci as a shortcut.

After login, run `firebase projects:list` and verify codequest-6350a. Check actual deployment permissions, existing service configuration/quota/cost before effectful commands. Source evidence for official login route: https://firebase.google.com/docs/cli . No exchange has been started.

Before deploying, recover the user's original authenticated instruction and current publication gate, check latest upstream changes, and rerun source/version tests if anything changed. Deploy only the2new functions plus rules, not every existing function, using the verified project; do not delete functions, change secrets, modify billing or reset accounts. The intended scoped functions are submitStudioEvidence and getStudioEvidence. Inspect dry-run/discovery output if available and stop on unexpected resource/paid-service proposals. Backend-first ordering is required. Do not change frontend entry until both backend functions and rules are confirmed healthy. Publish the exact matching client version/files after backend checks.

Then run actual authenticated end-to-end cases: normal/wrong prediction; worked code execution; wrong/right practice; explanation; new transfer; saved confirmation; reload; failed network/retry; account change/signout during inflight save; second-account isolation; old legacy progress untouched. Verify languages use genuine compiler output and errors never become success. These are production gates, not claims satisfied by local tests. If a gate fails, keep the new entry unavailable or roll back only new frontend entry/source; preserve old account evidence and history. Do not delete new evidence as a rollback shortcut.

## Packaging

The source archive contains changed/new source files, tests and these checklists only. Assets are separate zip parts with113 referenced WebP scenes. No account credentials, CLI configuration, auth tokens, local execution server, tool logs, workspace transcript or internal checkpoint is included. ART-MANIFEST.json lists exact image hashes. All files are repository-relative. Preserve latest upstream unrelated changes when applying.
