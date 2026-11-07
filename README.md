🚀 CodeQuest — Cody Academy

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20Application-7955E8?style=for-the-badge" alt="Platform">
  <img src="https://img.shields.io/badge/Interface-Arabic%20%7C%20RTL-36BFE5?style=for-the-badge" alt="Arabic RTL">
  <img src="https://img.shields.io/badge/AI-Gemini%20Integration-43C99A?style=for-the-badge" alt="AI Integration">
  <img src="https://img.shields.io/badge/Development-Active-FFD66B?style=for-the-badge" alt="Development Status">
</p><p align="center">
  <strong>Learn to Code. Build Projects. Play. Grow.</strong>
  <br>
  An interactive, AI-assisted programming learning platform designed to make coding education more accessible, practical, and engaging.
</p><p align="center">
  <a href="https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html">🌐 Live Platform</a>
  &nbsp; • &nbsp;
  <a href="https://github.com/mariam2009m44-lab/CodeQuest">📂 Repository</a>
  &nbsp; • &nbsp;
  <a href="#-getting-started">⚙️ Get Started</a>
</p>---

📑 Table of Contents

- "Overview" (#-overview)
- "Project Vision" (#-project-vision)
- "Core Features" (#-core-features)
- "Learning Environment" (#-learning-environment)
- "Cody AI Assistant" (#-cody--ai-learning-assistant)
- "Interactive Code Playground" (#-interactive-code-playground)
- "Gamification and Progress" (#-gamification-and-progress)
- "System Architecture" (#-system-architecture)
- "Technology Stack" (#-technology-stack)
- "Project Structure" (#-project-structure)
- "Backend API" (#-backend-api)
- "Database Design" (#-database-design)
- "Getting Started" (#-getting-started)
- "Environment Configuration" (#-environment-configuration)
- "Deployment" (#-deployment)
- "Security and Privacy" (#-security-and-privacy)
- "Implementation Status" (#-implementation-status)
- "Roadmap" (#-roadmap)
- "Contributing" (#-contributing)
- "Project Information" (#-project-information)
- "License" (#-license)

---

📌 Overview

CodeQuest — Cody Academy is an Arabic-first programming education platform that brings together structured learning, interactive coding, AI-assisted guidance, and gamified educational experiences.

The platform aims to help beginners move beyond passive tutorials and develop practical programming skills through a connected learning environment.

Learners can explore programming tracks, study lessons, experiment with code, work on projects, and monitor their educational progress.

At the center of the experience is Cody, an AI-assisted educational companion designed to explain concepts, provide learning guidance, and encourage independent problem-solving.

CodeQuest combines frontend technologies with backend services and cloud integrations to create a foundation for an accessible and extensible educational platform.

🎯 Project Vision

The vision behind CodeQuest is to make programming education more approachable through technology, creativity, and interactive learning.

The platform is built around five principles:

1. Learn: Understand programming through structured educational content.
2. Practice: Apply concepts in an interactive coding environment.
3. Explore: Discover programming challenges and educational games.
4. Improve: Track learning activity and personal progress.
5. Create: Develop practical projects and problem-solving skills.

The long-term goal is to build an educational ecosystem where learners can progress from their first programming concepts to creating their own applications.

---

✨ Core Features

Feature| Description
📚 Learning Tracks| Organized programming paths and lesson content.
💻 Code Playground| Interactive code editing and execution experience.
🤖 Cody AI| AI-assisted explanations and educational guidance.
🎮 Educational Games| Game-based activities for reinforcing concepts.
🏆 Achievements| Recognition of learning milestones.
⭐ Rewards System| XP and stars for supported learning activities.
👤 User Profiles| Personal account information and learning data.
📊 Progress Tracking| Learning statistics and completed lessons.
🥇 Leaderboard| Public rankings based on recorded experience points.
🛍️ Reward Store| In-platform items and inventory management.
🔐 Authentication| Firebase-based identity and protected access.
📱 Responsive Design| Interface designed for desktop and mobile screens.
🌍 Arabic RTL| Right-to-left layout and Arabic-first experience.
📲 PWA Support| Web application manifest and service worker support.

«Implementation note: Feature availability depends on the relevant service configuration and deployment. A visible interface does not necessarily mean that every feature is fully operational.»

---

🧠 Learning Environment

CodeQuest organizes its educational content into programming learning tracks.

Learning Track| Main Topics
🐍 Python| Variables, data types, conditions, loops, functions, and practical programming.
🟨 JavaScript| Programming fundamentals, functions, events, DOM manipulation, and interactive web development.
⚙️ C++| Syntax, variables, control flow, functions, arrays, and object-oriented programming.

The curriculum is stored in JSON files, allowing learning content to be organized separately from the frontend interface.

Learning Experience

- Structured chapters and lessons.
- Lesson-based learning progression.
- Interactive questions and quizzes.
- Explanations and feedback.
- Progress recording.
- Support for additional educational content.

Future Learning Expansion

The development roadmap includes expanding the educational experience into:

- HTML and CSS.
- Frontend web development.
- Interactive web applications.
- Advanced programming concepts.
- Practical software development projects.

---

🤖 Cody — AI Learning Assistant

Cody is the AI-assisted educational companion integrated into CodeQuest.

Its purpose is to support the learning process by explaining concepts, helping learners understand errors, and encouraging step-by-step problem-solving.

Intended Capabilities

Capability| Educational Purpose
Concept Explanation| Explain programming concepts in accessible language.
Contextual Guidance| Provide assistance related to the learner's current activity.
Learning Hints| Encourage learners to understand problems before viewing solutions.
Programming Support| Explain code behavior and common errors.
Conversation History| Maintain relevant conversational context.
Question Classification| Classify incoming questions through the Cody ML engine.
Arabic and English| Support communication in both languages.

AI Architecture

Cody's backend uses:

- FastAPI for API routing.
- Google Gemini API for AI-generated responses.
- A question classification component.
- Firebase Authentication for protected access.

Configuration Requirements

To use the AI assistant, the backend requires:

- A valid Gemini API key.
- A configured Gemini model.
- A running backend service.
- Valid Firebase authentication configuration.

AI responses depend on service availability, model configuration, and API limits.

---

💻 Interactive Code Playground

The CodeQuest Playground provides a dedicated environment for writing and experimenting with code.

Supported Languages

Language| Execution Integration
Python| Judge0
JavaScript| Judge0
C++| Judge0

Editor Features

- CodeMirror-based editing.
- Programming language selection.
- Code execution integration.
- Standard input support in the backend.
- Execution output and error handling.
- Project-saving interface.
- Editor reset and clear actions.

Code Execution Flow

1. The learner writes code in the playground.
2. The frontend sends an authenticated execution request.
3. The backend validates the programming language and source code.
4. The execution request is sent to Judge0.
5. The backend retrieves the execution result.
6. The result is returned to the application.

Code execution depends on the availability and configuration of the connected Judge0 service.

---

🎮 Gamification and Progress

CodeQuest incorporates gamification to encourage consistent learning and recognize educational milestones.

Reward Elements

Element| Purpose
⚡ Experience Points (XP)| Measure accumulated learning progress.
⭐ Stars| Reward indicators for supported activities.
🎯 Levels| Represent progression based on accumulated XP.
🏆 Achievements| Recognize selected learning milestones.
🥇 Leaderboard| Display public learning rankings.
🛍️ Store| Allow eligible users to purchase supported items.

Level Calculation

The current level calculation is:

const level = Math.floor(xp / 100) + 1;

Every additional 100 XP increases the learner's level by one.

Lesson Rewards

Lesson reward processing is implemented through Firebase Cloud Functions.

The current lesson reward configuration is:

Reward| Amount
Experience Points| 10 XP
Stars| 1 Star

Reward processing uses Firestore transactions and reward records to prevent duplicate lesson rewards.

Reward Integrity

Reward-related operations are handled through trusted backend logic where implemented.

- Lesson rewards use transaction-based processing.
- Existing completed lesson records can be synchronized through a callable function.
- Store purchases are validated and processed by a Cloud Function.
- Game reward claims remain protected until trusted server-side game-result verification is implemented.

---

🏗️ System Architecture

CodeQuest follows a multi-component architecture that separates the browser interface, backend APIs, authentication, data storage, and external integrations.

Architecture Diagram

flowchart TD
    A["Learner"] --> B["CodeQuest Web Application"]

    B --> C["Authentication"]
    B --> D["Learning Modules"]
    B --> E["Code Playground"]
    B --> F["Cody AI Assistant"]
    B --> G["Progress and Rewards"]

    C --> H["Firebase Authentication"]

    D --> I["JSON Curriculum"]

    E --> J["Firebase Cloud Function"]
    J --> K["Judge0 Execution Service"]

    F --> L["FastAPI Backend"]
    L --> M["Cody ML Engine"]
    L --> N["Google Gemini API"]

    G --> O["Cloud Firestore"]
    G --> P["Firebase Cloud Functions"]

    B --> Q["Cloudflare Worker"]
    B --> R["Service Worker / PWA"]

Architecture Components

Layer| Technology| Responsibility
Frontend| HTML, CSS, JavaScript| Interface and application interactions.
Code Editor| CodeMirror 5| Interactive source-code editing.
Authentication| Firebase Authentication| User identity and authentication.
Database| Cloud Firestore| Application and learner data.
Backend API| FastAPI| Python-based backend services.
AI Integration| Gemini API| AI-assisted educational responses.
ML Component| Python, scikit-learn| Cody question classification.
Code Execution| Judge0| Remote code execution.
Serverless Backend| Firebase Cloud Functions| Trusted application operations.
Edge Services| Cloudflare Workers| Edge API and request handling.
PWA| Web Manifest and Service Worker| Application metadata and selected caching.

---

🛠️ Technology Stack

Frontend

<p>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/CodeMirror-2E3440?style=flat-square" alt="CodeMirror">
</p>Backend and Cloud

<p>
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare">
</p>AI and Machine Learning

<p>
  <img src="https://img.shields.io/badge/Google%20Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white" alt="Google Gemini">
  <img src="https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white" alt="scikit-learn">
</p>External Integrations

- Judge0 — Code execution.
- Firebase Authentication — User authentication.
- Cloud Firestore — Cloud database.
- Firebase Cloud Functions — Server-side application logic.
- Cloudflare Workers — Edge request handling.

---

📁 Project Structure

The following tree represents the main application files and directories.

CodeQuest/
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
├── css/
│   └── style.css
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
├── json/
│   ├── python_curriculum.json
│   ├── js_curriculum.json
│   └── cpp_curriculum.json
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
├── firebase.json
├── firestore.rules
├── manifest.json
├── sw.js
└── README.md

---

⚙️ Backend API

The project includes a FastAPI backend, Firebase Cloud Functions, and a Cloudflare Worker.

FastAPI — Main API

Method| Endpoint| Purpose
"GET"| "/"| Backend root endpoint.
"GET"| "/health"| Backend health check.
"POST"| "/api/quiz/check"| Validate quiz answers.
"POST"| "/api/code/run"| Code execution endpoint.

Cody API

Method| Endpoint| Purpose
"GET"| "/api/cody/health"| Cody service health check.
"POST"| "/api/cody/chat"| AI assistant interaction.

Cody routes require Firebase-authenticated requests.

Cloudflare Worker

Method| Endpoint| Purpose
"GET"| "/health"| Worker health check.
"GET"| "/api/session"| Verify the current Firebase session.
"POST"| "/api/quiz/check"| Validate quiz answers.
"OPTIONS"| Supported routes| Handle CORS preflight requests.

Firebase Cloud Functions

Function| Responsibility
"runCode"| Submit and retrieve code execution results.
"purchaseStoreItem"| Validate and process store purchases.
"awardLessonReward"| Process eligible lesson completion rewards.
"syncExistingLessonRewards"| Synchronize eligible historical lesson rewards.
"claimGameReward"| Currently blocks claims pending trusted verification.
"syncLeaderboard"| Synchronize selected public leaderboard information.

The Firebase Functions runtime is configured for Node.js 22.

---

🗄️ Database Design

CodeQuest uses Cloud Firestore for application data.

Main Collections

Collection| Purpose
"users/{uid}"| User profile and learning statistics.
"users/{uid}/lessonProgress/{lessonId}"| Individual lesson progress records.
"users/{uid}/quizResults/{resultId}"| Quiz result records.
"users/{uid}/gameRewards/{gameId}"| Reward records and duplicate-prevention data.
"users/{uid}/drafts/{draftId}"| User draft data.
"projects/{projectId}"| Project records.
"leaderboardPublic/{uid}"| Selected public leaderboard information.

Data and Privacy Considerations

- User-specific information is stored under authenticated user records.
- Reward operations use trusted backend processing where implemented.
- Public leaderboard synchronization publishes selected display information and XP.
- Email addresses are not included in the leaderboard synchronization payload.
- Firestore security rules should be reviewed alongside backend authorization logic.

---

🚀 Getting Started

Follow these steps to prepare a local development environment.

Prerequisites

Make sure the following tools and services are available:

Requirement| Purpose
Git| Repository management.
Python| FastAPI backend and ML component.
Node.js 22| Firebase Cloud Functions runtime.
Firebase Project| Authentication, Firestore, and Functions.
Gemini API Key| Cody AI integration.
Judge0 Service| Code execution integration.
Modern Web Browser| Running the frontend.

1. Clone the Repository

git clone https://github.com/mariam2009m44-lab/CodeQuest.git

2. Enter the Project Directory

cd CodeQuest

3. Configure the Frontend

Set up the Firebase project configuration used by the frontend.

Verify that the Firebase project settings match the intended development or deployment environment.

4. Install Backend Dependencies

cd backend
pip install -r requirements.txt

5. Configure Backend Environment Variables

Create the required environment configuration before starting the backend.

See "Environment Configuration" (#-environment-configuration).

6. Start the FastAPI Backend

From the "backend" directory:

uvicorn main:app --reload

The local API will be available at:

http://127.0.0.1:8000

7. Open the Frontend

Use a local development server or the configured hosting environment to serve the frontend files.

Some features require additional Firebase, AI, and code execution configuration before they can operate.

---

🔐 Environment Configuration

Backend credentials and private configuration should be provided through environment variables or a suitable secrets manager.

Example

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_configured_gemini_model

JUDGE0_URL=your_judge0_endpoint

CORS_ORIGINS=your_allowed_origins

GOOGLE_APPLICATION_CREDENTIALS=path_to_service_account

Security requirements:

- Never commit actual API keys.
- Never publish service-account private keys.
- Do not expose backend secrets in frontend JavaScript.
- Restrict CORS origins to trusted application domains.
- Keep production credentials separate from development credentials.
- Use appropriate secret-management facilities for deployed services.

The values above are placeholders, not working credentials.

---

🌍 Deployment

CodeQuest contains several components that may require separate deployment and configuration.

Component| Deployment Environment
Frontend| GitHub Pages or compatible static hosting.
FastAPI Backend| Python-compatible hosting environment.
Firebase Authentication| Firebase project.
Cloud Firestore| Firebase project.
Cloud Functions| Firebase Functions deployment.
Cloudflare Worker| Cloudflare Workers.
Cody AI| Backend with configured Gemini API access.
Code Execution| Configured Judge0 service.

Live Platform

The frontend is available at:

"Open CodeQuest — Cody Academy" (https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html)

A successful frontend deployment does not automatically mean that all backend integrations are deployed or configured.

---

🛡️ Security and Privacy

Security is an important part of the CodeQuest architecture.

The project includes several security-related mechanisms:

- Firebase authentication for protected application operations.
- Firebase token verification in backend routes.
- Server-side validation for code execution requests.
- Server-side validation for store purchases.
- Transaction-based lesson reward processing.
- Duplicate reward prevention.
- Restricted public leaderboard data.
- CORS handling in backend services.
- Protection against exposing private API credentials in frontend code.

Security should be reviewed continuously as new features and integrations are introduced.

---

🧪 Testing and Quality Assurance

Testing should cover both individual components and complete learner workflows.

Area| Suggested Verification
Authentication| Registration, login, logout, and protected routes.
Learning| Lesson navigation and progress updates.
Playground| Code editing, execution, and error handling.
Cody AI| Authentication, API availability, and response handling.
XP System| Reward calculations and duplicate prevention.
Store| Purchase validation and inventory updates.
Profile| User information and statistics.
| Leaderboard | Public data synchronization. |
| Mobile Interface | Layout, navigation, and responsiveness. |
| Security | Access control and backend validation. |

A complete automated test suite and production-readiness assessment should be established as part of future quality improvements.

---

📍 Implementation Status

CodeQuest is under active development. The following table distinguishes the main implemented components from features that require further development, configuration, or deployment verification.

Component| Current Status
Frontend Pages| Main application page structure.
Learning Curricula| JSON-based curriculum files.
Code Editor| CodeMirror-based editing environment.
Firebase Authentication| Authentication integration.
Cloud Firestore| Application data storage.
FastAPI Backend| Python API implementation.
Cody AI| Gemini-based backend integration.
Question Classifier| Python ML component.
Code Execution| Judge0 integration through backend services.
Lesson Rewards| Transaction-based Cloud Function processing.
Store Purchases| Server-side purchase validation.
Leaderboard| Public profile and XP synchronization.
Game Rewards| Protected pending trusted result verification.
PWA| Manifest and selected service-worker caching.

Actual runtime availability depends on deployment, credentials, configuration, and external service status.

---

🗺️ Development Roadmap

The roadmap focuses on improving educational depth, platform reliability, and the overall learner experience.

📚 Learning Experience

- [ ] Expand programming curricula and lesson coverage.
- [ ] Add more structured chapters and exercises.
- [ ] Develop complete HTML and CSS learning paths.
- [ ] Expand practical web development projects.
- [ ] Improve lesson explanations and interactive assessments.

🤖 AI and Coding

- [ ] Improve Cody's contextual educational guidance.
- [ ] Enhance the coding playground experience.
- [ ] Improve code execution feedback.
- [ ] Expand debugging and learning assistance.
- [ ] Improve AI response evaluation and error handling.

⚙️ Platform and Reliability

- [ ] Complete trusted game reward verification.
- [ ] Improve progress synchronization.
- [ ] Expand automated testing.
- [ ] Strengthen application security reviews.
- [ ] Improve mobile accessibility and usability.
- [ ] Improve deployment and monitoring workflows.

---

🤝 Contributing

Ideas, suggestions, bug reports, and technical improvements are welcome.

Contribution Workflow

1. Fork the repository.
2. Create a dedicated feature branch.
3. Implement your changes.
4. Test the affected functionality.
5. Commit your changes with a clear message.
6. Submit a pull request describing your contribution.

Example Git Workflow

git checkout -b feature/your-feature

git add .

git commit -m "Add: your feature description"

git push origin feature/your-feature

Please keep contributions consistent with the existing architecture and preserve established interface behavior unless a redesign is explicitly intended.

---

👩‍💻 Project Information

Detail| Information
Project Name| CodeQuest — Cody Academy
Developer| Mariam Fouad Moustafa Mowina
Repository| "GitHub Repository" (https://github.com/mariam2009m44-lab/CodeQuest)
Live Platform| "Open CodeQuest" (https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html)
Primary Focus| AI-Assisted Programming Education
Interface Language| Arabic
Layout Direction| Right-to-Left (RTL)
Project Type| Web Application
Development Status| Active Development

---

📄 License

No specific open-source license is currently declared in this repository.

Until a license is added, the project should not be assumed to grant permission for redistribution, modification, or commercial reuse.

---

🌟 Vision for the Future

CodeQuest aims to grow into an educational environment where programming is not only something learners read about, but something they actively practice, explore, and use to create.

By combining structured curricula, interactive development tools, AI-assisted learning, and meaningful progress tracking, Cody Academy seeks to make the first steps into software development more accessible.

The journey is just beginning.

---

<p align="center">
  <img src="https://img.shields.io/badge/Built%20with-Curiosity%20%26%20Creativity-7955E8?style=for-the-badge" alt="Built with curiosity and creativity">
</p><p align="center">
  <strong>CodeQuest — Cody Academy</strong>
  <br>
  <em>Learn. Create. Experiment. Grow.</em>
  <br><br>
  Made with dedication by Mariam Fouad Moustafa Mowina.
</p>