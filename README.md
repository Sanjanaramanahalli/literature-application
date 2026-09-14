# Athenæum – Full-Stack Classic Literature Application

An end-to-end, digital literature reading, discovery, and publishing platform inspired by classic books, libraries, and literary journals.

---

## 🏛️ Architectural Overview

* **Frontend**: React 18, TypeScript, Vite, Vanilla CSS Tokens (Ivory, Burgundy, Dark Brown, Gold).
* **Backend**: Node.js, Express, TypeScript, Layered Routers, JWT Auth & RBAC Middleware, Multer local file uploads.
* **Database**: SQLite via Prisma ORM (relational schema with cascade deletions).
* **Testing & Quality Gate**: Full E2E browser automation suite with Playwright CLI.

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
cp .env.example .env
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
