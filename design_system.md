# Athenæum Design System: Classical Literary Architecture & UI Component Guidelines

![Athenæum Visual Identity](C:\Users\giris\.gemini\antigravity-ide\brain\affb00d3-ef03-4a14-8afc-b76ceb6c12d1\athenaeum_hero_design_1789383801893.jpg)

## 1. Design Philosophy & Aesthetic Identity

The **Athenæum Design System** translates the timeless beauty, dignity, and intellectual depth of classical libraries, historic reading rooms, and printed letterpress books into an accessible, responsive digital reading application.

### Core Principles
1. **Typographic Primacy**: Content is sacred. Headings feature refined serif display forms, and body prose prioritizes long-form reading comfort, rhythmic line heights, and optimal column widths.
2. **Harmonious Classical Palette**: Grounded in natural vellum, aged paper, bookbinder leather, illuminated gold, and deep imperial burgundy. It completely avoids generic corporate blues or jarring neon tones.
3. **Structured Restraint & Whitespace**: Spacing is generous, book-inspired, and measured. Visual hierarchy is achieved through proportion and subtle tonal contrast rather than heavy drop shadows or unnecessary gradients.
4. **Purposeful Craftsmanship**: Buttons are slightly rounded rectangles reflecting leather book corners; cards are clean literary plates with fine interior borders.

---

## 2. Design Tokens & Variables

### 2.1 Color Palette
| Token Name | Hex Code | Semantic Role |
| :--- | :--- | :--- |
| `--bg-primary` | `#FDFBF7` | Primary background (Warm Alabaster / Ivory) |
| `--bg-secondary` | `#F6F1E9` | Secondary background (Aged Parchment / Vellum) |
| `--bg-surface` | `#FFFFFF` | Paper sheets, modal cards, reading containers |
| `--bg-dark` | `#1E140C` | Bookbinder Ebony / Deep Walnut |
| `--text-primary` | `#2C1D11` | Primary body and heading ink (Deep Antique Dark Brown) |
| `--text-secondary` | `#5C4A3C` | Subheadings, creator bios, excerpts (Warm Sepia) |
| `--text-muted` | `#8C7869` | Metadata, timestamps, placeholders (Pale Sepia) |
| `--accent-burgundy` | `#722F37` | Primary calls to action, badges, active tabs (Imperial Burgundy) |
| `--accent-burgundy-hover` | `#58242A` | Hover / focus state for burgundy elements |
| `--accent-burgundy-subtle`| `#F4EAEB` | Tag highlights, alert tint |
| `--accent-gold` | `#C5A059` | Star ratings, crest outlines, premium accents (Illuminated Gold) |
| `--accent-gold-hover` | `#AF8B45` | Hover on gold actions |
| `--accent-gold-light` | `#F7F1E4` | Featured ribbon tint |
| `--border-classic` | `#E3DAC9` | Delicate bookline rule for dividers and card frames |
| `--border-dark` | `#3A281A` | Dark container borders |

### 2.2 Typography Scale
* **Display Font**: `'Cinzel', 'Playfair Display', Georgia, serif`
* **Heading Font**: `'Playfair Display', Georgia, serif`
* **Reading Body Font**: `'Lora', Georgia, serif` (Optimal reading line-height: `1.75 - 1.85`)
* **UI Controls & Meta**: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`

| Scale Token | Size | Line Height | Tracking / Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--font-display-hero` | `2.75rem (44px)` | `1.2` | `0.02em` | Hero section main proclamation |
| `--font-h1` | `2.2rem (35px)` | `1.25` | `-0.01em` | Literature detail title |
| `--font-h2` | `1.65rem (26px)` | `1.3` | `0` | Section headings (Popular, Categories) |
| `--font-h3` | `1.25rem (20px)` | `1.35` | `0.01em` | Card titles, modal titles |
| `--font-reading` | `1.12rem (18px)` | `1.8` | `0.005em` | Long-form reading paragraphs |
| `--font-ui-base` | `0.92rem (14.7px)`| `1.5` | `0` | Form labels, button copy |
| `--font-ui-sm` | `0.78rem (12.5px)`| `1.4` | `0.04em uppercase`| Badges, metadata tags, role tags |

### 2.3 Spacing Scale (8pt Baseline Grid)
* `--space-xs`: `0.25rem` (4px)
* `--space-sm`: `0.5rem` (8px)
* `--space-md`: `1.0rem` (16px)
* `--space-lg`: `1.5rem` (24px)
* `--space-xl`: `2.0rem` (32px)
* `--space-2xl`: `3.0rem` (48px)
* `--space-3xl`: `4.5rem` (72px)

### 2.4 Container Widths & Radii
* `--container-max`: `1240px` (Main application frame)
* `--container-reading`: `760px` (Strictly enforced reading width for maximum cognitive ease)
* `--radius-sm`: `4px` (Buttons, inputs, badges)
* `--radius-md`: `6px` (Cards, dropdowns)
* `--radius-lg`: `8px` (Modals, KPI plates)

---

## 3. UI Component Layout Specifications

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                         STICKY CLASSIC HEADER                          │
  │ [CREST] ATHENÆUM   Home  Explore  Categories  Search  Saved  [Sign In] │
  └────────────────────────────────────────────────────────────────────────┘
  
  ┌────────────────────────────────────────────────────────────────────────┐
  │                              HERO SECTION                              │
  │             "A Digital Sanctuary for Timeless Scholarship"             │
  │                 [ Explore Collection ]   [ Advanced Search ]           │
  └────────────────────────────────────────────────────────────────────────┘
  
  ┌──────────────────────────────┐    ┌───────────────────────────────────┐
  │      FEATURED LITERATURE     │    │      ADVANCED SEARCH PANEL        │
  │ [COVER]  Hamlet, Prince...   │    │ Author  [ Shakespeare         ]   │
  │          By Shakespeare      │    │ Category[ Drama       ▼ ]         │
  │ ★★★★★ (4.8)                  │    │ [ Search ]        [ Clear Filters ]│
  └──────────────────────────────┘    └───────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │                     LITERATURE LISTING CARD LAYOUT                     │
  │ ┌───────┐ Title: The Death of Ivan Ilyich          ★★★★★ (4.6)        │
  │ │ COVER │ Author: Leo Tolstoy | Category: Classics                    │
  │ │ IMAGE │ Brief: An inquest into an ordinary life and awakening...    │
  │ └───────┘ [Tag: Philosophy] [Tag: Morality]          [ Read Work → ]  │
  └────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │                   ADMIN DASHBOARD 8-CARD LIVE KPI GRID                 │
  │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
  │ │ Total    │ │ Published│ │ Drafts   │ │ Readers  │ │ Avg Rate │ ...etc │
  │ │   4      │ │   3      │ │   1      │ │   2      │ │  4.7/5   │        │
  │ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
  └────────────────────────────────────────────────────────────────────────┘
```

### Component 1: Sticky Header (`<Header />`)
* **Behavior**: Pinned at the top of the viewport (`position: sticky; top: 0; z-index: 1000;`).
* **Visual Identity**: Background `--bg-primary`, bottom accent rule `--accent-gold (2px)`.
* **Left**: Brand Crest with `<BookOpen />` icon in burgundy container framed by gold border, next to serif wordmark `ATHENÆUM` with uppercase subhead `CLASSIC LITERATURE`.
* **Center**: Clean text links with animated bottom indicator on active state.
* **Right**: Auth buttons (Sign In / Register) or User Role Badge (`READER` / `ADMIN`) with sign-out.
* **Responsive Breakpoint (`< 860px`)**: Replaces center nav with a smooth slide-down hamburger drawer.

### Component 2: Literature Catalog Plate (`<LiteratureCard />`)
* **Layout**: Clean horizontal list layout (Cover on left, metadata + brief on right).
* **Cover Aspect Ratio**: 2:3 classical book proportion with gentle inner border (`1px solid var(--border-classic)`).
* **Information Hierarchy**:
  1. Title in serif heading (`font-size: 1.3rem; color: var(--text-primary);`).
  2. Author/Playwright attribution in warm sepia (`Author: Leo Tolstoy`).
  3. Star rating display (`★★★★★` in `--accent-gold` + numeric average + count).
  4. Concise literary brief (2-line clamp).
  5. Category & tag badges.
  6. Action link: Burgundy reading button (`Read Literature →`).

### Component 3: Distraction-Free Reading Container (`<ReadingView />`)
* **Container**: Centered, strictly capped at `760px` with generous margins.
* **Header**: Large display title, creator bio snippet, publication date, and language.
* **Body Prose**:
  * Font: `'Lora', Georgia, serif`.
  * Line height: `1.85`.
  * First letter drop-cap style on opening chapter.
* **Interaction Bar**: Pinned at top or floating sidebar with 1-click Bookmark/Save toggle, font size control, and rating trigger.

### Component 4: Dynamic 1–5 Star Rating Widget (`<StarRating />`)
* **Visuals**: 5 interactive SVG stars with illuminated gold fills (`#C5A059`) and delicate dark brown borders.
* **States**:
  * *Unrated*: Outlined star with translucent gold fill.
  * *Hover*: Filled gold stars corresponding to hovered index (1 to 5).
  * *Active/Selected*: Full gold fill with subtle scale pulse (`transform: scale(1.08)`).
* **Feedback**: Instant display of updated overall average (e.g. `4.8 / 5.0`) and total ratings counter (`Based on 128 scholarly ratings`).

### Component 5: 2-Level Discussion Widget (`<CommentSection />`)
* **Hierarchy**:
  * Level 1: Top-level Comments with user avatar initials in burgundy circle, reader name, timestamp, and content box.
  * Level 2: Direct Replies indented by `36px`, framed by a subtle vertical guide rule (`border-left: 2px solid var(--border-classic)`).
* **Input Area**: Parchment-toned textarea with burgundy focus ring and "Submit Reflection" button.
* **Moderation**: Cascade delete action button for comment owner and Admin, with confirmation dialog.

### Component 6: Admin Dashboard 8-Card KPI Grid (`<KpiGrid />`)
* **Layout**:
  * Desktop ($> 1024px$): 4 columns per row.
  * Tablet ($768px - 1024px$): 2 columns per row.
  * Mobile ($< 768px$): 1 column per row.
* **Card Anatomy**:
  * Surface: `--bg-surface` framed by `--border-classic`.
  * Header: Category icon + metric label in muted uppercase sepia.
  * Metric Value: Display serif number (`2.2rem`), e.g., `4`, `4.7 / 5`, `12`.
  * Trend / Context: Subtext denoting breakdown (e.g., *"Excludes administrative accounts"*).
  * Zero-State Protection: Displays `0` whenever count is zero (never `NaN`, `undefined`, or `null`).

### Component 7: Advanced Search Panel (`<AdvancedSearch />`)
* **Grid**: 2-column or 3-column input field matrix:
  * Field 1: Title (Text input)
  * Field 2: Author / Playwright (Text input)
  * Field 3: Category (Dropdown)
  * Field 4: Language (Dropdown)
  * Field 5: Subject / Theme (Text input)
  * Field 6: Related Tags (Text input)
* **Actions**: Burgundy "Search Library" button + Secondary "Clear Filters" button.

---

## 4. Accessibility & Responsive Guidelines

* **Color Contrast**: All body text on Ivory achieves greater than $7:1$ contrast ratio (WCAG AAA); burgundy on ivory achieves $6.5:1$ (WCAG AA compliant).
* **Touch Targets**: All mobile buttons, star icons, and interactive elements maintain at least $44 \times 44\text{px}$ tappable bounding boxes.
* **Keyboard Navigation**: Explicit `:focus-visible` outlines using illuminated gold and burgundy rings.
* **Screen Reader Semantic Markup**: Native `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, and `<footer>` elements with corresponding `aria-label` attributes.
