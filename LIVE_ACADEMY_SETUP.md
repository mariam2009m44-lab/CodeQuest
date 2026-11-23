# CodeQuest Live Academy — production setup

This implementation uses Firebase Authentication + Cloud Functions for authorization and Cloudflare RealtimeKit for the actual live meeting. Provider credentials are server-only and must never be added to browser JavaScript or committed to Git.

## What the code now supports

- A verified owner can bootstrap the first Live Academy administrator.
- Only an administrator can approve instructor accounts.
- Only approved instructors can schedule classes and start/end their own classes.
- Students must enroll before the backend issues a participant token.
- RealtimeKit participant tokens are issued by Cloud Functions, never placed in a public URL.
- Class metadata is readable by signed-in users; provider meeting IDs and approval records are server-only.
- The meeting is created with recording and automatic transcription/summary disabled.
- The RealtimeKit UI Kit supplies the meeting surface and its built-in participant/media/chat/poll controls.

## Required Cloudflare setup

1. Create a RealtimeKit app in the Cloudflare dashboard.
2. Create two participant presets in that app:
   - `webinar-host`: instructor/host permissions.
   - `webinar-participant`: student permissions; configure student permissions deliberately (for a youth classroom, keep host moderation and disable unrestricted participant management).
3. Create a Cloudflare API token with the Realtime permissions required for creating meetings and participants.
4. Keep the token private. Do not put it in HTML, JavaScript, GitHub, or a public environment variable.

The integration uses these settings:

- Secret: `REALTIMEKIT_API_TOKEN`
- Secret: `LIVE_ACADEMY_OWNER_EMAIL` (the verified email allowed to bootstrap the first administrator)
- Parameter: `CLOUDFLARE_ACCOUNT_ID`
- Parameter: `REALTIMEKIT_APP_ID`
- Optional parameters: `REALTIMEKIT_INSTRUCTOR_PRESET`, `REALTIMEKIT_STUDENT_PRESET`

Set the two secrets with Firebase CLI:

```bash
firebase functions:secrets:set REALTIMEKIT_API_TOKEN
firebase functions:secrets:set LIVE_ACADEMY_OWNER_EMAIL
```

Set the four non-secret parameters in the Functions environment (for the deployed project) and verify that the preset names exactly match the names configured in the RealtimeKit dashboard.

## Deploy

From the repository root, after the Cloudflare app and Firebase settings are ready:

```bash
firebase deploy --only functions,firestore:rules
```

Then sign in to CodeQuest with the verified owner account, open `live-academy.html`, and choose **تهيئة مسؤول الأكاديمية** once. The server checks the verified email against the private owner secret before granting the admin custom claim. Refresh the sign-in token by signing out and back in if the role does not appear immediately.

The owner can then use **اعتماد حسابي كمدرّب** or approve another verified instructor by Firebase UID. Instructor approval is a server action; changing a Firestore profile field cannot grant the role.

## Safety and privacy defaults

- Keep lessons group-based; do not create private student–instructor meeting links.
- Review and verify instructor identity before approval.
- Keep host moderation enabled and student permissions limited to the activities needed for class.
- Recording, automatic transcription, and persistent meeting chat are disabled by default in the meeting creation request.
- Establish guardian consent and a reporting/moderation process before opening classes to younger learners.

## Current boundary

The repository code now contains the class directory, enrollment flow, server-issued meeting tokens, and RealtimeKit classroom page. These are not live in production until the RealtimeKit app/presets/secrets are configured and the Firebase Functions and Firestore rules are deployed. The shared collaborative code editor, whiteboard, and Cody-in-session assistant are later features; they are not represented as working controls yet.
