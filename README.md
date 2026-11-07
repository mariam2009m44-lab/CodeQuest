# 🚀 CodeQuest — Cody Academy

<p align="center">
  <strong>An Interactive Programming Learning Platform</strong>
  <br>
  <em>Learn to Code · Practice · Create · Explore</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20Application-7955E8?style=for-the-badge" alt="Web Application">
  <img src="https://img.shields.io/badge/Interface-Arabic%20%7C%20RTL-36BFE5?style=for-the-badge" alt="Arabic RTL">
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-43C99A?style=for-the-badge" alt="Frontend">
  <img src="https://img.shields.io/badge/AI-Cody%20Assistant-9B7EDE?style=for-the-badge" alt="Cody AI">
</p>

<p align="center">
  <a href="https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html">🌐 Live Application</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/mariam2009m44-lab/CodeQuest">💻 GitHub Repository</a>
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Project Vision](#-project-vision)
- [Programming Languages](#-programming-languages)
- [Core Features](#-core-features)
- [Learning Curriculum](#-learning-curriculum)
- [Cody AI Assistant](#-cody-ai-assistant)
- [Cody Machine Learning Engine](#-cody-machine-learning-engine)
- [Interactive Code Playground](#-interactive-code-playground)
- [Progress and Gamification](#-progress-and-gamification)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Backend API](#-backend-api)
- [Firebase and Database](#-firebase-and-database)
- [Cloudflare Worker](#-cloudflare-worker)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Testing and Quality Assurance](#-testing-and-quality-assurance)
- [Deployment](#-deployment)
- [Security](#-security)
- [Implementation Notes](#-implementation-notes)
- [Development Roadmap](#-development-roadmap)
- [Contributing](#-contributing)
- [Project Information](#-project-information)
- [License](#-license)

---

## 🌟 Overview

**CodeQuest — Cody Academy** is an interactive, web-based programming education platform designed to make programming more accessible, engaging, and practical.

The project brings together programming lessons, interactive learning activities, coding environments, AI-assisted educational support, and progress tracking.

Built with an Arabic-first interface and right-to-left (RTL) layout, CodeQuest aims to provide learners with an organized environment where they can explore programming concepts, practice writing code, and develop their technical skills.

The platform combines a multi-page web application with backend services, Firebase integration, an AI-powered educational assistant, and a separate React/Vite application workspace.

## 🎯 Project Vision

CodeQuest is built around one central idea:

**Learning programming should involve understanding, experimentation, and practical application — not just reading code.**

The project's objectives include:

- Making programming concepts easier to approach through structured lessons.
- Providing interactive learning experiences.
- Supporting learners with Cody, an AI-assisted educational companion.
- Connecting learning progress with user profiles and rewards.
- Providing browser-based coding environments.
- Organizing programming content into dedicated learning paths.
- Building a platform that can expand with additional lessons and educational features.

---

## 💻 Programming Languages

CodeQuest includes programming-language learning resources and coding support.

### Language Icons

The following original Devicon SVG assets are used for the language illustrations.

<p align="center">
  <a href="https://www.python.org/">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="85" height="85" alt="Python Original Logo">
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://www.oracle.com/java/">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" width="85" height="85" alt="Java Original Logo">
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://isocpp.org/">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg" width="85" height="85" alt="C++ Original Logo">
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width="85" height="85" alt="JavaScript Original Logo">
  </a>
</p>

<p align="center">
  <strong>Python</strong>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <strong>Java</strong>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <strong>C++</strong>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <strong>JavaScript</strong>
</p>

### Main Learning Tracks

The main language-selection page (`languages.html`) currently provides three learning paths:

| Language | Main Learning Entry | Curriculum File |
|---|---|---|
| Python | `python-welcome.html` | `json/python_curriculum.json` |
| JavaScript | `levels.html?lang=javascript` | `json/js_curriculum.json` |
| C++ | `levels.html?lang=cpp` | `json/cpp_curriculum.json` |

### Additional Java Pages

The repository also contains dedicated Java learning pages:

- `java-chapters.html`
- `java-lessons.html`

These are separate Java resources and are not listed as one of the three main language cards in `languages.html`.

---

## ✨ Core Features

| Feature | Description |
|---|---|
| Arabic-First Interface | Arabic interface with right-to-left layout support. |
| Learning Paths | Dedicated Python, JavaScript, and C++ learning paths. |
| Structured Curriculum | Programming content organized into chapters and lessons. |
| Interactive Lessons | Lesson content, hints, quizzes, and progress-related interactions. |
| Code Playground | Browser-based code editor powered by CodeMirror. |
| Cody AI | AI-assisted educational chat and explanations. |
| User Authentication | Firebase Authentication integration. |
| User Profiles | Personal learning information and progress tracking. |
| Gamification | XP, stars, levels, coins, and learning rewards. |
| Achievements | Dedicated achievements page. |
| Leaderboard | Public leaderboard synchronization. |
| Games | Multiple standalone educational game pages. |
| Projects | Dedicated project-related learning page. |
| Store | User store and server-side purchase functionality. |
| PWA Support | Web app manifest and service-worker functionality. |
| Responsive Design | Interfaces designed for different screen sizes. |

---

## 📚 Learning Curriculum

The main curriculum files are stored in the repository's `json/` directory.

Each curriculum contains chapters and lesson data used by the learning system.

### Python Curriculum

<details>
<summary><strong>12 Chapters — Python Learning Path</strong></summary>

1. الفصل الأول: البداية والطباعة
2. الفصل الثاني: المتغيرات
3. الفصل الثالث: العمليات الحسابية
4. الفصل الرابع: الشروط واتخاذ القرار
5. الفصل الخامس: الحلقات التكرارية
6. الفصل السادس: القوائم
7. الفصل السابع: الدوال
8. الفصل الثامن: التعامل مع النصوص
9. الفصل التاسع: الأخطاء وتصحيحها
10. الفصل العاشر: القواميس والمجموعات
11. الفصل الحادي عشر: المكتبات والملفات
12. الفصل الثاني عشر: المشروع النهائي

**Source:** `json/python_curriculum.json`

</details>

### JavaScript Curriculum

<details>
<summary><strong>8 Chapters — JavaScript Learning Path</strong></summary>

1. الفصل الأول: البداية والمتغيرات
2. الفصل الثاني: أنواع البيانات والعمليات
3. الفصل الثالث: الشروط
4. الفصل الرابع: الحلقات
5. الفصل الخامس: الدوال
6. الفصل السادس: المصفوفات والكائنات
7. الفصل السابع: النصوص وتصحيح الأخطاء
8. الفصل الثامن: مشروع نهائي

**Source:** `json/js_curriculum.json`

</details>

### C++ Curriculum

<details>
<summary><strong>7 Chapters — C++ Learning Path</strong></summary>

1. الفصل الأول: البداية مع C++
2. الفصل الثاني: اتخاذ القرارات
3. الفصل الثالث: الحلقات التكرارية
4. الفصل الرابع: الدوال
5. الفصل الخامس: المصفوفات والنصوص
6. الفصل السادس: المراجع والمؤشرات
7. الفصل السابع: تطبيقات عملية

**Source:** `json/cpp_curriculum.json`

</details>

### Curriculum Loading

The frontend curriculum loader is implemented in:

`js/curriculum.js`

It loads the three main curriculum files:

```javascript
const CURRICULUM_FILES = Object.freeze({
  python: "./json/python_curriculum.json",
  javascript: "./json/js_curriculum.json",
  cpp: "./json/cpp_curriculum.json"
});
```

---

## 🤖 Cody AI Assistant

**Cody** is the AI-assisted educational companion integrated into CodeQuest.

It is designed to support learners while they study programming concepts and work through coding activities.

### Main Capabilities

- AI-assisted educational conversations.
- Explanations of programming concepts.
- Context-aware learning assistance.
- Support for understanding coding questions.
- Integration with the platform's backend services.

### Backend Integration

Cody's backend implementation is organized in:

- `backend/cody_chat.py`
- `backend/main.py`

The service uses Google's Gemini API.

The Gemini model can be configured through the backend environment configuration.

### API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/cody/health` | Cody service health check. |
| POST | `/api/cody/chat` | AI-assisted educational chat. |

Cody's availability depends on the backend service and its required configuration.

---

## 🧠 Cody Machine Learning Engine

CodeQuest includes a separate machine learning component under:

`cody-ml-engine/`

This component provides a question-classification system designed to identify the general category of incoming educational questions.

### Technology

| Component | Implementation |
|---|---|
| Text Features | TF-IDF |
| N-gram Range | Character n-grams (2, 5) |
| Feature Limit | 15,000 |
| Classification Model | Logistic Regression |
| Model Persistence | Joblib |

### Supported Categories

The classifier includes six categories:

1. Programming
2. Mathematics
3. Science
4. General Knowledge
5. Lesson Help
6. Code Debugging

### Main Files

```text
cody-ml-engine/
├── data/
│   └── training_data.json
├── src/
│   ├── question_classifier.py
│   └── train.py
└── tests/
```

### Purpose

The machine learning engine is intended to help organize educational questions into meaningful categories.

It is a separate component from the Gemini-powered Cody chat service.

---

## 🧑‍💻 Interactive Code Playground

CodeQuest includes a browser-based coding environment.

The main playground page is:

`playground.html`

### Editor Technology

The editor uses **CodeMirror 5.65.16**.

### Supported Languages

- JavaScript
- Python
- C++

### Playground Capabilities

- Browser-based code editing.
- Language selection.
- Code execution through the backend integration.
- Project-related editing and saving functionality.
- Example code and editor controls.

### Code Execution

Code execution is connected to the backend and uses Judge0 integration.

The backend handles execution requests rather than relying on unrestricted execution inside the browser.

---

## 🏆 Progress and Gamification

CodeQuest includes progress-related features designed to make learning more interactive.

### Progress Elements

| Element | Purpose |
|---|---|
| XP | Experience points earned through supported learning activities. |
| Levels | Learning progression based on accumulated XP. |
| Stars | Rewards associated with supported lesson completion. |
| Coins | Platform currency used by store-related functionality. |
| Achievements | Recognition of learning milestones. |
| Leaderboard | Public learning-progress rankings. |
| Profile | Personal learning information and progress. |

### Level Calculation

The level calculation used by the platform follows this formula:

```javascript
Math.floor(xp / 100) + 1
```

### Lesson Rewards

The Firebase Functions implementation includes:

`awardLessonReward`

The lesson reward function uses a Firestore transaction and duplicate-prevention logic.

The configured lesson reward is:

- 10 XP
- 1 star

### Game Rewards

The repository includes a game reward claim function.

However, game reward claims currently require trusted server-side game-result verification. They should not be considered fully enabled until that verification is implemented.

### Store

The store functionality includes server-side purchase handling.

Configured example store items include:

| Item | Price |
|---|---:|
| Astronaut | 150 |
| Fox | 200 |
| Robot | 300 |
| Dragon | 500 |

---

## 🛠️ Technology Stack

CodeQuest combines frontend technologies, backend services, cloud integrations, and machine learning components.

### Frontend

<p>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
</p>

- HTML5
- CSS3
- JavaScript
- React
- Vite
- CodeMirror
- Remix Icon

### Backend

<p>
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js">
</p>

- Python
- FastAPI
- Node.js
- Firebase Functions

### Database and Cloud Services

<p>
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare">
</p>

- Firebase Authentication
- Cloud Firestore
- Firebase Functions
- Cloudflare Workers

### AI and Machine Learning

- Google Gemini API
- Scikit-learn
- TF-IDF
- Logistic Regression
- Joblib

### Code Execution

- Judge0 integration

### Development and Testing

- Git
- GitHub
- GitHub Actions
- Pytest
- npm
- Vite

---

## 🏗️ System Architecture

CodeQuest is organized into multiple application and service components.

```mermaid
flowchart TD
    A["Learner"] --> B["CodeQuest Frontend"]

    B --> C["Learning Paths"]
    B --> D["Code Playground"]
    B --> E["User Profile"]
    B --> F["Educational Games"]
    B --> G["Cody Assistant"]

    C --> H["Curriculum JSON Files"]
    D --> I["FastAPI Backend"]
    G --> I

    I --> J["Judge0 Integration"]
    I --> K["Gemini API"]
    I --> L["Firebase Services"]

    L --> M["Authentication"]
    L --> N["Cloud Firestore"]
    L --> O["Firebase Functions"]

    G --> P["Cody ML Engine"]

    B --> Q["Cloudflare Worker"]
```

### Architecture Components

| Component | Responsibility |
|---|---|
| Frontend | User interface and learning experience. |
| Curriculum Files | Structured programming lesson data. |
| FastAPI Backend | API services and backend integration. |
| Cody Service | AI-assisted educational conversations. |
| Cody ML Engine | Educational question classification. |
| Judge0 | Remote code execution integration. |
| Firebase | Authentication, database, and server-side functions. |
| Cloudflare Worker | Additional edge API functionality. |

---

## 📁 Project Structure

The following is a representative overview of the repository's main components.

```text
CodeQuest/
│
├── .github/
│   └── workflows/
│       ├── cody-ml-tests.yml
│       ├── project-checks.yml
│       └── seed-quiz-answers.yml
│
├── backend/
│   ├── main.py
│   ├── cody_chat.py
│   ├── requirements.txt
│   └── tests/
│       └── test_api.py
│
├── cody-ml-engine/
│   ├── data/
│   │   └── training_data.json
│   ├── src/
│   │   ├── question_classifier.py
│   │   └── train.py
│   ├── tests/
│   └── requirements.txt
│
├── cloudflare-worker/
│   ├── worker.js
│   ├── package.json
│   └── wrangler.toml
│
├── functions/
│   └── index.js
│
├── json/
│   ├── python_curriculum.json
│   ├── js_curriculum.json
│   └── cpp_curriculum.json
│
├── js/
│   └── curriculum.js
│
├── CodeQuest/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│
├── index.html
├── dashboard.html
├── languages.html
├── levels.html
├── lecture.html
├── playground.html
│
├── python-welcome.html
├── python-chapters.html
├── python-lesson.html
├── python-exam.html
│
├── java-chapters.html
├── java-lessons.html
│
├── games.html
├── game-bug.html
├── game-build.html
├── game-match.html
├── game-memory.html
├── game-quiz.html
├── game-speed.html
│
├── profile.html
├── progress.html
├── leaderboard.html
├── achievements.html
├── projects.html
├── store.html
├── settings.html
├── login.html
├── signup.html
│
├── manifest.json
└── sw.js
```

*Note: This is a representative structure highlighting important files and directories, not an exhaustive listing of every repository file.*

---

## ⚙️ Backend API

The FastAPI application is implemented in:

`backend/main.py`

The backend provides endpoints for health checks, code execution, quiz checking, and Cody-related functionality.

### Available Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend root endpoint. |
| GET | `/health` | Backend health check. |
| POST | `/api/quiz/check` | Quiz answer checking. |
| POST | `/api/code/run` | Code execution request. |
| GET | `/api/cody/health` | Cody service health check. |
| POST | `/api/cody/chat` | Cody AI chat endpoint. |

### Backend Dependencies

The backend dependencies are listed in:

`backend/requirements.txt`

### Running the Backend

From the repository root:

```bash
pip install -r backend/requirements.txt
```

Start the FastAPI application:

```bash
uvicorn backend.main:app --reload
```

The local development server is available at:

```text
http://127.0.0.1:8000
```

The interactive API documentation is generally available at:

```text
http://127.0.0.1:8000/docs
```

---

## 🔥 Firebase and Database

Firebase provides authentication, data storage, and server-side functionality.

### Firebase Services

- Firebase Authentication
- Cloud Firestore
- Firebase Functions

### Firestore Data Organization

The backend and frontend use structured Firestore collections and documents.

Important paths include:

```text
users/{uid}
users/{uid}/lessonProgress/{lessonId}
users/{uid}/quizResults/{resultId}
users/{uid}/gameRewards/{gameId}
users/{uid}/drafts/{draftId}

projects/{projectId}

leaderboardPublic/{uid}
```

### Firebase Functions

The Firebase Functions implementation is located in:

`functions/index.js`

The repository includes functions for:

| Function | Purpose |
|---|---|
| `runCode` | Code execution functionality. |
| `purchaseStoreItem` | Store purchase processing. |
| `awardLessonReward` | Lesson reward processing. |
| `syncExistingLessonRewards` | Synchronization of existing lesson rewards. |
| `claimGameReward` | Game reward claim handling. |
| `syncLeaderboard` | Public leaderboard synchronization. |

### Runtime Configuration

The Firebase Functions package uses Node.js 22.

Functions with an explicitly configured region use:

```text
europe-west1
```

---

## ☁️ Cloudflare Worker

The repository includes a Cloudflare Worker implementation under:

`cloudflare-worker/`

### Main Files

```text
cloudflare-worker/
├── worker.js
├── package.json
└── wrangler.toml
```

### Routes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Worker health check. |
| GET | `/api/session` | Session-related endpoint. |
| POST | `/api/quiz/check` | Quiz checking endpoint. |
| OPTIONS | Applicable routes | CORS preflight handling. |

### Authentication

The Worker includes Firebase JWT verification using the `jose` library and a Firebase project ID binding.

The Worker is an additional backend component and is separate from the main FastAPI application.

---

## 🚀 Getting Started

Follow these steps to prepare a local development environment.

### 1. Clone the Repository

```bash
git clone https://github.com/mariam2009m44-lab/CodeQuest.git
cd CodeQuest
