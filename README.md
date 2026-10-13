# Ajaia Docs — AI-Native Collaborative Document Editor

> A lightweight, collaborative document editor inspired by Google Docs, built for fast-moving internal productivity at **Ajaia**. Features rich-text editing, multi-format file ingestion (`.docx`, `.md`, `.txt`), file attachments, role-based sharing (`Owner`, `Editor`, `Viewer`), resilient local persistence via SQLite, and an in-app persona switcher for reviewer testing.

---

## 🚀 Live Demo & Repository
- **Local URL**: `http://localhost:3000`
- **Automated Tests**: `npm test` (Vitest unit & integration suite)

---

## 📋 Table of Contents
1. [Core Features](#-core-features)
2. [Seeded Test Accounts & Reviewer Guide](#-seeded-test-accounts--reviewer-guide)
3. [Quickstart (Local Run)](#-quickstart-local-run)
4. [File Ingestion & Supported Formats](#-file-ingestion--supported-formats)
5. [Sharing & Access Control Model](#-sharing--access-control-model)
6. [Tech Stack](#-tech-stack)
7. [Automated Testing](#-automated-testing)
8. [Project Structure](#-project-structure)

---

## ✨ Core Features

### 1. Document Creation and Authoring
- **Full Rich-Text Editor Ribbon**: Bold (`Ctrl+B`), Italic (`Ctrl+I`), Underline (`Ctrl+U`), Strikethrough, Heading 1/2/3, Bulleted Lists, Numbered Lists, Task Lists with checkboxes, Blockquotes, Code Blocks, and Horizontal Rules.
- **Google Docs Canvas Feel**: Standard centered 8.5in paper sheet with subtle box shadow, comfortable padding, and responsive typography.
- **Real-Time Auto-Save**: Optimistic, debounced auto-saving (700ms debounce) with live status indicators (`Saving...` → `All changes saved`).
- **Inline Title Editing**: Real-time title rename that syncs across the editor, tab title, and dashboard.
- **Word & Character Metrics**: Live word counter, character counter, and estimated reading time indicator in the status footer.
- **Multi-Format Export**: Export any document instantly to **Markdown (.md)**, **HTML (.html)**, **Plain Text (.txt)**, or **Print / PDF**.

### 2. File Upload & Ingestion Workflows
- **Multi-Format Document Import**: Drag and drop `.docx` (Microsoft Word via Mammoth), `.md` (Markdown via Marked), or `.txt` to automatically parse formatting and instantiate an editable rich-text document.
- **In-Editor Import**: Option to insert imported files directly into an existing document draft.
- **Document Attachments**: Associate reference files (PDFs, images, data sheets, CSVs up to 10MB) with any document. Includes preview, download, and file deletion.

### 3. Granular Sharing & Access Control
- **Explicit Role Hierarchy**:
  - **Owner**: Full administrative control (edit, rename, share, revoke access, delete document).
  - **Editor**: Can edit document content, title, and manage attachments. Cannot delete document or modify sharing permissions.
  - **Viewer**: Read-only access. Editor ribbon is locked, mutations are rejected by both client and backend (HTTP 403), with a dedicated "View-Only" notice banner.
- **Dashboard Separation**: Clear segmented views for **All Documents**, **Owned by me** (with `Owner` badge), and **Shared with me** (with `Can edit` or `View only` badge).
- **Share Modal**: Google Docs-inspired modal to invite collaborators, adjust permission levels, revoke access, and copy document link.

### 4. Zero-Friction Reviewer Persona Switcher
- A prominent dropdown in the navigation header allows reviewers to switch between simulated team accounts (**Alice**, **Bob**, **Charlie**, **Diana**) in 1 click without authentication barriers or disposable emails.
- Permissions and views instantly update dynamically to test access rules in real time.

---

## 👥 Seeded Test Accounts & Reviewer Guide

The application comes pre-populated with seeded team members and realistic documents:

| Name | Role | Email | Pre-Configured Documents & Access |
| :--- | :--- | :--- | :--- |
| **Alice Chen** *(Default)* | Product Lead | `alice@ajaia.internal` | **Owner** of *Q4 Strategic Roadmap*<br/>**Editor** on Bob's *RFC-102 Sync Engine*<br/>**Viewer** on Charlie's *Brand Guidelines* |
| **Bob Martinez** | Staff Engineer | `bob@ajaia.internal` | **Owner** of *RFC-102 Sync Engine*<br/>**Editor** on Alice's *Q4 Strategic Roadmap* |
| **Charlie Kim** | Product Designer | `charlie@ajaia.internal` | **Owner** of *Brand Guidelines 2026*<br/>**Viewer** on Alice's *Q4 Strategic Roadmap* |
| **Diana Ross** | Operations Lead | `diana@ajaia.internal` | **Owner** of *Internal Operations & Compensation* (Private doc - not shared) |

### ⚡ Quick 60-Second Permission Test:
1. **Test Owner Privileges**: Start as **Alice Chen**. Open *Ajaia Productivity Suite: Q4 Strategic Roadmap*. Note full editing rights and ability to click **Share** to add/remove collaborators.
2. **Test Editor Privileges**: Switch to **Bob Martinez** in the top-right header. Open *Q4 Strategic Roadmap*. Notice Bob can edit content and title, but cannot delete the document.
3. **Test Viewer Privileges**: Switch to **Charlie Kim**. Open *Q4 Strategic Roadmap*. Notice the yellow **View-Only Mode** banner, disabled formatting toolbar, and read-only canvas.
4. **Test Access Denied (HTTP 403)**: As Charlie or Alice, attempt to navigate to Diana's private document (`/doc/doc-ops-compensation`). Notice the branded **403: Access Restricted** screen with persona recovery options.

---

## 💻 Quickstart (Local Run)

### Prerequisites
- **Node.js**: v18.0.0 or higher (tested on Node v22.19.0)
- **npm**: v9.0.0 or higher

### Installation & Run
```bash
# 1. Clone repository and navigate to folder
cd C:\projects\ajaia-docs

# 2. Install dependencies
npm install

# 3. Run automated test suite
npm test

# 4. Start local development server
npm run dev

# 5. Open your browser at:
# http://localhost:3000
```

### Production Build & Run
```bash
npm run build
npm start
```

---

## 📁 File Ingestion & Supported Formats

| File Extension | Parsing Engine | Behavior |
| :--- | :--- | :--- |
| **`.docx`** | `mammoth` | Extracts styled headings, bold, italic, paragraphs, and unordered/ordered lists into ProseMirror HTML. |
| **`.md` / `.markdown`** | `marked` | Converts markdown headings (`#`), bullet lists, quotes, inline code, and formatting into clean HTML. Automatically extracts first `# Heading` as document title. |
| **`.txt`** | Native stream parser | Splits double line-breaks into semantic `<p>` paragraphs with `<br/>` newline preservation. |
| **`.html` / `.htm`** | Native DOM sanitizer | Ingests pre-formatted web content directly into the document editor. |

> **Sample Files Included**: Sample test files are available in `./sample-files/product-spec.md` and `./sample-files/meeting-notes.txt` for instant drag-and-drop testing.

---

## 🔒 Sharing & Access Control Model

All read and write operations are guarded both at the client interface level and within the server API endpoints:

```
[Client Request] (includes active userId)
       │
       ▼
[Route Handler: /api/documents/[id]]
       │
       ├─► getEffectivePermission(userId, documentId)
       │         │
       │         ├─► If userId == owner_id ───────► 'owner' (All operations permitted)
       │         ├─► If shared with edit ─────────► 'edit'  (Read & Update permitted)
       │         ├─► If shared with view ─────────► 'view'  (Read-only; Mutations rejected 403)
       │         └─► If no record ────────────────► null    (403 Forbidden)
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, Server & Client Components)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 + Tailwind Typography primitives
- **Rich-Text Engine**: TipTap 3 / ProseMirror (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-task-list`)
- **Database & Persistence**: SQLite via `better-sqlite3` with Write-Ahead Logging (`WAL` mode)
- **File Processing**: `mammoth` (.docx to HTML), `marked` (Markdown to HTML)
- **Icons**: `lucide-react`
- **Testing**: `vitest`

---

## 🧪 Automated Testing

The automated test suite in `test/document-flow.test.ts` covers core end-to-end functionality:
- Database schema initialization & automatic user seeding.
- Document creation, saving, and reopening.
- Debounced content & title updates.
- Strict ownership and access control enforcement (Viewer mutation rejections, Editor allowances, Owner deletions).
- Markdown and plain-text file ingestion parsing.
- Document attachments lifecycle.

To execute tests:
```bash
npm test
```

---

## 📂 Project Structure

```
ajaia-docs/
├── data/                       # SQLite persistent storage (ajaia_docs.db)
├── sample-files/               # Sample .md and .txt files for testing import
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── documents/      # Document CRUD and search API
│   │   │   │   ├── [id]/       # Document retrieval, update, delete, sharing, attachments
│   │   │   │   └── import/     # Multi-format file ingestion endpoint
│   │   │   └── users/          # Seeded team members API
│   │   ├── doc/
│   │   │   └── [id]/           # Full-screen document editor page with 403 guard
│   │   ├── globals.css         # Document sheet styling & TipTap typography
│   │   ├── layout.tsx          # App root layout with UserProvider
│   │   └── page.tsx            # Dashboard page (Owned/Shared tabs, search, cards)
│   ├── components/
│   │   ├── AttachmentsDrawer.tsx # Associated file upload & download drawer
│   │   ├── DocumentEditor.tsx  # TipTap ProseMirror editor wrapper & metrics
│   │   ├── EditorToolbar.tsx   # Google Docs formatting toolbar
│   │   ├── ExportMenu.tsx      # Export to Markdown, HTML, Plain Text, PDF
│   │   ├── ImportModal.tsx     # Drag-and-drop file upload modal
│   │   ├── Navigation.tsx      # Header with inline rename, save status, user switch
│   │   ├── ShareModal.tsx      # Collaborator management & permissions modal
│   │   └── UserSwitcher.tsx    # 1-click reviewer persona switcher
│   ├── context/
│   │   └── UserContext.tsx     # Active reviewer session context
│   ├── lib/
│   │   ├── db.ts               # SQLite singleton, schema, queries & authorization
│   │   └── fileParser.ts       # Mammoth & marked file ingestion pipeline
│   └── types/
│       └── index.ts            # User, Document, Share, Attachment type contracts
├── test/
│   └── document-flow.test.ts   # 8 comprehensive Vitest integration tests
├── ARCHITECTURE.md             # System architecture & tradeoff rationale
├── AI_WORKFLOW.md              # AI tools usage & engineering judgment note
├── SUBMISSION.md               # Deliverables checklist & evaluation guide
├── package.json
└── vitest.config.mjs
```
