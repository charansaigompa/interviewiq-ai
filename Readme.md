# 🤖 InterviewIQ AI

### AI-Powered Mock Interview Platform

InterviewIQ AI is a full-stack web application that simulates realistic mock interviews using **Generative AI**. Users can configure an interview, optionally upload their resume, answer questions using voice or text, and receive AI-powered feedback on their **confidence, communication, and correctness**.

The platform also provides performance analytics, interview history, downloadable reports, and a credit-based payment system.

---

## 🚀 Features

* 🧠 **AI-Generated Interviews** — Generates role and experience-specific interview questions with progressive difficulty.
* 📄 **Resume-Based Interviews** — Upload a PDF resume and use its skills, projects, and experience as context for question generation.
* 🎤 **Voice Interview** — Uses browser speech recognition and speech synthesis for an interactive interview experience.
* 📊 **AI Answer Evaluation** — Evaluates answers based on confidence, communication, and correctness.
* 📈 **Performance Analytics** — Visualizes overall and skill-wise interview performance.
* 🗂️ **Interview History** — Stores completed interviews and allows users to review previous results.
* 📑 **PDF Reports** — Generate and download detailed interview performance reports.
* 🔐 **Google Authentication** — Secure authentication using Firebase and JWT-based backend authorization.
* 💳 **Credit System** — Users consume credits to start interviews.
* 💰 **Razorpay Integration** — Supports purchasing additional interview credits with server-side payment verification.

---

## 🔄 How It Works

```text
             ┌─────────────────┐
             │   Google Login  │
             └────────┬────────┘
                      ↓
             ┌─────────────────┐
             │ Interview Setup │
             │ Role / Experience│
             │ / Interview Type│
             └────────┬────────┘
                      ↓
             ┌─────────────────┐
             │ Resume Upload   │
             │    (Optional)   │
             └────────┬────────┘
                      ↓
             ┌─────────────────┐
             │ Resume Parsing  │
             │   + AI Analysis │
             └────────┬────────┘
                      ↓
             ┌─────────────────┐
             │ AI Question     │
             │   Generation    │
             └────────┬────────┘
                      ↓
             ┌─────────────────┐
             │ Mock Interview  │
             │ Voice / Text     │
             └────────┬────────┘
                      ↓
             ┌─────────────────┐
             │ AI Answer       │
             │   Evaluation    │
             └────────┬────────┘
                      ↓
             ┌─────────────────┐
             │ Performance     │
             │ Analytics       │
             └────────┬────────┘
                      ↓
             ┌─────────────────┐
             │ History + PDF   │
             │     Report      │
             └─────────────────┘
```

---

## 🧠 AI Pipeline

InterviewIQ uses AI at multiple stages of the interview process.

### Resume Analysis

```text
PDF Resume
    ↓
Text Extraction
    ↓
AI Processing
    ↓
Role • Experience • Projects • Skills
```

The extracted candidate information is used as context when generating interview questions.

### Question Generation

```text
Role + Experience + Resume Context
                 ↓
              AI Model
                 ↓
       Progressive Questions
```

The interview questions are generated with increasing difficulty.

### Answer Evaluation

```text
Candidate Answer
       ↓
    AI Model
       ↓
 ┌─────┼──────────┐
 ↓     ↓          ↓
Confidence  Communication  Correctness
```

Each category is scored from **0–10**, providing a more detailed evaluation than a single overall score.

---

## 🏗️ Architecture

```text
                    ┌──────────────┐
                    │    React     │
                    │   Frontend   │
                    └──────┬───────┘
                           │
                       REST APIs
                           │
                           ↓
                    ┌──────────────┐
                    │   Express.js │
                    │    Backend   │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
     ┌─────────┐     ┌───────────┐    ┌──────────┐
     │ MongoDB │     │ OpenRouter│    │ Firebase │
     │         │     │  AI Model │    │   Auth   │
     └─────────┘     └───────────┘    └──────────┘
                           │
                           ↓
                    ┌──────────────┐
                    │   Razorpay   │
                    │   Payments   │
                    └──────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Recharts
* Firebase Authentication
* Web Speech API
* jsPDF

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* Multer
* PDF.js

### AI & Services

* OpenRouter
* GPT-4o-mini
* Razorpay

---

## 📁 Project Structure

```text
interviewiq-ai/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── context/
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── package.json
│
└── README.md
```

The backend follows a modular architecture separating **routes, controllers, services, models, middleware, and configuration**.

---

## ⚙️ Getting Started

### Prerequisites

* Node.js 18+
* MongoDB
* npm
* Firebase project
* OpenRouter API key
* Razorpay account

### Clone the Repository

```bash
git clone https://github.com/charansaigompa/interviewiq-ai.git

cd interviewiq-ai
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

Open another terminal:

```bash
cd server
npm install
npm start
```

Create `.env` files for the frontend and backend and configure the required Firebase, MongoDB, JWT, OpenRouter, Razorpay, and API URL variables.

> **Never commit API keys, database credentials, or other secrets to GitHub.**

---

## 🔐 Security

InterviewIQ implements several security measures:

* Firebase-based Google authentication
* JWT-based authorization
* HTTP-only authentication cookies
* Protected backend routes
* Server-side Razorpay signature verification
* Environment variables for sensitive credentials

---

## 🔮 Future Improvements

* Adaptive follow-up questions based on previous answers
* Job-description-based interview generation
* Company-specific interview preparation
* More advanced interview analytics
* Long-term performance tracking
* Additional AI model support
* Improved voice interaction

---

## 👨‍💻 Author

### Charan Sai Gompa

Full-stack project combining **Generative AI, React, Node.js, MongoDB, authentication, voice interaction, analytics, and payment integration**.

---

⭐ If you find the project interesting, consider giving the repository a star!
