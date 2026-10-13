# AI-Native Engineering Workflow & Judgment Note

## 1. AI Tools Utilized

During the development of **Ajaia Docs**, AI tools were employed as force multipliers for velocity, boilerplating, and exploratory scaffolding:
- **Google Antigravity / Gemini 3.8 Flash**: Primary pair-programming agent for rapid architectural ideation, schema generation, full stack TypeScript implementation, and integration test authoring.
- **Prompt-Driven Code Generation**: Utilized for ProseMirror/TipTap extension wiring, Mammoth `.docx` buffer ingestion, and Tailwind CSS v4 styling primitives.

---

## 2. Where AI Materially Accelerated Delivery

AI contributed significant speedups across four major phases of the project:

### 1. TipTap & ProseMirror Scaffolding (Saved ~60 minutes)
Configuring ProseMirror from scratch is notoriously verbose, requiring schemas, plugins, commands, and keymaps. AI accelerated the configuration of TipTap's `StarterKit`, `Underline`, `TaskList`, and `Placeholder` extensions, enabling a complete Google Docs-style formatting ribbon in minutes.

### 2. Multi-Format File Ingestion Pipeline (Saved ~45 minutes)
Instead of manually researching Mammoth's buffer conversion options and Marked's AST parsing quirks, AI quickly scaffolded `parseDocumentFile()`. It extracted headings from Markdown, stripped binary Word artifacts into semantic HTML, and safely wrapped plain-text linebreaks in `<p>` elements.

### 3. SQLite Database Layer & Authorization Queries (Saved ~40 minutes)
AI generated the initial SQLite schema, table relations, and SQL queries with foreign keys and cascading deletes. It established the `getEffectivePermission()` helper that cleanly resolves whether a user is an `owner`, `edit`, or `view` collaborator.

### 4. Integration Test Suite Generation (Saved ~30 minutes)
AI rapidly produced the 8 integration test scenarios in `test/document-flow.test.ts`, verifying document creation, debounced auto-save behavior, sharing mutations, and permission enforcement boundaries without manual boilerplate.

---

## 3. What AI-Generated Output Was Changed or Rejected

True AI-native engineering requires applying **human product judgment and engineering skepticism** to AI suggestions. Key instances where AI output was explicitly rejected or refactored:

### 1. Rejected Over-Engineered Auth Infrastructure
- **Initial AI Proposal**: Suggested integrating Clerk or NextAuth with GitHub OAuth and external JWT session management.
- **Engineering Rejection**: OAuth creates significant reviewer friction (requiring third-party developer secrets, signup forms, and disposable emails). For a 4–6 hour assignment evaluated by internal reviewers, an **in-app Persona Switcher** with pre-seeded accounts (`Alice`, `Bob`, `Charlie`, `Diana`) was vastly superior. It allowed reviewers to test permission changes and view-only restrictions in under 30 seconds.

### 2. Rejected Client-Side Only Permission Checks
- **Initial AI Output**: Attempted to disable the edit toolbar on the client based solely on UI state, leaving the `PUT /api/documents/[id]` route open to any user ID.
- **Engineering Correction**: Strictly rejected. Server-side validation was added to every mutation endpoint to ensure that even if a viewer bypasses the UI controls, the API rejects mutations with `HTTP 403 Forbidden`.

### 3. Refactored Next.js 16 Experimental Cache Clash
- **AI Tooling Output**: `create-next-app` generated `next.config.ts` with experimental canary flags (`cacheComponents: true` and `partialPrefetching: true`), which broke dynamic page builds when accessing URL parameters.
- **Engineering Correction**: Diagnosed the build failure, stripped out unstable canary flags, wrapped dynamic client parameters in `<Suspense>`, and restored rock-solid production compilation.

### 4. Renamed Variable Collisions in Export Menu
- **AI Tooling Output**: Used `document.addEventListener` inside a component where `document` was passed as a prop name (`interface ExportMenuProps { document: Document }`).
- **Engineering Correction**: Recognized the shadowing between the TypeScript prop and the browser global `window.document`, correcting it to `window.document.addEventListener`.

---

## 4. Verification of Correctness, UX Quality & Reliability

To ensure high engineering standards, multiple layers of verification were executed:

### 1. Automated Integration Tests
- Built and ran 8 automated tests with `vitest` covering schema initialization, document mutations, permission matrix enforcement (viewers cannot edit, unshared users receive 403, editors can update), and file parsing.
- Result: **8 passed, 0 failed, 61ms execution time**.

### 2. Live Permission Matrix Testing
- Verified all 4 roles interactively:
  - **Alice (Owner)**: Can edit, rename, share, and delete.
  - **Bob (Editor)**: Can edit content and rename, but cannot delete Alice's doc.
  - **Charlie (Viewer)**: Opens Alice's doc in read-only mode with a yellow banner; toolbar is disabled.
  - **Diana (Private Doc Owner)**: Accessing Diana's private compensation document as Alice yields a branded **403: Access Restricted** screen.

### 3. End-to-End File Import Validation
- Tested importing `.md` files (converts `# Heading` to H1 and lists to `<ul>`), `.txt` files (paragraphs and linebreaks preserved), and verified instant document creation.

### 4. Production Build Verification
- Verified production build compiles cleanly (`next build`) with 0 lint or TypeScript errors, generating static and dynamic routes.
