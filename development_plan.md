# Scrum Development Plan - Full-Stack Literature Application

## Executive Scrum Overview
* **Role**: Full-Stack Architect & Scrum Master (25+ Years Industry Experience)
* **Methodology**: Disciplined Agile / Scrum with continuous integration, GitHub issue tracking standard, and automated Playwright E2E verification prior to closing any work item.
* **Sprint Duration**: Sprint 1 (Foundations, Authentication, Catalog & Editorial, Reader Engagement, and Admin Dashboard).
* **Definition of Done (DoD)**:
  1. Complete unit/integration test coverage for backend API routes.
  2. Frontend component adheres to Classic Literature design tokens (Ivory, Burgundy, Dark Brown, Gold).
  3. Positive and negative test scenarios verified via Playwright CLI automation.
  4. Zero lint or TypeScript compiler errors.
  5. Verified against all acceptance criteria before transitioning to "Done".

---

## Milestone Breakdown & Issue Registry

| Issue ID | Classification | Milestone | Title | Priority | Complexity | Est. Points | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **LIT-01** | Task / Backend | M1: Foundation & Auth | Project Scaffolding & DB Models Setup | P0 | Moderate | 5 | **Completed** |
| **LIT-02** | Enhancement | M1: Foundation & Auth | Dual-Mode Authentication (Email/Password + Google OAuth + Admin Invite Secret) | P0 | High | 8 | **Completed** |
| **LIT-03** | Frontend / UI | M2: Design & Public Discovery | Classic Literature Design System & Sticky Header Navigation | P0 | Moderate | 5 | **Completed** |
| **LIT-04** | Feature / Fullstack | M2: Design & Public Discovery | Literature Explorer, Category Showcases, Popular & New Releases | P0 | High | 8 | **Completed** |
| **LIT-05** | Feature / Fullstack | M2: Design & Public Discovery | Advanced Multi-Field Search & Filter Engine | P1 | Moderate | 5 | **Completed** |
| **LIT-06** | Feature / Fullstack | M3: Reader Immersion & Community | Reader Detail Page & 1-5 Star Dynamic Rating System | P0 | High | 8 | **Completed** |
| **LIT-07** | Feature / Fullstack | M3: Reader Immersion & Community | Saved Literature (Personal Reading List) Module | P1 | Low | 3 | **Completed** |
| **LIT-08** | Feature / Fullstack | M3: Reader Immersion & Community | 2-Level Threaded Comments & Cascade Deletion System | P0 | High | 8 | **Completed** |
| **LIT-09** | Feature / Fullstack | M4: Admin & Governance | Literature Creation, Draft/Publish Workflow & Local Cover Upload | P0 | High | 8 | **Completed** |
| **LIT-10** | Feature / Fullstack | M4: Admin & Governance | Real-Time Admin Dashboard with 8 Live KPI Cards & Analytics | P0 | High | 8 | **Completed** |
| **LIT-11** | Task / QA | M5: E2E Quality Gate | End-to-End Playwright Automation Suite & Final Verification | P0 | High | 8 | **Completed** |

---

## Detailed GitHub Issue Specifications

### Issue LIT-01: Project Scaffolding & DB Models Setup
* **Classification**: `task`, `backend`, `database`
* **Priority**: P0 | **Complexity**: Moderate | **Effort**: 5 SP
* **Background Context**: Establishes the monolithic or client-server workspace with Express TypeScript backend, Prisma ORM with SQLite, and React Vite frontend.
* **Expected Result**: Backend and frontend environments initialized, database migrations applied, and health check API responding.
* **Acceptance Criteria**:
  1. `npm run dev` boots both backend server (port 5000) and frontend client (port 5173).
  2. Prisma schema contains models for User, Creator, Category, Literature, Tag, Rating, Save, and Comment.
  3. Database seeded with initial test data (classic works, authors, categories).
* **Positive Test Cases**:
  - `GET /api/health` returns `200 OK` with status `online`.
  - Database queries retrieve seeded categories and authors.
* **Negative Test Cases**:
  - Unhandled routes return structured `404 Not Found` JSON.

---

### Issue LIT-02: Dual-Mode Authentication & Authorization
* **Classification**: `feature`, `backend`, `frontend`, `security`
* **Priority**: P0 | **Complexity**: High | **Effort**: 8 SP
* **Background Context**: Secure registration/login for Readers, Admin invitation key validation for Admin creation, and dual-mode Google Sign-In with interactive demo fallback.
* **Expected Result**: Token-based authentication (JWT) with RBAC middleware protecting admin endpoints.
* **Acceptance Criteria**:
  1. Registration validates required fields, email format, and password confirmation.
  2. Supplying a valid `ADMIN_INVITATION_SECRET` sets user role to `ADMIN`.
  3. Google Sign-In authenticates via real OAuth or falls back gracefully to interactive simulation modal when unconfigured.
  4. Reader accounts cannot access `/api/admin/*` routes (returns `403 Forbidden`).
* **Positive Test Cases**:
  - User can register, log in, and receive JWT with role `READER`.
  - Admin registration with secret receives role `ADMIN`.
* **Negative Test Cases**:
  - Duplicate email registration fails with `409 Conflict`.
  - Login with wrong password returns `401 Unauthorized`.
  - Reader accessing admin route receives `403 Forbidden`.

---

### Issue LIT-03: Classic Literature Design System & Sticky Header
* **Classification**: `frontend`, `ui`
* **Priority**: P0 | **Complexity**: Moderate | **Effort**: 5 SP
* **Background Context**: Implement the visual identity inspired by classic libraries: Cream/Ivory backgrounds, Rich Burgundy buttons, Dark Brown text, and Gold highlights.
* **Expected Result**: Sticky header with responsive drawer navigation, user profile badge, and seamless theme tokens.
* **Acceptance Criteria**:
  1. Sticky navigation stays pinned at viewport top during scroll.
  2. Responsive hamburger drawer activates on viewports `< 768px`.
  3. Classic typography hierarchy: Serif for headings, readable serif for text, sans-serif for UI controls.
* **Positive Test Cases**:
  - Header displays Home, Explore, Categories, Search, and Auth state.
  - Mobile viewport toggles responsive menu smoothly.
* **Negative Test Cases**:
  - Unauthenticated users see "Sign In" instead of Admin Dashboard or User Profile links.

---

### Issue LIT-04: Literature Explorer, Categories, Popular & New Releases
* **Classification**: `feature`, `frontend`, `backend`
* **Priority**: P0 | **Complexity**: High | **Effort**: 8 SP
* **Background Context**: The primary showcase for literature. Features Hero section, Featured Work, Categories list, Popular Literature, and New Releases.
* **Expected Result**: Home page displays rich literary cards with cover preview, author/playwright, category, rating, and brief.
* **Acceptance Criteria**:
  1. Popular Literature sorted by formula: `Total Ratings Count + Total Saves + Total Comments` DESC.
  2. New Releases displays top $N$ most recently published items by `publicationDate DESC`.
  3. Draft and Unpublished works are strictly excluded from public views.
* **Positive Test Cases**:
  - Public reader can view all published literature and category filtered lists.
* **Negative Test Cases**:
  - Direct URL access to draft literature by a visitor returns `404` or `403`.

---

### Issue LIT-05: Advanced Multi-Field Search & Filter Engine
* **Classification**: `feature`, `frontend`, `backend`
* **Priority**: P1 | **Complexity**: Moderate | **Effort**: 5 SP
* **Background Context**: Multi-parameter search allowing users to find works by Title, Author/Playwright, Language, Subject, Category, Genre, or Tags.
* **Expected Result**: Search panel with inputs, search action, and "Clear Filters" button dynamically returning matching works.
* **Acceptance Criteria**:
  1. Combines multiple criteria using AND logic.
  2. Case-insensitive substring matching for text fields.
  3. "Clear Filters" resets all fields and reloads default catalog.
* **Positive Test Cases**:
  - Searching Author="Shakespeare" + Category="Drama" returns exact matching plays.
* **Negative Test Cases**:
  - Search yielding no results displays a respectful "No literary works found" empty state.

---

### Issue LIT-06: Reader Detail Page & 1-5 Star Dynamic Rating System
* **Classification**: `feature`, `frontend`, `backend`
* **Priority**: P0 | **Complexity**: High | **Effort**: 8 SP
* **Background Context**: Distraction-free reading view (760px container, optimal line-height) with interactive 1–5 star rating widget.
* **Expected Result**: Full reading experience with live rating recalculation and single active rating per user per work.
* **Acceptance Criteria**:
  1. Authenticated Reader can click 1–5 stars to submit or update their rating.
  2. Rating immediately updates Average Rating and Total Ratings Count.
  3. Anonymous Visitors clicking a star are prompted to sign in.
* **Positive Test Cases**:
  - Reader submits 5 stars; average rating updates instantly.
  - Reader changes rating to 3 stars; total count remains 1, average adjusts.
* **Negative Test Cases**:
  - Duplicate rating submissions update the existing record instead of creating duplicates.

---

### Issue LIT-07: Saved Literature (Personal Reading List)
* **Classification**: `feature`, `frontend`, `backend`
* **Priority**: P1 | **Complexity**: Low | **Effort**: 3 SP
* **Background Context**: Bookmark/Save button on literature cards and detail pages to curate a personal reading list.
* **Expected Result**: One-click save/unsave toggle persisting across sessions with dedicated "My Saved Literature" page.
* **Acceptance Criteria**:
  1. Toggling save button adds/removes work from user's saved list.
  2. "Saved Literature" page renders saved works.
  3. Anonymous visitors are prompted to sign in when clicking save.
* **Positive Test Cases**:
  - Reader saves a work; item appears in "My Saved Literature".
  - Reader unsaves; item is removed.

---

### Issue LIT-08: 2-Level Threaded Comments & Cascade Deletion System
* **Classification**: `feature`, `frontend`, `backend`
* **Priority**: P0 | **Complexity**: High | **Effort**: 8 SP
* **Background Context**: Discussion section below literature content supporting top-level comments and 1-level deep direct replies.
* **Expected Result**: Interactive threaded conversations with moderation and cascade deletion.
* **Acceptance Criteria**:
  1. Top-level comment accepts text from authenticated readers.
  2. Readers can reply directly to any comment (nested 1 level).
  3. Deleting a top-level parent comment cascade-deletes all associated replies.
  4. Readers can delete only their own comments; Admins can delete any comment.
* **Positive Test Cases**:
  - Reader posts comment; another reader posts reply; thread renders cleanly.
  - Parent comment deletion deletes all replies underneath it.
* **Negative Test Cases**:
  - Reader attempting to delete another reader's comment receives `403 Forbidden`.

---

### Issue LIT-09: Literature Creation, Draft/Publish & Local Cover Upload
* **Classification**: `feature`, `frontend`, `backend`, `admin`
* **Priority**: P0 | **Complexity**: High | **Effort**: 8 SP
* **Background Context**: Admin editorial suite to create, edit, save as Draft, publish, unpublish, and upload cover images.
* **Expected Result**: Comprehensive editorial form with real-time cover preview, file upload validation, and status transitions.
* **Acceptance Criteria**:
  1. Cover image upload verifies MIME types (`jpeg`, `png`, `webp`) and limits size to 5MB.
  2. Admin can save as `DRAFT` or `PUBLISHED`.
  3. Unpublishing instantly hides work from public views and decrements public KPIs.
* **Positive Test Cases**:
  - Admin uploads cover image, fills metadata, and publishes literature successfully.
* **Negative Test Cases**:
  - Non-image upload returns `400 Bad Request`.
  - Non-admin attempting to access editor receives `403 Forbidden`.

---

### Issue LIT-10: Real-Time Admin Dashboard with 8 Live KPI Cards
* **Classification**: `feature`, `frontend`, `backend`, `analytics`
* **Priority**: P0 | **Complexity**: High | **Effort**: 8 SP
* **Background Context**: Dedicated Admin dashboard displaying real-time metrics across the application.
* **Expected Result**: 8 responsive KPI cards (4 cols desktop, 2 tablet, 1 mobile) showing live database metrics.
* **Acceptance Criteria**:
  1. 8 Live KPIs: Total Literature, Published, Drafts, Registered Readers (excluding Admins), Total Ratings, Average Rating, Total Comments, Total Saves.
  2. Displays `0` for empty states (never `null`, `undefined`, or `NaN`).
  3. Secondary widgets: Recent Comments, Popular Literature, and Quick Action shortcuts.
* **Positive Test Cases**:
  - Publishing a draft updates "Published Literature" KPI immediately on refresh.
  - Adding comments/ratings updates respective KPIs dynamically.
* **Negative Test Cases**:
  - Empty database displays clean `0` values across all cards without console errors.

---

### Issue LIT-11: End-to-End Playwright Automation Suite
* **Classification**: `task`, `qa`, `automation`
* **Priority**: P0 | **Complexity**: High | **Effort**: 8 SP
* **Background Context**: Comprehensive automated verification validating all user journeys, roles, edge cases, and accessibility.
* **Expected Result**: Complete Playwright test run executing in headless browser with 100% pass rate.
* **Acceptance Criteria**:
  1. All 10 user stories tested with positive and negative assertions.
  2. Zero test failures before closing Sprint 1.
