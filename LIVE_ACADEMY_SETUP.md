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

Create or update the Functions environment file at `functions/.env.<FIREBASE_PROJECT_ID>` (replace the placeholder with the active Firebase project ID):

```dotenv
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
REALTIMEKIT_APP_ID=your_realtimekit_app_id
REALTIMEKIT_INSTRUCTOR_PRESET=webinar-host
REALTIMEKIT_STUDENT_PRESET=webinar-participant
```

Use the exact preset names configured in the RealtimeKit dashboard. Do not commit the environment file; verify it is covered by `.gitignore`. Firebase Functions v2 loads `defineString` values from the project-specific environment file during deployment.

## Deploy

From the repository root, after the Cloudflare app and Firebase settings are ready:

```bash
firebase deploy --only functions,firestore:rules,firestore:indexes
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

The repository code now contains the class directory, enrollment flow, server-issued meeting tokens, and RealtimeKit classroom page. These are not live in production until the RealtimeKit app/presets/secrets are configured and the Firebase Functions and Firestore rules are deployed. The shared collaborative code editor has now been added to the classroom page. Whiteboard and Cody-in-session assistant remain future features.


## Academy registration and direct publishing

The academy now includes a separate registration page at `academy-registration.html` while keeping the existing CodeQuest Authentication account:

- Learners sign in with their existing CodeQuest account and submit an academy learner profile. For users under 18, the current form requires confirmation that a guardian is aware and agrees; it deliberately does not collect a guardian phone number or private contact details.
- Instructor applicants submit a separate application with teaching specialties, experience, a short bio, optional portfolio URL, and availability.
- Instructor applications are stored in `instructorApplications/{uid}`. Only an academy administrator can review and approve/reject them. Approval grants the instructor custom claims through the server; applicants cannot self-assign instructor privileges.
- Email verification is required before an instructor can be approved. Applicants can request a verification email from the registration page.
- Once approved, instructors can create classes directly. New classes appear in the public signed-in class directory without a second admin publication step.
- Each class has a server-enforced seat capacity (1–30, default 12). Enrollment uses a Firestore transaction to prevent overselling. Students must complete their academy learner profile before booking.
- `academy-admin.html` is a private admin-only console for pending instructor applications, class status, seat counts, and enrolled learner display names.
- The instructor-facing class directory shows current enrollment versus capacity.

New callable functions:
- `submitStudentAcademyProfile`
- `submitInstructorApplication`
- `getMyAcademyRegistrationStatus`
- `getAcademyAdminOverview`
- `reviewInstructorApplication`
- `listInstructorClassRoster`

## Deployment boundary

The new HTML/CSS/JavaScript files are published with GitHub Pages automatically. The callable functions in `functions/index.js` require a Firebase Functions deployment before the new registration, admin review, and seat-capacity flows can work. The Firestore data is accessed through callable functions and remains denied to direct browser reads/writes by the existing default-deny rules. No paid service has been enabled or purchased by these changes.

The collaborative shared code editor is still a separate future implementation; the current RealtimeKit meeting does not by itself synchronize CodeMirror content between participants.


## Shared collaborative code editor

- `live-classroom.html` now includes a CodeMirror editor below the meeting surface.
- The shared document is stored at `liveClasses/{classId}/workspace/shared` and synchronized with Firestore realtime listeners.
- A newly created class receives an empty Python workspace as part of the server-side class transaction. For older classes, the approved class instructor can initialize the workspace when opening the classroom.
- Firestore rules permit workspace reads and code edits only for the approved class instructor, enrolled students, and academy administrators. Only the instructor or administrator may change the shared language. Unenrolled accounts cannot read or write the workspace.
- Supported editor modes: Python, JavaScript, C++, and Java.
- This is a shared-document editor with realtime whole-document synchronization, not a character-level CRDT editor. If two people type at exactly the same time, the latest saved document may replace the other edit. A future iteration should add operational transforms/CRDT and version history for stronger simultaneous editing.

## What is published versus activated

- GitHub Pages publishes the static classroom UI, registration forms, admin UI, and browser scripts.
- The Firebase Functions and Firestore rules changes still require deployment to the configured Firebase project before the new callable functions and secure workspace can operate in production.
- RealtimeKit requires the Cloudflare account/app identifiers, host and participant presets, and server-only API token described above. No paid plan or subscription has been purchased or activated by this repository change.
- Before inviting students, complete a real test with one instructor account, one enrolled learner account, and an administrator account. Confirm the learner cannot open the classroom or workspace before enrollment.
