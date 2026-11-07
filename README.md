CodeQuest — Cody Academy

An Interactive, AI-Assisted Programming Learning Platform

<p align="center">
  <strong>Learn to Code. Build Projects. Explore Technology.</strong>
</p><p align="center">
  <a href="https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html">Live Application</a>
  ·
  <a href="https://github.com/mariam2009m44-lab/CodeQuest">GitHub Repository</a>
</p>---

1. Project Overview

CodeQuest, also known as Cody Academy, is an interactive programming education platform designed to make learning software development more accessible, engaging, and practical for young learners.

The platform combines structured programming lessons, interactive coding activities, educational games, progress tracking, and AI-assisted learning experiences within a unified environment.

Its central concept is to transform programming education from a passive learning experience into an active journey where learners can explore concepts, experiment with code, solve challenges, and gradually develop practical programming skills.

Cody, the platform's educational companion, is designed to support learners throughout this journey by helping them understand programming concepts and approach coding challenges more effectively.

CodeQuest aims to connect learning, experimentation, creativity, and measurable progress in one educational experience.

2. Vision and Mission

Vision

To create an accessible and engaging digital learning environment where young learners can develop computational thinking, programming knowledge, and problem-solving skills through interactive experiences.

Mission

- Simplify programming concepts through structured and understandable learning experiences.
- Encourage learning by doing through interactive coding environments.
- Introduce AI-assisted educational support.
- Motivate consistent learning through progress tracking and gamification.
- Help learners move from understanding programming concepts to building their own projects.
- Provide an accessible interface suitable for different learning levels.

3. Core Objectives

CodeQuest is designed around the following educational and technical objectives:

1. Accessibility: Make programming education easier to approach for beginners.
2. Practical Learning: Provide opportunities to experiment with code rather than relying exclusively on theoretical explanations.
3. Personal Progress: Help learners understand their progress and learning achievements.
4. Engagement: Use interactive activities and gamification to encourage participation.
5. AI-Assisted Support: Explore how AI can provide contextual educational assistance.
6. Creativity: Encourage learners to develop ideas and turn them into programming projects.

4. Key Features

4.1. Structured Learning Environment

The platform provides dedicated learning experiences and programming content organized around different programming topics.

Its learning environment is designed to support:

- Step-by-step lessons.
- Programming explanations and examples.
- Learning paths and topic navigation.
- Interactive educational activities.
- Knowledge assessment and practice.
- Progress-aware learning experiences.

The curriculum is maintained through structured content files, allowing educational material to be organized separately from the interface.

4.2. Interactive Code Playground

CodeQuest includes a dedicated programming workspace that allows learners to experiment with code.

The playground is built around CodeMirror and provides a coding-oriented interface.

Its intended capabilities include:

- Writing and editing source code.
- Working with supported programming languages.
- Running code through the configured execution service.
- Resetting and clearing the editor.
- Working with example code.
- Saving and accessing supported project data.

The execution workflow relies on the application's backend and configured code-execution integration.

4.3. Cody — AI-Assisted Learning Companion

Cody is the educational assistant concept integrated into the CodeQuest experience.

Rather than positioning AI as a replacement for learning, Cody is intended to act as a supportive learning companion.

Its educational direction includes:

- Explaining programming concepts.
- Helping learners understand coding problems.
- Providing contextual guidance.
- Supporting problem-solving.
- Encouraging learners to understand their mistakes.
- Offering assistance during programming activities.

The AI functionality is supported by a separate backend integration, with Gemini-related functionality present in the project's AI services.

The availability of individual AI capabilities depends on the deployed backend configuration and required service credentials.

4.4. Gamification and Learning Rewards

CodeQuest incorporates gamification to make the learning journey more engaging.

The platform includes reward-oriented features such as:

- Experience points (XP).
- Stars.
- Learning progress indicators.
- Achievements.
- Leaderboard functionality.
- Reward-related activities.

The reward system is designed to connect learning activities with measurable progress.

Reward-related operations are handled through backend functionality and Firebase services where implemented.

4.5. Educational Games

The project includes separate educational game experiences, including:

- Bug-finding activities.
- Building-oriented challenges.
- Matching activities.
- Memory games.
- Quiz-based activities.

These experiences are intended to reinforce programming knowledge through interaction and practice.

4.6. Learner Profile and Avatar

The platform includes learner-oriented profile and avatar experiences.

These are designed to provide a personalized learning environment where users can access their profile information and view relevant learning activity.

4.7. Progress and Achievements

Progress-related pages provide a dedicated space for learners to review their learning journey.

The platform includes interfaces for:

- Learning progress.
- Achievements.
- Leaderboard information.
- Learner profile details.

The actual information displayed depends on the availability and synchronization of the corresponding application data.

4.8. Projects and Creative Learning

CodeQuest includes project-oriented experiences intended to help learners move beyond isolated exercises and explore practical applications of programming concepts.

The platform also includes dedicated project-related pages and a programming workspace.

4.9. Additional Learning Experiences

The repository includes additional interfaces and experiments, such as:

- A virtual reality learning lab.
- A learning studio.
- Parent-oriented interface pages.
- Settings and personalization pages.
- A virtual store experience.

Their availability and functional completeness may differ across individual modules.

---

5. Technology Stack

CodeQuest uses a combination of frontend technologies, cloud services, backend components, and AI-related integrations.

Layer| Technologies
Frontend| HTML5, CSS3, JavaScript
UI and Styling| Custom CSS, responsive layouts
Code Editor| CodeMirror 5
Authentication| Firebase Authentication
Database| Cloud Firestore
Serverless Backend| Firebase Cloud Functions
Backend API| Python, FastAPI
AI Integration| Gemini-related backend integration
Edge Services| Cloudflare Workers
Learning Content| JSON-based curriculum files
Progressive Web App| Web App Manifest, Service Worker
Version Control| Git and GitHub

The exact availability of each service depends on its configuration and deployment environment.

6. System Architecture

CodeQuest follows a multi-component architecture that separates the user interface, application services, persistent data, and AI-related functionality.

flowchart TD
    A["Learner"] --> B["CodeQuest Frontend"]
    B --> C["HTML / CSS / JavaScript"]
    C --> D["Firebase Authentication"]
    C --> E["Cloud Firestore"]
    C --> F["Firebase Cloud Functions"]
    C --> G["Python Backend / FastAPI"]
    C --> H["Cloudflare Worker"]
    G --> I["Cody AI Services"]
    G --> J["Quiz and Code APIs"]
    E --> K["Learning Data"]
    F --> L["Rewards and Server Operations"]

Architecture Components

Frontend Layer

Responsible for rendering the user interface, managing user interactions, presenting learning content, and communicating with backend services.

Authentication Layer

Firebase Authentication is used as the authentication service for supported account workflows.

Data Layer

Cloud Firestore provides the application's cloud database functionality for supported learner and application data.

Serverless Layer

Firebase Cloud Functions handles selected server-side operations, including reward-related and code-execution functionality.

Backend API Layer

The Python backend provides API endpoints for supported quiz checking, code execution, and AI-related functionality.

Edge Layer

The Cloudflare Worker provides additional edge-side endpoints for supported application operations.

AI Layer

The Cody AI services provide the backend foundation for AI-assisted educational interactions.

---

7. Repository Structure

The following is a high-level overview of the repository's main directories and representative files.

CodeQuest/
│
├── backend/
│   └── Python backend services
│
├── cloudflare-worker/
│   └── Edge-side application services
│
├── cody-ml-engine/
│   └── Machine-learning-related components
│
├── css/
│   └── Stylesheets and interface styling
│
├── functions/
│   └── Firebase Cloud Functions
│
├── js/
│   └── Frontend JavaScript modules
│
├── src/
│   └── Additional source files
│
├── dashboard.html
├── login.html
├── signup.html
├── profile.html
├── progress.html
├── achievements.html
├── leaderboard.html
├── playground.html
├── projects.html
├── levels.html
├── lecture.html
├── settings.html
├── parent.html
├── store.html
├── studio.html
├── vr-lab.html
│
├── curriculum.json
├── cpp_curriculum.json
├── firebase.json
├── firestore.rules
├── manifest.json
├── sw.js
│
└── README.md

This overview highlights the main application areas rather than documenting every individual file.

---

8. Backend and API Overview

The repository contains multiple backend components with different responsibilities.

8.1. Python Backend

The FastAPI application exposes the following routes:

Method| Endpoint| Purpose
GET| "/"| Backend root endpoint
GET| "/health"| Health-check endpoint
POST| "/api/quiz/check"| Quiz checking functionality
POST| "/api/code/run"| Code execution endpoint

8.2. Cody Chat Service

The Cody chat service includes:

Method| Endpoint| Purpose
GET| "/health"| Service health check
POST| "/chat"| AI-assisted chat interaction

The final public route may depend on how the chat router is mounted in the main FastAPI application.

8.3. Cloudflare Worker

The Worker contains the following routes:

Method| Endpoint| Purpose
GET| "/health"| Health check
GET/POST| "/api/session"| Session-related operations
POST| "/api/quiz/check"| Quiz-related processing

Supported methods and request formats should be verified against the deployed Worker configuration before external integration.

8.4. Firebase Cloud Functions

The project includes server-side functions with responsibilities such as:

Function| Responsibility
"runCode"| Server-side code execution workflow
"purchaseStoreItem"| Store purchase processing
"awardLessonReward"| Lesson reward processing
"syncExistingLessonRewards"| Reward synchronization
"claimGameReward"| Game reward claim workflow
"syncLeaderboard"| Leaderboard synchronization

Function availability does not necessarily mean that every related frontend workflow is fully enabled or production-ready.

---

9. Database and Data Management

Cloud Firestore is used for supported persistent application data.

The security rules reference application data areas including:

- "users"
- "lessonProgress"
- "quizResults"
- "gameRewards"
- "drafts"
- "projects"
- "leaderboardPublic"

These data areas support different parts of the learning experience.

Data Management Principles

The application should follow these principles:

1. Associate private learner data with the authenticated user.
2. Validate sensitive operations on trusted backend services.
3. Avoid relying on frontend-only checks for authorization.
4. Prevent duplicate reward processing.
5. Keep public leaderboard information separate from private learner information.
6. Apply restrictive Firestore security rules.
7. Avoid exposing sensitive service credentials in frontend files.

The actual data schema and field requirements are defined by the application code and Firestore rules.

---

10. Security Considerations

Security is an important part of an educational platform, particularly when learner accounts and personal progress information are involved.

CodeQuest includes Firebase security rules and server-side functionality to support protected application operations.

Recommended security practices include:

- Keep API keys and private service credentials out of public repositories.
- Use environment variables or platform-managed secrets for private credentials.
- Validate user identity and permissions on the backend.
- Enforce appropriate Firestore access restrictions.
- Validate incoming API requests.
- Apply rate limiting to public-facing endpoints where appropriate.
- Avoid trusting client-submitted XP, stars, or reward values.
- Use HTTPS for deployed services.
- Review authentication and account-management workflows.
- Minimize the collection and exposure of personal information.

Important: Firebase client configuration values are not equivalent to private server credentials. Security must be enforced through authentication, authorization, Firestore rules, and backend validation.

A security review should be completed before using the platform with real learner accounts at scale.

---

11. Installation and Local Development

The repository contains multiple components. The frontend and backend services may require separate setup procedures.

11.1. Clone the Repository

git clone https://github.com/mariam2009m44-lab/CodeQuest.git
cd CodeQuest

11.2. Frontend

The frontend consists primarily of HTML, CSS, and JavaScript files.

For local development, serve the project through a local HTTP server rather than relying on direct "file://" access.

For example:

python -m http.server 8000

Then open:

http://localhost:8000

Some functionality may require Firebase configuration and deployed backend services.

11.3. Firebase Setup

To configure Firebase:

1. Create or select a Firebase project.
2. Enable the authentication providers required by the application.
3. Configure Cloud Firestore.
4. Review the repository's "firestore.rules".
5. Configure the Firebase client settings used by the frontend.
6. Configure the Cloud Functions environment and required secrets.
7. Deploy the required Firebase services.

The exact deployment commands depend on the installed Firebase CLI version and the project's current configuration.

11.4. Python Backend

The Python backend is located in:

backend/

Use the backend's dependency and configuration files to prepare the Python environment.

A typical virtual environment can be created with:

python -m venv .venv

Activate the environment and install the dependencies specified by the backend dependency file.

Do not start the application until the required environment variables and service credentials have been configured.

11.5. Cloudflare Worker

The edge service is located in:

cloudflare-worker/

Configure the required Cloudflare environment and secrets before deployment.

Use the Worker configuration and deployment instructions associated with the installed Cloudflare tooling.

---

12. Deployment

The repository is associated with a GitHub Pages deployment.

The public application entry point is:

"Open CodeQuest" (https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html)

The source code is available at:

"GitHub Repository" (https://github.com/mariam2009m44-lab/CodeQuest)

Deployment Considerations

A complete deployment may involve multiple services:

- Static frontend hosting.
- Firebase Authentication.
- Cloud Firestore.
- Firebase Cloud Functions.
- Python backend hosting.
- Cloudflare Worker deployment.
- AI provider configuration.

Publishing the frontend does not automatically deploy or activate the backend services.

All required service URLs, permissions, environment variables, and cross-origin settings must be configured for the corresponding integrations.

---

13. Testing and Quality Assurance

Testing should cover both individual features and the communication between application components.

Recommended Testing Areas

Area| What to Verify
Authentication| Registration, login, logout, and protected pages
Learning Content| Correct lesson loading and navigation
Code Playground| Editing, running, resetting, and error handling
Cody AI| Backend connectivity and response handling
Progress| Correct progress retrieval and display
XP and Stars| Accurate reward calculation and duplicate prevention
Profile| Correct learner data and profile updates
Games| Game behavior and supported reward workflows
Leaderboard| Correct data synchronization and display
Security| Authentication checks and database permissions
Responsive UI| Mobile and desktop layouts

Testing should be performed against the actual deployed configuration, not only local interface previews.

---

14. Current Development Status

CodeQuest is an evolving educational software project.

The repository contains a broad set of frontend pages, backend components, Firebase integrations, and learning experiences. However, the presence of a page or backend function should not automatically be interpreted as proof that the entire feature is fully integrated.

A useful development distinction is:

Status| Meaning
Implemented| The relevant code or interface exists
Integrated| The components communicate through the intended workflow
Tested| The workflow has been verified under defined test conditions
Production-ready| Security, reliability, deployment, and operational requirements have been reviewed

This distinction helps maintain accurate technical documentation as the platform develops.

---

15. Future Development Roadmap

Potential development priorities include:

Learning Experience

- Expand and refine programming curricula.
- Improve lesson sequencing and difficulty progression.
- Add more practical programming exercises.
- Introduce additional project-based learning activities.

AI-Assisted Education

- Improve Cody's contextual understanding.
- Add more structured hints and explanations.
- Improve educational feedback.
- Strengthen error interpretation and debugging support.

Gamification

- Improve reward consistency.
- Expand achievement categories.
- Strengthen leaderboard synchronization.
- Add more educational challenges.

Learner Experience

- Improve profile and progress synchronization.
- Expand personalization options.
- Improve accessibility and responsive behavior.
- Enhance the mobile learning experience.

Engineering and Reliability

- Expand automated testing.
- Improve backend observability.
- Strengthen API validation.
- Review security rules and authorization.
- Improve deployment and configuration documentation.

These items represent development directions, not claims that the features are already complete.

---

16. Educational Approach

CodeQuest is based on the idea that programming is best learned through a combination of explanation, experimentation, practice, and reflection.

Its educational approach emphasizes:

- Learn: Understand a concept through structured explanations.
- Explore: Examine examples and discover how code works.
- Practice: Apply concepts through interactive exercises.
- Experiment: Test ideas in a coding environment.
- Create: Develop small projects and practical solutions.
- Reflect: Review progress and identify areas for improvement.

This learning journey and identify areas for improvement.

This approach aims to support both technical understanding and independent problem-solving.

---

17. Accessibility and User Experience

CodeQuest aims to provide an accessible and consistent learning experience across different devices.

The interface emphasizes:

- Clear navigation and content organization.
- Responsive layouts for mobile and desktop screens.
- Readable typography and visual hierarchy.
- Arabic right-to-left (RTL) interface support.
- Consistent visual components.
- Simple interactions suitable for beginner learners.

The platform's interface is designed to reduce unnecessary complexity and help learners focus on programming activities.

18. Privacy and Responsible AI

CodeQuest is designed as an educational platform, so privacy and responsible technology use are important considerations.

The project follows these guiding principles:

- Collect only the information required for supported platform functionality.
- Protect learner-related data through appropriate access controls.
- Avoid exposing private account information.
- Use AI as an educational support tool rather than a substitute for independent thinking.
- Encourage understanding and experimentation instead of simply copying generated answers.
- Review AI-generated content for educational relevance and accuracy.

AI-generated responses may contain errors and should not be treated as guaranteed correct technical guidance.

19. Limitations and Development Notes

CodeQuest is an actively evolving project. Its capabilities depend on the current implementation, service configuration, and deployment status.

Some features may require additional integration, testing, or configuration before they can be considered fully operational.

In particular:

- Backend services must be deployed and reachable for their related frontend functionality to work.
- Firebase features require valid project configuration and security rules.
- AI functionality depends on the availability of its configured provider and credentials.
- Code execution depends on the configured execution service.
- Reward and leaderboard workflows require reliable synchronization between the frontend and backend.
- Some experimental interfaces may not represent complete production features.

These limitations are documented to provide an accurate picture of the project's development state.

20. Future Vision

The long-term direction of CodeQuest is to develop into a more comprehensive programming education ecosystem.

Potential future directions include:

- Expanded programming curricula covering Python, JavaScript, C++, Java, HTML, and CSS.
- More advanced project-based learning experiences.
- Improved AI-assisted debugging and personalized explanations.
- Stronger learning analytics and progress insights.
- Additional interactive programming games.
- Improved accessibility and multilingual support.
- More comprehensive testing and deployment automation.
- Better integration between learning activities, projects, and achievements.

These directions will be evaluated and implemented progressively.

21. Contributing

CodeQuest welcomes constructive feedback and contributions that support its educational mission.

Areas where contributions may be valuable include:

- Frontend development.
- Backend development.
- AI and machine-learning integration.
- Educational content and curriculum design.
- Programming exercises and games.
- UI/UX design.
- Accessibility improvements.
- Testing and technical documentation.

Suggested Contribution Process

1. Review the existing repository and its architecture.
2. Identify an issue or improvement opportunity.
3. Create a dedicated branch for your changes.
4. Implement the change while preserving existing functionality.
5. Test the affected workflows.
6. Document relevant technical changes.
7. Submit a pull request with a clear explanation.

Contributions should prioritize code quality, maintainability, accessibility, and the platform's educational objectives.

22. Project Information

Item| Details
Project Name| CodeQuest — Cody Academy
Project Category| Educational Technology
Main Focus| Programming Education
Additional Focus| AI-Assisted Learning
Frontend| HTML, CSS, JavaScript
Backend| Firebase, Python, FastAPI
Database| Cloud Firestore
AI Integration| Gemini-related services
Repository| GitHub
Hosting| GitHub Pages

23. Project Links

- Live Application: https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html
- GitHub Repository: https://github.com/mariam2009m44-lab/CodeQuest

24. License

No open-source license should be assumed unless an explicit license file is included in the repository.

Until a license is selected and published, the project's source code remains subject to the applicable copyright protections.

25. Final Statement

CodeQuest — Cody Academy is an ongoing initiative focused on making programming education more interactive, accessible, and engaging.

By combining structured learning, practical coding experiences, educational games, cloud-based services, and AI-assisted support, the project explores how modern technologies can contribute to a more engaging approach to learning software development.

The goal is not simply to teach learners how to write code, but to help them develop the confidence and problem-solving mindset needed to use technology creatively.

<p align="center">Learn. Code. Create. Discover.

CodeQuest — Cody Academy

</p>