# Athenæum – Full-Stack Classic Literature Application

An end-to-end, digital literature reading, discovery, and publishing platform inspired by classic books, libraries, and literary journals.

---

## 🏛️ Architectural Overview

* **Frontend**: React 18, TypeScript, Vite, Vanilla CSS Tokens (Ivory, Burgundy, Dark Brown, Gold).
* **Backend**: Node.js, Express, TypeScript, Layered Routers, JWT Auth & RBAC Middleware, Multer local file uploads.
* **Database**: SQLite via Prisma ORM (relational schema with cascade deletions).
* **Testing & Quality Gate**: Full E2E browser automation suite with Playwright CLI.
* **AI Capabilities**: Google Gemini 2.5 API integration via the official `@google/genai` SDK, offering scholarly summarization, contextual passage explanation, trilingual translation (English, Hindi, Kannada), and Curatorial Art & Craft draft synthesis with strict human-in-the-loop review.

---

## 🤖 Literature AI Assistant & Environment Variable

Configure your Google Gemini API key strictly in `server/.env` or deployment platform settings:

```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

> **Security Assurance:** The API key remains strictly server-side. It is never transmitted to the browser, never bundled into frontend assets, and never logged in client responses.

---

## 🔐 Official Google OAuth / Identity Services Setup

Configure your official Google OAuth 2.0 credentials in `server/.env` (and Vercel environment variables for production):

```env
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### Google Cloud Console Configuration
1. Navigate to **Google Cloud Console > APIs & Services > Credentials**.
2. Create or configure an **OAuth 2.0 Client ID (Web Application)**.
3. Configure **Authorized JavaScript Origins**:
   - `http://localhost:5173`
   - `http://localhost:5000`
   - `https://literature-application.vercel.app`
4. Configure **Authorized Redirect URIs**:
   - `http://localhost:5173`
   - `https://literature-application.vercel.app`
5. The application securely validates ID tokens server-side using `google-auth-library` and never exposes the Client Secret to the browser.

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
* Node.js v20+ / v24+
* npm v10+

### 2. Installation
```bash
# Install root dependencies (Playwright)
npm install

# Install server dependencies
cd server
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Running Locally
```bash
# Terminal 1: Backend Server (Port 5000)
npm run dev:server

# Terminal 2: Frontend Client (Port 5173)
npm run dev:client
```

### 4. Running Automated Playwright Test Suite
```bash
npx playwright test
```

---

## 📋 Scrum Issues & Milestone Roadmap

See [`development_plan.md`](./development_plan.md) and [`implementation_plan.md`](./implementation_plan.md) for the complete backlog breakdown across Milestones 1 through 5.

