CodeQuest — Cody Academy

<p align="center">
  <strong>An Interactive, AI-Assisted Programming Education Platform</strong>
</p><p align="center">
  Learn to Code · Practice by Building · Track Your Progress
</p><p align="center">
  <a href="https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html">Live Application</a> •
  <a href="https://github.com/mariam2009m44-lab/CodeQuest">GitHub Repository</a>
</p><p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20Application-7955E8?style=for-the-badge" alt="Web Application">
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-36BFE5?style=for-the-badge" alt="Frontend">
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge" alt="FastAPI">
  <img src="https://img.shields.io/badge/Database-Firebase-FFCA28?style=for-the-badge" alt="Firebase">
</p>---

Table of Contents

- "1. Overview" (#1-overview)
- "2. Vision and Mission" (#2-vision-and-mission)
- "3. Educational Approach" (#3-educational-approach)
- "4. Core Features" (#4-core-features)
- "5. Technology Stack" (#5-technology-stack)
- "6. System Architecture" (#6-system-architecture)
- "7. Repository Structure" (#7-repository-structure)
- "8. Backend and API Services" (#8-backend-and-api-services)
- "9. Database Design" (#9-database-design)
- "10. Security" (#10-security)
- "11. Local Development" (#11-local-development)
- "12. Deployment" (#12-deployment)
- "13. Testing and Quality Assurance" (#13-testing-and-quality-assurance)
- "14. Implementation Status" (#14-implementation-status)
- "15. Development Roadmap" (#15-development-roadmap)
- "16. Privacy and Responsible AI" (#16-privacy-and-responsible-ai)
- "17. Contributing" (#17-contributing)
- "18. Project Information" (#18-project-information)
- "19. License" (#19-license)

---

1. Overview

CodeQuest, also known as Cody Academy, is an interactive programming education platform designed to make software development more accessible, practical, and engaging for beginners.

The platform combines structured programming curricula, interactive coding experiences, AI-assisted educational support, learner progress tracking, and gamification within a unified web application.

CodeQuest is built around a simple idea: programming is best learned by understanding concepts, experimenting with code, solving problems, and creating practical projects.

The platform currently provides learning content for:

- Python
- JavaScript
- C++

Its educational companion, Cody, is designed to provide AI-assisted explanations and contextual learning support.

Project at a Glance

Attribute| Description
Project Name| CodeQuest
Platform Name| Cody Academy
Category| Educational Technology
Primary Focus| Programming Education
Learning Languages| Python, JavaScript, C++
Interface Direction| Arabic-first, RTL support
Frontend| HTML, CSS, JavaScript
Backend| Python, FastAPI
Database| Cloud Firestore
Authentication| Firebase Authentication
AI Integration| Google Gemini API
Frontend Hosting| GitHub Pages

2. Vision and Mission

Vision

To create an accessible and engaging digital learning environment where beginners can develop programming knowledge, computational thinking, and practical problem-solving skills.

Mission

- Make programming concepts easier to understand.
- Encourage practical learning instead of passive content consumption.
- Provide AI-assisted educational guidance.
- Support independent experimentation and problem-solving.
- Connect learning activities with measurable progress.
- Encourage learners to turn ideas into programming projects.

3. Educational Approach

CodeQuest follows a learn-by-doing educational approach.

The learning experience is organized around four complementary stages:

Stage| Learning Objective
Understand| Learn programming concepts through explanations and examples.
Practice| Apply knowledge through exercises and educational activities.
Experiment| Write, modify, and execute code in a programming workspace.
Progress| Review completed lessons and track learning achievements.

The goal is to help learners develop both conceptual understanding and practical programming skills.

4. Core Features

4.1. Structured Programming Curricula

CodeQuest organizes programming content into structured curriculum files.

The current curriculum files include:

- "json/python_curriculum.json"
- "json/js_curriculum.json"
- "json/cpp_curriculum.json"

The curriculum architecture separates educational content from the frontend interface.

Depending on the lesson, structured content can include:

- Lesson identifiers and titles.
- Chapter organization.
- Explanations and examples.
- Practical activities.
- Quiz questions and answer options.
- Feedback messages.
- Learning objectives.

The curriculum module is responsible for loading, validating, and navigating supported learning content.

4.2. Interactive Code Playground

The platform includes a dedicated coding workspace built around CodeMirror 5.

The playground is designed to let learners write and experiment with source code.

Supported languages include:

- Python
- JavaScript
- C++

The workspace includes editor operations such as:

- Writing and editing code.
- Selecting a programming language.
- Loading example code.
- Running code through configured execution services.
- Resetting and clearing the editor.
- Saving supported drafts and project information.

Code execution is handled through backend integrations rather than being treated as a frontend-only feature.

4.3. Cody — AI-Assisted Learning Companion

Cody is the AI-assisted educational component of CodeQuest.

It is designed to help learners understand concepts and approach programming problems through guided explanations.

The backend includes:

- A dedicated FastAPI router.
- A question-classification component.
- Gemini API integration.
- Conversation-history handling.
- Optional page context.
- Request validation.

The question-classification component is located in:

"cody-ml-engine/src/question_classifier.py"

The AI model is configurable through the backend environment.

Configuration note: Cody's AI responses require a valid Gemini API key, a supported model configuration, and a functioning backend deployment. The presence of integration code does not guarantee that the service is available in every environment.

4.4. Authentication and Learner Accounts

Firebase Authentication provides the authentication foundation for supported account workflows.

The application includes account-related functionality such as:

- Registration.
- Sign-in.
- Password recovery.
- Sign-out.
- Authentication-state monitoring.
- Learner profile initialization.

Authenticated user identifiers are used to associate learner-specific information with the corresponding account.

4.5. Progress Tracking and Gamification

CodeQuest includes a progress and reward system designed to make learning achievements measurable.

Metric| Purpose
XP| Experience points earned through supported activities.
Stars| Lesson-completion reward indicator.
Coins| Virtual currency used by supported store functionality.
Level| Learner level calculated from experience points.
Completed Lessons| Number of recorded completed lessons.
Language Progress| Progress information for supported programming tracks.

The current lesson reward implementation is handled by Firebase Cloud Functions.

A valid lesson-completion event can award:

- 10 XP
- 1 Star

The backend uses Firestore transactions and reward records to prevent duplicate lesson rewards.

The level calculation implemented by the application follows:

level = Math.floor(xp / 100) + 1;

Important reward calculations are handled by backend services where implemented, rather than relying entirely on frontend-submitted values.

4.6. Learner Profile and Avatar System

The platform includes learner profile and avatar experiences.

Supported functionality includes:

- Profile information.
- Avatar selection.
- Avatar rendering.
- Default avatar options.
- Inventory-aware avatar selection for supported store items.

Avatar and profile-related data are associated with the authenticated learner account.

4.7. Educational Games

The repository includes educational game interfaces and activities designed to reinforce learning through interaction.

Examples include:

- Bug-finding activities.
- Matching activities.
- Memory games.
- Quiz-based experiences.
- Building-oriented challenges.

Reward limitation: Game interfaces and game reward processing are separate components. The current "claimGameReward" Firebase function rejects reward claims until reliable server-side game-result verification is implemented.

Therefore, the presence of a game does not mean that its reward workflow is fully enabled.

4.8. Projects and Coding Activities

CodeQuest includes project-oriented experiences that encourage learners to apply programming concepts.

Project data is associated with authenticated users through Firestore.

The database security rules validate important project properties, including ownership, project name, programming language, and source-code size.

4.9. Leaderboard

The platform includes a leaderboard interface supported by a separate public-data collection.

A Firebase Cloud Function synchronizes selected learner information into:

"leaderboardPublic/{uid}"

The synchronization process is designed to publish selected display information and experience points without publishing learner email addresses.

4.10. Progressive Web Application Support

The repository includes:

- A Web App Manifest.
- A Service Worker.
- A basic application caching strategy.

The Service Worker handles selected same-origin GET requests.

External service responses, including Firebase and other external requests, are not cached by the current Service Worker implementation.

5. Technology Stack

CodeQuest combines browser technologies, cloud infrastructure, backend services, and AI integration.

Layer| Technologies
Frontend| HTML5, CSS3, JavaScript
Interface Styling| Custom CSS, responsive layouts
Typography| Cairo
Icons| Remix Icon
Code Editor| CodeMirror 5
Authentication| Firebase Authentication
Database| Cloud Firestore
Serverless Backend| Firebase Cloud Functions
Backend Framework| Python, FastAPI
Data Validation| Pydantic
AI Integration| Google Gemini API
ML Component| Python, scikit-learn, joblib
Code Execution| Judge0 integration
Edge Computing| Cloudflare Workers
Educational Content| JSON
PWA Support| Web App Manifest, Service Worker
Version Control| Git and GitHub
Frontend Hosting| GitHub Pages

Dependency Management

Component| Dependency File
Python Backend| "backend/requirements.txt"
Firebase Functions| "functions/package.json"
Firebase Project Configuration| "firebase.json"
Firestore Security Rules| "firestore.rules"
Cloudflare Worker| "cloudflare-worker/wrangler.toml"

6. System Architecture

CodeQuest uses a multi-component architecture that separates the frontend, authentication, persistent data, backend APIs, and AI-related services.

flowchart TD
    A["Learner"] --> B["CodeQuest Web Application"]

    B --> C["HTML / CSS / JavaScript"]

    C --> D["Firebase Authentication"]
    C --> E["Cloud Firestore"]
    C --> F["Python FastAPI Backend"]
    C --> G["Firebase Cloud Functions"]
    C --> H["Cloudflare Worker"]

    F --> I["Cody AI Router"]
    I --> J["Question Classifier"]
    I --> K["Google Gemini API"]

    F --> L["Judge0 Code Execution"]
    F --> M["Curriculum and Quiz Services"]

    G --> N["Lesson Reward Processing"]
    G --> O["Store Purchase Processing"]
    G --> P["Leaderboard Synchronization"]
    G --> Q["Code Execution"]

    E --> R["Learner Profiles"]
    E --> S["Lesson Progress"]
    E --> T["Projects and Drafts"]
    E --> U["Public Leaderboard Data"]

Architecture Components

Component| Responsibility
Frontend| User interface, navigation, and learner interactions.
Firebase Authentication| Account authentication and identity.
Cloud Firestore| Persistent learner and application data.
FastAPI Backend| Quiz checking, code execution, and Cody-related APIs.
Firebase Functions| Selected trusted server-side operations.
Cloudflare Worker| Edge-side session verification and quiz checking.
Gemini API| AI-assisted educational responses.
Judge0| Remote execution of supported programming languages.

7. Repository Structure

The following tree highlights the principal application components and selected verified paths.

CodeQuest/
│
├── backend/
│   ├── main.py
│   ├── cody_chat.py
│   └── requirements.txt
│
├── cloudflare-worker/
│   ├── worker.js
│   └── wrangler.toml
│
├── cody-ml-engine/
│   └── src/
│       └── question_classifier.py
│
├── functions/
│   ├── index.js
│   └── package.json
│
├── json/
│   ├── python_curriculum.json
│   ├── js_curriculum.json
│   └── cpp_curriculum.json
│
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── auth-page.js
│   ├── curriculum.js
│   ├── firebase-config.js
│   ├── lecture.js
│   └── route-guard.js
│
├── css/
│   └── Application stylesheets
│
├── index.html
├── dashboard.html
├── login.html
├── signup.html
├── languages.html
├── lecture.html
├── playground.html
├── profile.html
├── progress.html
├── achievements.html
├── leaderboard.html
├── games.html
├── projects.html
├── store.html
│
├── firebase.json
├── firestore.rules
├── manifest.json
├── sw.js
└── README.md

This is a representative structure, not an exhaustive list of every file in the repository.

8. Backend and API Services

CodeQuest contains multiple backend components with separate responsibilities.

8.1. Python FastAPI Backend

Main file:

"backend/main.py"

The FastAPI application provides the following routes:

Method| Endpoint| Description
"GET"| "/"| Backend information and status.
"GET"| "/health"| Backend health check.
"POST"| "/api/quiz/check"| Validate a learner's quiz answer.
"POST"| "/api/code/run"| Submit source code for execution.

The quiz endpoint loads the relevant curriculum, locates the requested lesson, and evaluates the submitted answer.

The code-execution endpoint uses the configured Judge0 service.

Protected endpoints use Firebase ID-token verification.

8.2. Cody AI API

Main file:

"backend/cody_chat.py"

The Cody router uses the prefix:

"/api/cody"

Method| Endpoint| Description
"GET"| "/api/cody/health"| Cody service health and configuration status.
"POST"| "/api/cody/chat"| AI-assisted educational conversation.

The chat endpoint validates incoming requests, processes conversation context, and communicates with the configured Gemini model.

It requires authenticated access and valid provider configuration.

8.3. Cloudflare Worker

Main file:

"cloudflare-worker/worker.js"

The Worker implements the following routes:

Method| Endpoint| Description
"GET"| "/health"| Worker health check.
"GET"| "/api/session"| Verify the Firebase session.
"POST"| "/api/quiz/check"| Validate a curriculum quiz answer.
"OPTIONS"| Supported routes| Handle CORS preflight requests.

The Worker verifies Firebase ID tokens and applies its configured origin restrictions.

8.4. Firebase Cloud Functions

Main file:

"functions/index.js"

The repository includes these server-side functions:

Function| Trigger| Responsibility
"runCode"| Callable| Execute supported programming code.
"purchaseStoreItem"| Callable| Process supported virtual-store purchases.
"awardLessonReward"| Firestore document trigger| Award valid lesson-completion rewards.
"syncExistingLessonRewards"| Callable| Synchronize eligible historical lesson rewards.
"claimGameReward"| Callable| Currently rejects claims pending trusted game-result verification.
"syncLeaderboard"| Firestore document trigger| Synchronize selected public leaderboard information.

The Cloud Functions are configured for the "europe-west1" region where specified in the implementation.

The functions use Firebase Authentication context for protected callable operations and Firestore transactions for selected operations.

9. Database Design

Cloud Firestore provides persistent storage for supported application functionality.

Main Collections

Collection / Path| Purpose
"users/{uid}"| Learner profile and account-related data.
"users/{uid}/lessonProgress/{lessonId}"| Lesson completion records.
"users/{uid}/quizResults/{resultId}"| Quiz-related records.
"users/{uid}/gameRewards/{gameId}"| Reward records and duplicate-prevention data.
"users/{uid}/drafts/{draftId}"| Saved coding drafts.
"projects/{projectId}"| User-owned programming projects.
"leaderboardPublic/{uid}"| Selected public leaderboard information.

Data Ownership

Learner-specific information is associated with the authenticated Firebase user ID.

Firestore security rules restrict access to supported records according to ownership and validation conditions.

Lesson Progress

Lesson progress records use fields such as:

{
  "language": "python",
  "chapter": 0,
  "lesson": 0,
  "completed": true,
  "updatedAt": "Firestore Timestamp"
}

Supported programming-language identifiers include:

- "python"
- "javascript"
- "cpp"

Reward Records

Lesson reward processing uses separate reward records to prevent duplicate rewards when a completion event is retried or processed more than once.

Public Leaderboard Data

Public leaderboard information is maintained separately from private learner profile data.

The synchronization function publishes selected display information rather than the learner's email address.

10. Security

Security is important because CodeQuest handles learner accounts, saved code, and educational progress.

The repository includes several security-related mechanisms:

- Firebase Authentication.
- Firebase ID-token verification in backend services.
- Firestore ownership checks.
- Field-level validation in Firestore rules.
- Server-side reward calculations.
- Transaction-based store purchase processing.
- Server-side code-execution request validation.
- Input-length limits for supported API requests.
- Restricted Cloudflare Worker origins.
- Separate public leaderboard data.
- Backend environment configuration for private credentials.

Security Considerations

Firebase client configuration is required by browser applications and should not be treated as a private server credential.

Private service credentials and AI provider keys must never be committed to public source files.

Backend services should use appropriately configured environment variables or platform-managed secrets.

Code execution, authentication, and reward processing should be reviewed before production use at scale.

The presence of security rules does not replace a complete security audit.

11. Local Development

CodeQuest consists of frontend files and separately configured backend services.

Some features require external Firebase, Gemini, Judge0, or Cloudflare configuration.

11.1. Prerequisites

Recommended development tools include:

- Git
- Python 3
- Node.js 22
- npm
- Firebase CLI
- A code editor
- A configured Firebase project

11.2. Clone the Repository

git clone https://github.com/mariam2009m44-lab/CodeQuest.git

cd CodeQuest

11.3. Run the Frontend

The frontend is composed primarily of HTML, CSS, and JavaScript modules.

Start a local HTTP server from the repository root:

python -m http.server 8000

Open the application:

http://localhost:8000

A local HTTP server is recommended because the application loads JavaScript modules and JSON curriculum files.

Some features require valid Firebase configuration and their corresponding backend services.

11.4. Configure the Python Backend

Install the declared dependencies:

python -m venv .venv

Activate the virtual environment, then install the requirements:

pip install -r backend/requirements.txt

Configure the required backend environment and Firebase Admin credentials.

Relevant configuration values include:

Variable| Purpose
"GEMINI_API_KEY"| Gemini API authentication.
"GEMINI_MODEL"| Configured Gemini model.
"JUDGE0_URL"| Judge0 service endpoint.
"CORS_ORIGINS" | Allowed backend origins.
"GOOGLE_APPLICATION_CREDENTIALS" | Firebase Admin service-account credential location, when using a service-account file.

Start the FastAPI application from the repository root:

uvicorn main:app --app-dir backend --reload

The local backend is available at:

http://127.0.0.1:8000

FastAPI's interactive API documentation is available at:

http://127.0.0.1:8000/docs

11.5. Configure Firebase Cloud Functions

The Cloud Functions source directory is:

"functions/"

Install dependencies:

cd functions
npm install

The package includes scripts for local emulation, deployment, and function logs.

The Firebase project configuration specifies Node.js 22 as the Functions runtime.

Before deployment, configure the appropriate Firebase project and required service settings.

11.6. Configure the Cloudflare Worker

The Worker source file is:

"cloudflare-worker/worker.js"

Its Wrangler configuration is:

"cloudflare-worker/wrangler.toml"

Configure the required Cloudflare and Firebase settings before deploying the Worker.

Never place private credentials in publicly accessible frontend files.

---

12. Deployment

The public frontend is hosted through GitHub Pages.

<p align="center">
  <a href="https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html">
    <img src="https://img.shields.io/badge/Open-CodeQuest-7955E8?style=for-the-badge" alt="Open CodeQuest">
  </a>
</p>Live Application:
https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html

Source Repository:
https://github.com/mariam2009m44-lab/CodeQuest

The frontend, Python backend, Firebase Cloud Functions, and Cloudflare Worker are separate deployment components.

Deploying the frontend alone does not automatically deploy the backend services.

Component| Deployment Responsibility
Frontend| GitHub Pages
Authentication and Database| Firebase
Serverless Functions| Firebase Cloud Functions
Python API| Configured Python hosting environment
Edge API| Cloudflare Workers
AI Provider| Configured Gemini API access
Code Execution| Configured Judge0 service

Each service must be configured and deployed independently.

13. Testing and Quality Assurance

Testing should cover individual modules and their integration.

Authentication

- Account registration.
- Sign-in and sign-out.
- Password recovery.
- Authentication-state handling.
- Protected-page access.

Curriculum

- JSON file loading.
- Curriculum structure validation.
- Lesson navigation.
- Invalid lesson selections.
- Quiz data validation.

Code Execution

- Supported language selection.
- Valid source-code submission.
- Execution output handling.
- Compilation and runtime error handling.
- Backend availability.

Progress and Rewards

- Lesson completion persistence.
- XP and star calculations.
- Duplicate reward prevention.
- Profile synchronization.
- Leaderboard synchronization.

AI Functionality

- Authentication requirements.
- Missing API-key handling.
- Question classification.
- Conversation-history validation.
- Provider error handling.

Interface

- Mobile responsiveness.
- Arabic right-to-left layout.
- Keyboard accessibility.
- Navigation behavior.
- Theme consistency.

Testing status: This documentation describes the implementation and recommended verification areas. It does not claim that every integration has passed a complete automated or production test suite.

14. Implementation Status

CodeQuest is an evolving software project. The following table distinguishes implemented code from functionality that requires additional configuration or integration.

Component| Current Status
HTML/CSS/JavaScript frontend| Implemented
Firebase Authentication integration| Implemented
Firestore integration| Implemented
Python, JavaScript, and C++ curriculum files| Present
Curriculum validation and navigation| Implemented
CodeMirror programming workspace| Present
FastAPI backend| Implemented
Judge0 code-execution integration| Implemented in backend components
Firebase Cloud Functions| Implemented
Lesson XP and star reward trigger| Implemented
Duplicate lesson-reward prevention| Implemented
Cody AI backend integration| Implemented; requires provider configuration
Question-classification component| Present; requires backend dependencies
Cloudflare Worker| Implemented
Profile and avatar interfaces| Present
Progress and leaderboard interfaces| Present
Educational game interfaces| Present
Server-verified game rewards| Not enabled
PWA manifest and Service Worker| Present
Full production-readiness verification| Requires further testing

The status of a feature should be evaluated through its actual integration and deployment configuration, not only through the presence of a page or source file.

15. Development Roadmap

Future development can focus on improving reliability, educational depth, and integration quality.

Learning Experience

- Expand and refine programming curricula.
- Improve practical coding exercises.
- Add more structured projects.
- Strengthen lesson assessment and feedback.
- Improve learning-path progression.

AI-Assisted Education

- Improve Cody's contextual understanding.
- Expand educational explanations.
- Improve debugging guidance.
- Strengthen the integration between lessons and AI assistance.

Gamification

- Complete secure game-result verification.
- Improve achievement tracking.
- Expand reward-related experiences.
- Strengthen synchronization between progress and profile data.

Platform Engineering

- Improve automated testing.
- Strengthen backend monitoring.
- Review API security and rate limiting.
- Improve error handling and service reliability.
- Expand accessibility support.
- Improve deployment and configuration documentation.

16. Privacy and Responsible AI

CodeQuest is designed around educational use.

Its development principles include:

- Keeping private learner information separate from public leaderboard information.
- Associating personal progress with authenticated accounts.
- Restricting access to supported user-owned records.
- Avoiding unnecessary exposure of account information.
- Keeping private AI provider credentials on the backend.
- Encouraging AI-assisted understanding rather than uncritical dependence on generated answers.

AI-generated responses should be treated as educational assistance and reviewed for accuracy.

17. Contributing

Contributions and constructive feedback are welcome.

Suggested contribution areas include:

- Educational content improvements.
- Frontend usability.
- Backend reliability.
- Accessibility.
- Testing.
- Documentation.
- Bug reports and feature suggestions.

Contribution Workflow

1. Fork the repository.
2. Create a dedicated feature branch.
3. Make focused changes.
4. Test the affected functionality.
5. Commit your changes with a descriptive message.
6. Open a pull request explaining the changes.

Please avoid submitting changes that introduce unverified functionality claims or expose private credentials.

18. Project Information

Field| Information
Project Name| CodeQuest
Platform Name| Cody Academy
Project Category| Educational Technology
Primary Focus| Programming Education
Supported Learning Languages| Python, JavaScript, C++
Interface| Arabic-first
Frontend Hosting| GitHub Pages
Repository| GitHub

Project Links

- Live Application: "Open CodeQuest" (https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html)
- GitHub Repository: "View Source Code" (https://github.com/mariam2009m44-lab/CodeQuest)

19. License

No specific open-source license is declared in this documentation.

Unless a license file is added to the repository, reuse and redistribution should not be assumed to be permitted.

---

<p align="center">
  <strong>CodeQuest — Cody Academy</strong>
</p><p align="center">
  Learn through exploration. Build through practice. Grow through progress.
</p>