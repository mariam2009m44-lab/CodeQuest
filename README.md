🚀 CodeQuest — Cody Academy

An Interactive, AI-Assisted Programming Learning Platform

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20Application-7955E8?style=for-the-badge" alt="Platform">
  <img src="https://img.shields.io/badge/Language-Arabic%20%7C%20RTL-36BFE5?style=for-the-badge" alt="Language">
  <img src="https://img.shields.io/badge/AI-Powered-43C99A?style=for-the-badge" alt="AI Powered">
  <img src="https://img.shields.io/badge/Status-Active%20Development-FFD66B?style=for-the-badge" alt="Status">
</p><p align="center">
  <b>Learn to Code. Build Projects. Play. Grow.</b>
  <br>
  An educational environment designed to make programming more accessible, interactive, and engaging for young learners.
</p><p align="center">
  <a href="https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html">Live Platform</a>
  ·
  <a href="https://github.com/mariam2009m44-lab/CodeQuest">GitHub Repository</a>
  ·
  <a href="https://github.com/mariam2009m44-lab">Developer Profile</a>
</p>---

📌 Overview

CodeQuest — Cody Academy is an Arabic-first programming education platform that combines structured learning, interactive coding, gamification, and AI-assisted guidance.

The platform is designed to help beginners understand programming concepts through lessons, practical exercises, coding challenges, and projects.

Its learning experience is built around Cody, an educational assistant intended to guide learners through programming concepts and support their problem-solving process.

Rather than presenting programming as a collection of theoretical explanations, CodeQuest aims to create a learning environment where students can explore, experiment, practice, and track their progress.

✨ Key Features

Feature| Description
📚 Structured Learning| Organized programming lessons and learning tracks.
💻 Interactive Playground| A coding environment for writing and running code.
🤖 Cody AI Assistant| AI-assisted explanations, hints, and learning support.
🎮 Educational Games| Game-based activities designed to reinforce concepts.
🏆 Achievements| Recognition for learning milestones and activities.
⭐ XP & Stars| A gamification system for tracking learning rewards.
👤 User Profiles| Personal learning information and progress.
📊 Progress Tracking| A dedicated view of learning activity and achievements.
🥇 Leaderboard| A competitive learning experience based on recorded progress.
📱 Responsive Interface| An interface designed for different screen sizes.
🌐 Arabic RTL Support| Right-to-left layout and Arabic-first content.
🔐 Authentication| Firebase-based user authentication and access control.

«Development note: Feature availability depends on the implementation and configuration of the connected services. The presence of a user interface does not necessarily mean that every feature is fully operational.»

---

🖥️ Platform Preview

<p align="center">
  <a href="https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html">
    <img src="https://img.shields.io/badge/OPEN-LIVE%20PLATFORM-7955E8?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Open Live Platform">
  </a>
</p>Explore the platform:

Page| Purpose
Dashboard| Main learning dashboard
Learning Tracks| Programming language selection
Playground| Interactive coding environment
Profile| Personal account information
Progress| Learning statistics and progress
Achievements| Earned milestones and rewards
Games| Educational games
Projects| Practical programming activities
Leaderboard| Learner rankings
Store| Platform reward store

---

🧠 Learning Tracks

CodeQuest is designed around multiple programming learning paths.

Track| Main Topics
🐍 Python| Variables, data types, conditions, loops, functions, and practical programming.
🟨 JavaScript| Fundamentals, DOM manipulation, events, and interactive web development.
⚙️ C++| Syntax, variables, control flow, functions, arrays, and object-oriented programming.

The curriculum is intended to expand into additional topics, including:

- HTML and CSS.
- Web development.
- Interactive web applications.
- Advanced programming concepts.
- Practical coding projects.

---

💻 Interactive Coding Environment

The CodeQuest Playground provides a dedicated interface for writing and experimenting with code.

Supported Languages

Language| Environment
Python| Python coding experience
JavaScript| Browser-based JavaScript environment
C++| C++ execution integration

Playground Capabilities

- Code editing with CodeMirror.
- Language selection.
- Code execution integration.
- Output and feedback areas.
- Saving and managing coding projects.
- Resetting and clearing the editor.

The execution process depends on the configured backend and external execution services.

---

🤖 Cody — AI Learning Assistant

Cody is the educational assistant concept at the center of the learning experience.

Its purpose is to help learners understand programming instead of simply providing ready-made answers.

Intended Learning Experience

Capability| Purpose
Concept Explanation| Explain programming topics in accessible language.
Learning Guidance| Help learners understand what to study next.
Contextual Hints| Provide guidance while solving exercises.
Quiz Support| Assist with understanding questions and feedback.
Problem Solving| Encourage step-by-step reasoning.

AI Integration

The backend includes an AI assistant integration designed around the Gemini API.

Configuration required:

- Gemini API key.
- Configured model.
- Backend service availability.

AI responses depend on API availability, configuration, and implementation.

---

🎮 Gamification System

CodeQuest uses gamification to make learning more engaging.

Element| Description
⭐ Stars| Reward indicators.
⚡ XP| Experience points earned through supported activities.
🎯 Levels| Progression based on accumulated XP.
🏆 Achievements| Recognition of learning milestones.
🥇 Leaderboard| Public learning rankings.

XP Level Calculation

The current level calculation is based on accumulated experience points:

const level = Math.floor(xp / 100) + 1;

This means that every 100 XP increases the learner's level by one.

Reward Integrity

Reward-related operations use Firebase Cloud Functions where implemented.

Duplicate lesson rewards are handled through transaction-based processing. Game reward claims require trusted server-side result verification before they can be safely enabled.

---

🏗️ System Architecture

CodeQuest combines a browser-based frontend with backend services and cloud integrations.

flowchart TD
    A["Learner"] --> B["CodeQuest Frontend"]
    B --> C["Authentication"]
    B --> D["Learning Modules"]
    B --> E["Coding Playground"]
    B --> F["Cody AI Assistant"]
    B --> G["Progress and Rewards"]

    C --> H["Firebase Authentication"]
    D --> I["Curriculum Data"]
    E --> J["Backend / Code Execution"]
    F --> K["FastAPI + Gemini"]
    G --> L["Cloud Firestore"]
    G --> M["Firebase Cloud Functions"]

    J --> N["Judge0 Integration"]
    B --> O["Cloudflare Worker"]

Architecture Components

Layer| Technology| Responsibility
Frontend| HTML, CSS, JavaScript| User interface and interactions
Code Editor| CodeMirror 5| Interactive code editing
Authentication| Firebase Authentication| User identity and access
Database| Cloud Firestore| User and application data
Backend API| FastAPI| Backend endpoints
AI Integration| Gemini API| AI-assisted learning
Code Execution| Judge0 integration| Code execution service
Serverless Functions| Firebase Cloud Functions| Trusted backend operations
Edge Layer| Cloudflare Workers| Edge API functionality
PWA| Service Worker| Selected caching and offline-related support

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
</p>AI and Integrations

<p>
  <img src="https://img.shields.io/badge/Google%20Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white" alt="Gemini">
  <img src="https://img.shields.io/badge/Judge0-34495E?style=flat-square" alt="Judge0">
</p>---

📂 Project Structure

The following is a representative overview of the repository structure.

CodeQuest/
│
├── index.html
├── dashboard.html
├── login.html
├── signup.html
│
├── languages.html
├── lecture.html
├── playground.html
│
├── profile.html
├── progress.html
├── achievements.html
├── leaderboard.html
│
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

🔥 Firebase Integration

Firebase is used for authentication, database operations, and selected trusted backend processes.

Firestore Data Structure

users/
  {uid}/
    lessonProgress/
      {lessonId}

    quizResults/
      {resultId}

    gameRewards/
      {gameId}

    drafts/
      {draftId}

projects/
  {projectId}

leaderboardPublic/
  {uid}

Cloud Functions

The Firebase Functions code includes the following exported operations:

Function| Responsibility
"runCode"| Code execution operation
"purchaseStoreItem"| Store purchase processing
"awardLessonReward"| Lesson reward processing
"syncExistingLessonRewards"| Existing lesson reward synchronization
"claimGameReward"| Game reward claim validation
"syncLeaderboard"| Public leaderboard synchronization

Security considerations:

- Sensitive operations should be performed on trusted backend services.
- Firestore security rules should restrict unauthorized access.
- API keys and service credentials must not be committed to the repository.
- Public leaderboard data should contain only the information intended for public display.

---

⚙️ Backend API

The FastAPI backend contains the following documented application routes.

Main API

Method| Endpoint| Purpose
GET| "/"| Backend root
GET| "/health"| Health check
POST| "/api/quiz/check"| Quiz checking
POST| "/api/code/run"| Code execution

Cody API

Method| Endpoint| Purpose
GET| "/api/cody/health"| Cody service health check
POST| "/api/cody/chat"| AI assistant interaction

Cloudflare Worker

Method| Endpoint| Purpose
GET| "/health"| Worker health check
GET| "/api/session"| Session-related endpoint
POST| "/api/quiz/check"| Quiz checking
OPTIONS| Supported routes| CORS preflight handling

---

🚀 Getting Started

Prerequisites

Before setting up the project, make sure you have:

- Git.
- A modern web browser.
- Python installed for backend development.
- Node.js for Firebase Functions.
- A Firebase project.
- Gemini API credentials if using Cody AI.
- Judge0 configuration if using the external code execution service.

1. Clone the Repository

git clone https://github.com/mariam2009m44-lab/CodeQuest.git

2. Enter the Project Directory

cd CodeQuest

3. Configure the Frontend

Configure Firebase using the project's Firebase configuration file.

Do not expose private credentials in publicly accessible frontend code.

4. Install Backend Dependencies

cd backend
pip install -r requirements.txt

5. Run the Backend

uvicorn main:app --reload

6. Access the Application

Open the frontend through a local development server or the configured hosting environment.

«Some application features require additional Firebase, AI, and code execution configuration before they can operate.»

---

🔐 Environment Configuration

Backend credentials should be stored in environment variables or an appropriate secrets manager.

Example configuration:

GEMINI_API_KEY=your_api_key
GEMINI_MODEL=your_configured_model
JUDGE0_URL=your_judge0_endpoint
CORS_ORIGINS=your_allowed_origins
GOOGLE_APPLICATION_CREDENTIALS=path_to_service_account

Important: This is an example configuration. Replace the placeholder values with valid settings. Never publish actual API keys, private keys, or service-account credentials.

---

🌍 Deployment

The project uses separate deployment considerations for its frontend and backend components.

Component| Deployment Consideration
Frontend| GitHub Pages or another static hosting provider
FastAPI Backend| A compatible Python hosting environment
Firebase| Firebase project configuration
Cloud Functions| Firebase Functions deployment
Cloudflare Worker| Cloudflare Worker deployment
AI Integration| Configured Gemini API access
Code Execution| Configured Judge0 service

The live frontend is available at:

"CodeQuest — Live Platform" (https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html)

A working frontend deployment does not automatically mean that every backend integration is deployed or configured.

---

🧪 Testing and Quality Assurance

Testing should cover both individual features and complete learner journeys.

Area| What to Verify
Authentication| Registration, login, logout, and protected pages
Learning| Lesson navigation and progress updates
Playground| Editor interactions and execution responses
AI Assistant| API availability and response handling
XP System| Correct calculations and duplicate prevention
Profile| Accurate user information and statistics
Leaderboard| Correct synchronization and public data
Mobile UI| Navigation, layout, and responsive behavior
Security| Access control and backend validation

---

📍 Implementation Status

CodeQuest is under active development. The following distinctions are important when evaluating the project.

Component| Implementation Context
Frontend Pages| Project interface and page structure
Learning Curricula| JSON-based curriculum files
Code Playground| CodeMirror-based editing environment
Firebase Authentication| Firebase integration
Firestore| Application data storage
FastAPI| Backend API implementation
Cody AI| Gemini-based integration
Judge0| External code execution integration
XP and Lesson Rewards| Cloud Function-based reward processing
Game Rewards| Requires trusted server-side result verification
PWA| Selected caching through the service worker

The implementation status of each component should be verified against its deployment configuration and runtime behavior.

---

🗺️ Development Roadmap

The project roadmap focuses on improving the learning experience, reliability, and educational value.

- [ ] Expand the programming curricula.
- [ ] Add more structured lessons and chapters.
- [ ] Expand HTML and CSS learning paths.
- [ ] Develop more practical web development projects.
- [ ] Improve Cody's contextual educational guidance.
- [ ] Enhance the coding playground.
- [ ] Improve game-based learning activities.
- [ ] Strengthen progress synchronization.
- [ ] Complete trusted game reward verification.
- [ ] Improve automated testing and error handling.
- [ ] Continue improving mobile accessibility.

---

🛡️ Privacy and Responsible AI

CodeQuest is designed with educational use in mind.

Important development principles include:

- Protecting user authentication credentials.
- Restricting access to personal learning data.
- Keeping private API credentials on trusted services.
- Validating backend operations.
- Avoiding unnecessary exposure of personal information.
- Using AI as a learning aid rather than a replacement for understanding.
- Reviewing AI-generated explanations and code before relying on them.

---

🤝 Contributing

Suggestions, bug reports, and improvements are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the relevant functionality.
5. Submit a pull request describing your improvements.

git checkout -b feature/your-feature
git add .
git commit -m "Add: your feature description"
git push origin feature/your-feature

Please keep contributions consistent with the existing project architecture and preserve established user-interface behavior unless a redesign is specifically intended.

---

👩‍💻 Project Information

Detail| Information
Project| CodeQuest — Cody Academy
Developer| Mariam Fouad Moustafa Mowina
Repository| "GitHub" (https://github.com/mariam2009m44-lab/CodeQuest)
Live Platform| "Open CodeQuest" (https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html)
Primary Focus| AI-Assisted Programming Education
Interface Language| Arabic
Development| Active

---

📄 License

No specific open-source license is currently declared in this repository.

Until a license is added, the project should not be assumed to grant permission for redistribution, modification, or commercial reuse.

---

<p align="center">
  <b>CodeQuest — Cody Academy</b>
  <br>
  Learn. Create. Experiment. Grow.
  <br><br>
  <i>Making programming more accessible, one step at a time.</i>
</p>
---

🌟 Vision

CodeQuest aims to make programming education more accessible by combining technology, creativity, and interactive learning.

The long-term vision is to build an educational ecosystem where learners can:

- Understand programming through structured learning experiences.
- Develop practical problem-solving skills.
- Experiment with real coding projects.
- Receive guided support while learning.
- Track their progress and celebrate achievements.
- Build confidence through consistent practice.

💜 Acknowledgements

CodeQuest builds upon technologies and services developed by the open-source and developer communities.

Special recognition goes to the developers, educators, and technology communities whose tools and resources make projects like this possible.

---

<p align="center">
  <img src="https://img.shields.io/badge/Built%20with-Curiosity%20%26%20Creativity-7955E8?style=for-the-badge" alt="Built with curiosity and creativity">
</p><p align="center">
  <strong>CodeQuest — Cody Academy</strong>
  <br>
  <i>Learn. Create. Experiment. Grow.</i>
  <br><br>
  Made with dedication by Mariam Fouad Moustafa Mowina.
</p>