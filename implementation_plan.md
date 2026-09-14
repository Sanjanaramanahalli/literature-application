# Implementation Plan - Full-Stack Literature Application

## Executive Summary
This document defines the complete technical design, system architecture, database models, REST API specifications, UI/UX design tokens, and execution roadmap for the **Full-Stack Literature Application**. 

In accordance with Scrum Master and Lead Architect best practices, this plan incorporates consensus analysis across three specialized review perspectives:
1. **Architectural Reviewer**: Ensures structural scalability, loose coupling, robust RBAC, security boundaries, and modular full-stack layering.
2. **Ambiguity Analyst**: Verifies that every business rule from requirement analysis (popularity formulas, 2-level threaded comments, cascade deletions, dual OAuth fallback, admin invite secret) is strictly mapped.
3. **QA Edge-Case Specialist**: Details boundary constraints, negative paths, concurrency/stale state behavior, and Playwright verification criteria for every layer.

Both `implementation_plan.md` and `development_plan.md` reside directly in the workspace root for complete team and repository visibility.

---

## 1. Consensus Panel Review Synthesis

### 1.1 Architectural Reviewer Evaluation
* **Tech Stack Decision**:
  * **Backend**: Node.js with Express and TypeScript. Robust REST architecture with layered controllers, services, repositories, and middleware (`authMiddleware`, `roleMiddleware`, `uploadMiddleware`, `validateRequest`).
  * **Database**: SQLite via Prisma ORM (or Prisma + SQLite/PostgreSQL-compatible schema). Provides ACID guarantees, relational integrity, zero complex external setup for local internship evaluation, and type-safe data access.
  * **Frontend**: React (Vite + TypeScript). Single Page Application with clean view-transitions, modular component structure, and Vanilla CSS design tokens honoring the classic literature aesthetic without bloated frameworks.
  * **Image Uploads**: Native `multer` middleware with static file serving under `/uploads`, UUID filename sanitization, MIME-type filtering (`image/jpeg`, `image/png`, `image/webp`), and file size limits (5MB).
* **Verdict**: **APPROVED** (Meets architectural integrity and modular separation).

### 1.2 Ambiguity Analyst Evaluation
* **Requirement Parity Check**:
  * *Popularity Calculation*: Strictly implemented as `Total Ratings Count + Total Saves + Total Comments` (published only, tie-break by `publicationDate DESC`).
  * *Discussion Model*: Top-level comment + 1 direct reply nesting depth.
  * *Deletion Behavior*: Cascade deletion of parent comments and their child replies, triggering live updates to the Admin Dashboard `Total Comments` KPI.
  * *Admin Provisioning*: Explicit `ADMIN_INVITATION_SECRET` required during registration or via initial database seed.
  * *Google Sign-In*: Dual-mode OAuth (real Google Client ID/Secret if configured in `.env`, seamless interactive simulation modal fallback if unset).
* **Verdict**: **APPROVED** (100% parity with clarified user specifications).

### 1.3 QA Edge-Case Specialist Evaluation
* **Vulnerability & Edge-Case Protection**:
  * Unauthenticated attempts to rate/save/comment redirect smoothly to modal/login with return state.
  * Reader updating an existing rating dynamically recalculates average without double-counting `totalRatings`.
  * Admin KPI cards render `0` (never `NaN`, `undefined`, or `null`) when database is empty.
  * Playwright E2E browser tests must validate both positive user flows and negative/unauthorized edge cases.
* **Verdict**: **APPROVED** (Meets testability and resilience criteria).

**Consensus Result**: **UNANIMOUS CONSENSUS (3 / 3 Approved)**.

---

## 2. Proposed Architecture & System Design

```
                     ┌──────────────────────────────────────────────┐
                     │          Classic Literature Client           │
                     │          (React + TypeScript + Vite)         │
                     │  - Vanilla CSS Tokens (Cream, Burgundy, Gold)│
                     │  - Responsive Header, Explorer, Reading View │
                     │  - Admin Dashboard & Live 8-Card KPI Grid   │
                     └──────────────────────┬───────────────────────┘
                                            │ HTTP / REST / JSON
                                            │ (Bearer JWT / OAuth)
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │           Express API Backend (TS)           │
                     │  - Router & Controller Hierarchy             │
                     │  - Auth & RBAC Authorization Middleware      │
                     │  - Multer Local Cover Storage (/uploads)     │
                     │  - KPI Analytics Aggregation Engine          │
                     └──────────────────────┬───────────────────────┘
                                            │ Prisma Client
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │             Relational Database              │
                     │          (SQLite via Prisma ORM)             │
                     │  - Users, Roles, Credentials                 │
                     │  - Literature, Creators, Categories, Tags    │
                     │  - Ratings (1-per-user), Saves, Comments     │
                     └──────────────────────────────────────────────┘
```

---

## 3. Database Schema (Prisma Data Model)

### Models:
1. **User**:
   * `id`, `name`, `email` (unique), `passwordHash`, `role` (`READER`, `ADMIN`), `googleId`, `createdAt`, `updatedAt`.
2. **Creator**:
   * `id`, `name`, `bio`, `roleType` (`AUTHOR`, `PLAYWRIGHT`, `BOTH`), `createdAt`.
3. **Category**:
   * `id`, `name` (unique), `description`, `slug`.
4. **Literature**:
   * `id`, `title`, `subheading`, `brief`, `content`, `language`, `subject`, `genre`, `coverImage`, `publicationStatus` (`DRAFT`, `PUBLISHED`, `UNPUBLISHED`), `publicationDate`, `creatorId`, `categoryId`, `createdAt`, `updatedAt`.
5. **LiteratureTag** (Many-to-Many join between Literature and Tag):
   * `literatureId`, `tagId`.
6. **Tag**:
   * `id`, `name` (unique).
7. **Rating**:
   * `id`, `value` (1–5), `userId`, `literatureId`, `createdAt`, `updatedAt`.
   * *Constraint*: Unique on `[userId, literatureId]`.
8. **Save**:
   * `id`, `userId`, `literatureId`, `createdAt`.
   * *Constraint*: Unique on `[userId, literatureId]`.
9. **Comment**:
   * `id`, `content`, `userId`, `literatureId`, `parentId` (nullable self-relation for 1-level reply), `createdAt`, `updatedAt`.

---

## 4. REST API Specifications

### Authentication & User Management
* `POST /api/auth/register` - Create Reader account (or Admin if valid `adminSecret` provided).
* `POST /api/auth/login` - Email & password login; returns JWT.
* `POST /api/auth/google` - Google OAuth authentication (real/demo fallback).
* `POST /api/auth/forgot-password` - Dispatches password reset email/token.
* `POST /api/auth/reset-password` - Resets password with token.
* `GET /api/auth/me` - Retrieve current session user & role.

### Literature & Editorial
* `GET /api/literature` - Browse published literature (with pagination, sorting).
* `GET /api/literature/featured` - Return curated/highest engagement featured work.
* `GET /api/literature/popular` - Return top works ranked by `(ratingsCount + saves + comments)`.
* `GET /api/literature/new-releases` - Return latest $N$ published works by `publicationDate DESC`.
* `GET /api/literature/search` - Advanced search by title, author, language, subject, category, genre, tag.
* `GET /api/literature/:id` - Full literature details (content, creator, metadata, average rating).
* `POST /api/admin/literature` - [Admin] Create literature (Draft or Published).
* `PUT /api/admin/literature/:id` - [Admin] Update literature details / status.
* `DELETE /api/admin/literature/:id` - [Admin] Delete literature.
* `POST /api/admin/upload-cover` - [Admin] Upload local cover image.

### Creators & Categories
* `GET /api/creators` / `POST /api/admin/creators` - Manage Authors & Playwrights.
* `GET /api/categories` / `POST /api/admin/categories` - Manage Categories.

### Reader Engagement
* `POST /api/literature/:id/ratings` - Submit or update 1–5 star rating.
* `POST /api/literature/:id/save` - Toggle save/unsave work for current user.
* `GET /api/readers/saved` - Get authenticated reader's saved library.
* `GET /api/literature/:id/comments` - Get discussion tree (comments + replies).
* `POST /api/literature/:id/comments` - Post top-level comment or direct reply.
* `DELETE /api/comments/:id` - Delete comment (Reader owns or Admin moderates; cascade deletes replies).

### Admin Dashboard & KPIs
* `GET /api/admin/dashboard/kpis` - Real-time metrics:
  1. `totalLiterature`
  2. `publishedLiterature`
  3. `draftLiterature`
  4. `registeredReaders`
  5. `totalRatings`
  6. `averageRating`
  7. `totalComments`
  8. `totalSaves`
* `GET /api/admin/dashboard/recent-activity` - Recent comments, users, literature updates.

---

## 5. UI/UX Design System Tokens

* **Color Palette**:
  * `--bg-primary`: `#FDFBF7` (Alabaster / Ivory)
  * `--bg-secondary`: `#F4EFE6` (Warm Vellum / Parchment)
  * `--text-primary`: `#2C1D11` (Deep Antique Dark Brown)
  * `--text-muted`: `#6B5E51` (Warm Sepia Gray)
  * `--accent-burgundy`: `#722F37` (Imperial Wine / Burgundy)
  * `--accent-burgundy-hover`: `#58242A`
  * `--accent-gold`: `#C5A059` (Illuminated Gold)
  * `--accent-gold-light`: `#E8D5A3`
  * `--border-classic`: `#E3DAC9` (Subtle Bookline)
* **Typography**:
  * Headings: `'Playfair Display', Georgia, serif`
  * Reading Body: `'Lora', 'Merriweather', Georgia, serif`
  * UI Elements & Controls: `'Inter', -apple-system, sans-serif`
* **Components**:
  * Responsive Sticky Header with gold accent border.
  * List-based Literature Explorer layout with cover previews, rating stars, tag badges.
  * Focused 760px distraction-free Reading Container with bookmark quick-toggle.
  * 2-level threaded comments widget with real-time response nesting.
  * Admin KPI Grid (4 columns Desktop, 2 Tablet, 1 Mobile).

---

## 6. Verification & Testing Strategy
* **Unit & Integration Testing**: API routes, JWT security validation, cascade deletion tests, popularity aggregation tests.
* **E2E Browser Automation**: Playwright CLI testing verifying:
  1. Visitor navigation, search filters, and reading page rendering.
  2. Reader registration, login, 1–5 star rating submission & live recalculation.
  3. Bookmarking and "Saved Literature" view persistence.
  4. Discussion comments, threaded reply posting, and cascade deletion.
  5. Admin login, literature creation, draft saving, publishing, cover upload, and KPI card verification.
