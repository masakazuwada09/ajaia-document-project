# Ajaia Docs — Submission Overview & Evaluation Guide

## 📌 Submission Checklist

- [x] **Source Code**: Complete Next.js 16 + TypeScript full-stack repository.
- [x] **README.md**: Clear local setup, architecture summary, and persona testing instructions.
- [x] **ARCHITECTURE.md**: Comprehensive architecture note detailing prioritization, scope cuts, tradeoffs, data models, and roadmap.
- [x] **AI_WORKFLOW.md**: AI-native engineering note explaining tools, speedups, rejected suggestions, and verification methods.
- [x] **SUBMISSION.md**: Evaluation guide with credentials, feature status, and links.
- [x] **WALKTHROUGH_VIDEO.txt**: Video walkthrough URL and presentation outline.
- [x] **Automated Tests**: 8 unit & integration tests in `test/document-flow.test.ts` (passing in ~60ms).
- [x] **Sample Test Files**: `.md` and `.txt` files located in `./sample-files/` for immediate drag-and-drop import testing.

---

## 🔗 Links & URLs

- **Local Development URL**: `http://localhost:3000`
- **Live Deployment URL**: `http://localhost:3000` *(Run `npm start` for local production build, or deploy to Vercel/Render/Railway via the provided codebase)*
- **Walkthrough Video URLs**:
  - Document Authoring & Auto-Save: https://youtu.be/1ay-QYBYaw8
  - File Ingestion & Attachments: https://youtu.be/kbDX_xyKoBI
  - Sharing Model & Role Enforcement: https://youtu.be/K-J9-TAftQ8

---

## 👥 Seeded Test Personas & Access Matrix

No passwords, signup flows, or email verifications are required. Simply use the **User Switcher** dropdown in the top-right navigation header to switch personas instantly:

| Persona | Role | Email | Pre-Configured Access |
| :--- | :--- | :--- | :--- |
| **Alice Chen** *(Default)* | Product Lead | `alice@ajaia.internal` | **Owner** of *Q4 Strategic Roadmap*<br/>**Editor** on Bob's *RFC-102 Sync Engine*<br/>**Viewer** on Charlie's *Brand Guidelines* |
| **Bob Martinez** | Staff Engineer | `bob@ajaia.internal` | **Owner** of *RFC-102 Sync Engine*<br/>**Editor** on Alice's *Q4 Strategic Roadmap* |
| **Charlie Kim** | Product Designer | `charlie@ajaia.internal` | **Owner** of *Brand Guidelines 2026*<br/>**Viewer** on Alice's *Q4 Strategic Roadmap* |
| **Diana Ross** | Operations Lead | `diana@ajaia.internal` | **Owner** of *Internal Operations & Compensation* (Private doc - returns 403 to others) |

---

## 🏃 Local Setup Instructions

```bash
# 1. Navigate to project root
cd C:\projects\ajaia-docs

# 2. Install dependencies
npm install

# 3. Run automated tests
npm test

# 4. Start local development server
npm run dev
# Or build and run production server:
# npm run build && npm start

# 5. Open in browser:
# http://localhost:3000
```

---

## 📊 Feature Status: What is Working vs. What Was Deprioritized

### ✅ What is Fully Working End-to-End:
1. **Document Authoring**:
   - Create new documents with 1-click.
   - Inline title renaming with automatic sync across views.
   - TipTap rich-text ribbon: Bold, Italic, Underline, Strikethrough, Heading 1/2/3, Bulleted Lists, Numbered Lists, Task Lists (checkboxes), Blockquotes, Code Blocks, Horizontal Rules.
   - Google Docs-inspired centered 8.5in paper sheet styling.
   - Optimistic, debounced auto-save (700ms) with visual status indicator.
   - Real-time word, character, and reading time counter.
   - Multi-format document export: Markdown (`.md`), HTML (`.html`), Plain Text (`.txt`), and Print / PDF.
2. **File Ingestion & Attachments**:
   - Drag-and-drop file import supporting `.docx` (Microsoft Word via Mammoth), `.md` (Markdown via Marked), `.txt` (Text), and `.html`.
   - Option to import as a new document or insert content into the active draft.
   - Document file attachments panel: upload reference assets (PDFs, images, sheets up to 10MB), preview, download, and delete.
3. **Sharing & Access Control**:
   - Document owner identification and ownership protection.
   - Google Docs-style Share Modal: invite team members, adjust permissions (`Can edit` vs `Can view`), revoke access, and copy document link.
   - Strict server-side and client-side enforcement: Viewers cannot mutate content (HTTP 403) and are presented with a clean View-Only notice banner.
   - Unshared private documents return HTTP 403 with a branded Access Denied recovery screen.
   - Dashboard segmentation: Tabs for "All Documents", "Owned by me" (Owner badge), and "Shared with me" (Shared badge + permission indicator).
4. **Persistence**:
   - SQLite embedded database (`better-sqlite3`) with WAL mode.
   - Automatic schema initialization and database seeding on first run.
   - Data persists across server restarts, browser refreshes, and machine reboots.

### ⚠️ What Was Intentionally Deprioritized (Scope Cuts):
1. **WebSocket / WebRTC CRDT Real-Time Sync**:
   - Deprioritized full peer-to-peer character-by-character collaborative typing (Yjs/Automerge) in favor of optimistic debounced auto-save with deterministic timestamps.
2. **Third-Party OAuth / SSO**:
   - Deprioritized OAuth (Google/GitHub/Clerk) in favor of the in-app reviewer Persona Switcher to ensure zero review friction.
3. **Cloud Object Storage (S3 / R2)**:
   - Deprioritized cloud bucket provisioning in favor of database-persisted data URLs (up to 10MB) to avoid requiring reviewers to provide AWS credentials.

### 🔮 What We Would Build Next (With Another 2–4 Hours):
1. **Live Collaborator Presence & Cursor Awareness**:
   - Integrate Liveblocks or WebSocket broadcast to display active collaborator avatars and real-time selection highlights.
2. **In-Line Comments & Suggestions**:
   - Add ProseMirror comment marks allowing users to highlight text and attach threaded comments or change suggestions.
3. **Document Revision History**:
   - Snapshot document revisions on save and provide a side-by-side diff viewer to preview and restore historical versions.
