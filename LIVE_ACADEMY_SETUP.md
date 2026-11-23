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


## Academy marketplace backend (implemented in repository)

The Academy marketplace is backed by callable Cloud Functions and Firestore collections. New browser pages call these functions; they do not write private marketplace records directly.

### Data ownership and visibility

- `instructorApplications/{uid}`: private application and review state. The applicant can submit/update their own application through the callable endpoint; administrators review it.
- `publicInstructorProfiles/{uid}`: created by the server only after approval. It contains only the approved public profile fields and deliberately excludes account email and private student data.
- `academyStudentProfiles/{uid}`: private student learning profile, including age band, grade, interests, learning goals, learning needs, and preferred schedule.
- `instructorPosts/{postId}`: published instructor updates. Only approved instructors can create posts.
- `teacherGroups/{groupId}`: listed learning groups owned by an approved instructor.
- `teacherGroups/{groupId}/membershipRequests/{uid}`: private pending/approved/rejected join requests.
- `teacherGroups/{groupId}/members/{uid}`: server-managed group membership. A student becomes a member only after the group's instructor approves the request.
- `academyAuditLogs/{eventId}`: append-only server-created records for application submission, review, and instructor publishing actions.

### Marketplace callable API

- `listApprovedInstructors`: authenticated discovery of approved public profiles.
- `createInstructorPost` / `listInstructorPosts`: create and read published instructor updates.
- `createTeacherGroup` / `listPublicTeacherGroups`: create and discover groups.
- `requestTeacherGroupMembership`: student requests membership after completing an active student profile.
- `listTeacherGroupJoinRequests` / `reviewTeacherGroupMembership`: instructor reviews pending requests for their own group.
- `listMyTeacherGroups`: returns the signed-in user's own instructor groups or approved student memberships.
- `getAcademyAdminOverview`: administrator-only overview of student profiles, instructor applications, classes, groups, posts, and recent audit events.

### Security invariants

- The browser cannot set instructor/admin claims or write approval, membership, private meeting, or audit records.
- Only a server-approved instructor can create a post or group.
- A student must have an active academy profile before requesting a group membership.
- Only the owner of a group can review its membership requests.
- Public instructor profiles are created only after admin approval; rejected applications are not published.
- Private email addresses and student profile fields are not included in the public instructor directory.
- Firestore's final catch-all rule denies direct access unless a collection has an explicit rule. New marketplace collections intentionally remain server-only and are accessed through authenticated callable functions.

### Required production activation

The code and GitHub Pages interface are not equivalent to a deployed Firebase backend. Deploy the latest `functions/index.js`, `firestore.rules`, and `firestore.indexes.json` to the intended Firebase project only after confirming the active billing plan and required provider setup. Do not enable billing or purchase a provider service without the owner's explicit approval.

The current instructor/student registration form includes a guardian-awareness confirmation checkbox, not an independently verified guardian identity or legally verified consent record. Before onboarding younger learners at scale, add a guardian verification workflow and define retention/deletion policies. Community posts and groups are not a substitute for active moderation; keep broad student-to-student direct messaging disabled.


## Group-linked live classes and enrollment enforcement

- Approved instructors can optionally link a scheduled live class to one of their active learning groups from the Live Academy form.
- The backend verifies group ownership and active status before creating the meeting and stores the group's ID and name on the class record.
- A learner can request group membership from the Academy Community page; only that group's approved instructor can accept the request.
- For a group-linked class, the enrollment callable checks the learner's active Academy profile and active student membership in that exact group inside the Firestore transaction before reserving a seat.
- Seat capacity remains transactionally enforced. Existing enrollment records are required to have status `enrolled` before a student receives a live-room token.
- Classes without a linked group remain open to any signed-in learner with an active Academy profile, subject to seat availability.
- This is a class-level group restriction, not a payment or attendance system. No payment collection is implemented.

- Learners can cancel their own upcoming enrollment while the class is still scheduled; the backend marks the enrollment cancelled and releases the seat transactionally. Cancelled records are excluded from the active instructor roster.


## Academy administration and student consent workflow

- The administrator console now supports rescheduling scheduled classes, changing duration/capacity within server-validated limits, and cancelling a scheduled class. Cancellation releases active seats, marks active enrollments as cancelled, deactivates the provider meeting, and writes an audit event.
- A learner can re-enroll after cancelling their own booking; the server reactivates the existing enrollment record and increments the seat count transactionally, subject to capacity and group membership.
- Student profiles for learners under 18 are stored with `status: pending_guardian` until an administrator records a guardian-consent verification. Class enrollment and group-membership requests are blocked until the verification is complete.
- The registration checkbox is only a learner declaration that a guardian is aware; it is not proof of guardian identity or independently verified consent. Administrators must only mark consent verified after confirming it with the guardian through an appropriate separate process. The platform does not collect guardian phone numbers in this flow.
- Adult profiles do not require guardian review. Changing an adult profile back to a minor age band does not carry over the adult approval.
- The admin overview exposes private learner details only through the admin-only callable. Public instructor profiles remain separate from private applications and are published only after approval.
