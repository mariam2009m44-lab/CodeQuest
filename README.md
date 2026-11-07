# 🚀 CodeQuest — Cody Academy

<p align="center">
  <strong>An Interactive, Arabic-First Programming Learning Platform</strong><br>
  <em>Learn to Code · Practice · Build · Progress</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20Application-7955E8?style=for-the-badge" alt="Web Application">
  <img src="https://img.shields.io/badge/Interface-Arabic%20%7C%20RTL-36BFE5?style=for-the-badge" alt="Arabic RTL Interface">
  <img src="https://img.shields.io/badge/Learning-Python%20%7C%20JavaScript%20%7C%20C%2B%2B-43C99A?style=for-the-badge" alt="Learning Tracks">
</p>

<p align="center">
  <a href="https://mariam2009m44-lab.github.io/CodeQuest/dashboard.html">🌐 Live Demo</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/mariam2009m44-lab/CodeQuest">💻 GitHub Repository</a>
</p>

---

## 📚 Table of Contents

- [Overview](#-overview)
- [Project Vision](#-project-vision)
- [Core Features](#-core-features)
- [Learning Experience](#-learning-experience)
- [Cody AI Assistant](#-cody-ai-assistant)
- [Code Playground](#-code-playground)
- [Progress and Gamification](#-progress-and-gamification)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Backend API](#-backend-api)
- [Firebase Data Model](#-firebase-data-model)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Deployment](#-deployment)
- [Security](#-security)
- [Implementation Notes](#-implementation-notes)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Project Information](#-project-information)
- [License](#-license)

---

## 🌟 Overview

**CodeQuest — Cody Academy** is an interactive, web-based programming education platform designed to make learning to code more accessible, engaging, and practical.

The platform combines structured programming lessons, browser-based coding practice, AI-assisted learning, and gamification in one learning environment.

With its Arabic-first interface and right-to-left layout, CodeQuest aims to provide a comfortable learning experience for Arabic-speaking students and beginners exploring the world of programming.

## 🎯 Project Vision

CodeQuest aims to connect programming education with hands-on practice.

Its core objectives are to:

- Make programming concepts easier to understand through guided learning.
- Provide interactive environments for practicing code.
- Support learners with an AI-assisted educational companion.
- Encourage continuous learning through progress tracking and rewards.
- Create an expandable educational platform for different programming languages.
- Help learners move from understanding concepts to building practical projects.

## ✨ Core Features

| Feature | Description |
|---|---|
| Arabic-First Interface | Arabic content and a complete right-to-left user experience. |
| Programming Tracks | Dedicated learning paths for Python, JavaScript, and C++. |
| Interactive Lessons | Structured lessons and quiz-related learning activities. |
| Code Playground | Browser-based programming editor powered by CodeMirror. |
| Cody AI Assistant | AI-assisted explanations and programming support. |
| User Profiles | Personal learning information and progress. |
| Gamification | XP, stars, levels, and reward-related features. |
| Leaderboard | Public leaderboard synchronization through Firebase Functions. |
| Progressive Web App | Web app manifest and service-worker support. |

## 🧭 Learning Experience

CodeQuest organizes programming education into dedicated language tracks.

### 🐍 Python

A learning path focused on programming fundamentals, logical thinking, and problem-solving.

### 🌐 JavaScript

A learning path introducing JavaScript concepts and web-oriented programming.

### ⚙️ C++

A learning path focused on programming fundamentals using C++.

The curriculum and available lesson activities are continuously evolving as the platform develops.

## 🤖 Cody AI Assistant

**Cody** is the AI-assisted learning companion integrated into CodeQuest.

Its purpose is to help learners understand programming concepts, ask questions, and receive educational guidance.

The Cody service is exposed through a dedicated backend router.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/cody/health` | Checks Cody service availability. |
| POST | `/api/cody/chat` | Sends a chat request to Cody. |

Cody uses the Gemini API through the backend.

A valid Gemini API key and a supported model must be configured for the assistant to operate.

AI-generated responses should be treated as learning assistance and may require verification.

## 💻 Code Playground

The CodeQuest Playground provides an in-browser coding environment powered by **CodeMirror 5.65.16**.

The current editor interface includes support for:

- JavaScript
- Python
- C++

Code execution is connected through the platform's backend integration.

A properly configured execution provider, such as Judge0, is required for remote code execution.

## 🏆 Progress and Gamification

CodeQuest includes gamification features designed to make learning progress visible and encourage continued practice.

These features include:

- Experience Points (XP).
- Level progression.
- Stars and lesson rewards.
- Lesson completion tracking.
- User learning profiles.
- Public leaderboard synchronization.

### Level Calculation

The current level calculation is based on accumulated XP:

```javascript
const level = Math.floor(xp / 100) + 1;