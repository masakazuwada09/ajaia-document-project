import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { SEEDED_USERS, User, Document, DocumentShare, DocumentAttachment, Permission } from '@/types';

// Ensure data directory exists
const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'ajaia_docs.db');

// Singleton pattern for Next.js hot module reloading
const globalForDb = globalThis as unknown as {
  ajaiaDb?: Database.Database;
};

export function getDb(): Database.Database {
  if (!globalForDb.ajaiaDb) {
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeSchema(db);
    globalForDb.ajaiaDb = db;
  }
  return globalForDb.ajaiaDb;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      avatar_color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content_html TEXT NOT NULL DEFAULT '',
      content_json TEXT NOT NULL DEFAULT '{}',
      owner_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_shares (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      permission TEXT NOT NULL CHECK(permission IN ('edit', 'view')),
      created_at TEXT NOT NULL,
      UNIQUE(document_id, user_id),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_attachments (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      data_url TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
  `);

  // Seed default users if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, role, avatar_color)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((users: User[]) => {
      for (const u of users) {
        insertUser.run(u.id, u.name, u.email, u.role, u.avatarColor);
      }
    });
    insertMany(SEEDED_USERS);
  }

  // Seed sample documents if documents table is empty
  const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number };
  if (docCount.count === 0) {
    seedInitialDocuments(db);
  }
}

function seedInitialDocuments(db: Database.Database) {
  const now = new Date().toISOString();

  const insertDoc = db.prepare(`
    INSERT INTO documents (id, title, content_html, content_json, owner_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertShare = db.prepare(`
    INSERT INTO document_shares (id, document_id, user_id, permission, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Doc 1: Q4 Product Strategy & Roadmap (Owned by Alice, Bob has edit, Charlie has view)
  const doc1Id = 'doc-q4-roadmap';
  const doc1Html = `
    <h1>Ajaia Productivity Suite: Q4 Strategic Roadmap</h1>
    <p>Welcome to the core strategic initiative for Q4. Our primary mission is to empower internal product and engineering teams with <strong>delightfully fast, friction-free collaboration tools</strong>.</p>
    <h2>Key Objectives & Deliverables</h2>
    <ul>
      <li><strong>Rich-Text Document Authoring:</strong> Ship intuitive editing with formatting (bold, italic, underline, structured headings, and list management).</li>
      <li><strong>Flexible File Workflows:</strong> Seamlessly ingest existing <code>.docx</code>, <code>.md</code>, and <code>.txt</code> files directly into editable documents.</li>
      <li><strong>Transparent Sharing:</strong> Enable explicit document access controls with distinct <em>Owner</em>, <em>Editor</em>, and <em>Viewer</em> roles.</li>
      <li><strong>Resilient Offline Persistence:</strong> Provide zero-friction local storage paired with sub-second auto-save reliability.</li>
    </ul>
    <h2>Target Milestones</h2>
    <ol>
      <li><strong>Sprint 1:</strong> MVP core editor runtime with TipTap & ProseMirror schemas.</li>
      <li><strong>Sprint 2:</strong> Multi-format file ingestion pipeline and document attachment support.</li>
      <li><strong>Sprint 3:</strong> Access control matrix verification and end-to-end automated testing.</li>
    </ol>
    <blockquote>"Great tools disappear behind the creative flow of the team." — Ajaia Product Manifesto</blockquote>
  `;

  // Doc 2: RFC-102: Collaborative Sync Engine (Owned by Bob, Alice has edit)
  const doc2Id = 'doc-rfc-sync';
  const doc2Html = `
    <h1>RFC-102: Collaborative Synchronization Engine</h1>
    <p><strong>Author:</strong> Bob Martinez (Staff Engineer)<br/><strong>Status:</strong> Approved</p>
    <h2>Overview</h2>
    <p>This technical RFC outlines our synchronization architecture for collaborative editing. We evaluated both <em>Operational Transformation (OT)</em> and <em>Conflict-free Replicated Data Types (CRDTs)</em> for concurrent browser editing.</p>
    <h2>Architectural Decision</h2>
    <p>For our initial milestone, we prioritized an <strong>optimistic debounced persistence loop</strong> backed by atomic SQLite transactions. This guarantees:</p>
    <ul>
      <li>Zero network blocking during rapid typing.</li>
      <li>Deterministic revision timestamps and conflict prevention.</li>
      <li>Sub-second write latencies without heavy distributed infrastructure overhead.</li>
    </ul>
    <h2>Security & Access Control Matrix</h2>
    <p>Document read/write operations enforce role validations before any database transaction:</p>
    <pre><code>// Authorization Guard
if (userRole === 'view' && requestType === 'MUTATION') {
  return Response.json({ error: 'Forbidden: Document is View Only' }, { status: 403 });
}</code></pre>
  `;

  // Doc 3: Design Guidelines (Owned by Charlie, Alice has view)
  const doc3Id = 'doc-brand-guidelines';
  const doc3Html = `
    <h1>Ajaia Brand & Design Guidelines 2026</h1>
    <p><em>Curated by Charlie Kim (Product Designer)</em></p>
    <h2>Core Visual Tenets</h2>
    <ul>
      <li><strong>Clarity:</strong> High contrast, unambiguous states, and clear typographic hierarchy.</li>
      <li><strong>Calm Focus:</strong> Subtle neutral backdrops (<code>slate-50</code>, <code>zinc-100</code>) to let document content breathe.</li>
      <li><strong>Instant Feedback:</strong> Micro-interactions for saving, sharing status, and permission alerts.</li>
    </ul>
    <h2>Document Page Layout Specifications</h2>
    <p>Document canvases follow a traditional 8.5in paper aspect ratio with a minimum height of 1056px and 48px page margins.</p>
  `;

  // Doc 4: Private Ops Document (Owned by Diana, not shared)
  const doc4Id = 'doc-ops-compensation';
  const doc4Html = `
    <h1>Internal Operations & Team Banding</h1>
    <p><strong>Owner:</strong> Diana Ross (Operations Lead)</p>
    <p>This document contains sensitive organizational planning metrics and is strictly confidential.</p>
  `;

  // Insert documents
  insertDoc.run(doc1Id, 'Ajaia Productivity Suite: Q4 Strategic Roadmap', doc1Html, '{}', 'alice', now, now);
  insertDoc.run(doc2Id, 'RFC-102: Collaborative Synchronization Engine', doc2Html, '{}', 'bob', now, now);
  insertDoc.run(doc3Id, 'Ajaia Brand & Design Guidelines 2026', doc3Html, '{}', 'charlie', now, now);
  insertDoc.run(doc4Id, 'Internal Operations & Team Banding', doc4Html, '{}', 'diana', now, now);

  // Insert shares
  insertShare.run('share-1', doc1Id, 'bob', 'edit', now);
  insertShare.run('share-2', doc1Id, 'charlie', 'view', now);
  insertShare.run('share-3', doc2Id, 'alice', 'edit', now);
  insertShare.run('share-4', doc3Id, 'alice', 'view', now);
}

// Queries and Helpers
export function getAllUsers(): User[] {
  const db = getDb();
  const rows = db.prepare('SELECT id, name, email, role, avatar_color as avatarColor FROM users').all() as User[];
  return rows;
}

export function getUserById(id: string): User | undefined {
  const db = getDb();
  const row = db.prepare('SELECT id, name, email, role, avatar_color as avatarColor FROM users WHERE id = ?').get(id) as User | undefined;
  return row;
}

export function getEffectivePermission(userId: string, documentId: string): Permission | null {
  const db = getDb();
  const doc = db.prepare('SELECT owner_id FROM documents WHERE id = ?').get(documentId) as { owner_id: string } | undefined;
  if (!doc) return null;
  if (doc.owner_id === userId) return 'owner';

  const share = db.prepare('SELECT permission FROM document_shares WHERE document_id = ? AND user_id = ?').get(documentId, userId) as { permission: 'edit' | 'view' } | undefined;
  if (share) return share.permission;

  return null;
}

export function listDocuments(userId: string, filter: 'all' | 'owned' | 'shared' = 'all', search = ''): Document[] {
  const db = getDb();
  const queryParam = `%${search.toLowerCase()}%`;

  let sql = `
    SELECT d.id, d.title, d.owner_id, d.created_at, d.updated_at,
           u.name as owner_name, u.email as owner_email, u.role as owner_role, u.avatar_color as owner_avatar,
           CASE 
             WHEN d.owner_id = ? THEN 'owner'
             WHEN s.permission IS NOT NULL THEN s.permission
             ELSE NULL
           END as current_user_permission
    FROM documents d
    JOIN users u ON d.owner_id = u.id
    LEFT JOIN document_shares s ON d.id = s.document_id AND s.user_id = ?
    WHERE (d.owner_id = ? OR s.user_id = ?)
  `;

  if (filter === 'owned') {
    sql += ` AND d.owner_id = ?`;
  } else if (filter === 'shared') {
    sql += ` AND d.owner_id != ? AND s.user_id IS NOT NULL`;
  }

  if (search) {
    sql += ` AND LOWER(d.title) LIKE ?`;
  }

  sql += ` ORDER BY d.updated_at DESC`;

  let params: (string | undefined)[] = [];
  if (filter === 'owned') {
    params = [userId, userId, userId, userId, userId];
  } else if (filter === 'shared') {
    params = [userId, userId, userId, userId, userId];
  } else {
    params = [userId, userId, userId, userId];
  }

  if (search) {
    params.push(queryParam);
  }

  const rows = db.prepare(sql).all(...params) as Array<{
    id: string;
    title: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
    owner_name: string;
    owner_email: string;
    owner_role: string;
    owner_avatar: string;
    current_user_permission: Permission;
  }>;

  // Fetch shares count / users for each doc
  return rows.map((r) => {
    const shares = db.prepare(`
      SELECT s.id, s.document_id, s.user_id, s.permission, s.created_at,
             u.name, u.email, u.role, u.avatar_color as avatarColor
      FROM document_shares s
      JOIN users u ON s.user_id = u.id
      WHERE s.document_id = ?
    `).all(r.id) as Array<{
      id: string;
      document_id: string;
      user_id: string;
      permission: 'edit' | 'view';
      created_at: string;
      name: string;
      email: string;
      role: string;
      avatarColor: string;
    }>;

    return {
      id: r.id,
      title: r.title,
      content_html: '',
      content_json: '{}',
      owner_id: r.owner_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      currentUserPermission: r.current_user_permission,
      owner: {
        id: r.owner_id,
        name: r.owner_name,
        email: r.owner_email,
        role: r.owner_role,
        avatarColor: r.owner_avatar,
      },
      shares: shares.map((s) => ({
        id: s.id,
        document_id: s.document_id,
        user_id: s.user_id,
        permission: s.permission,
        created_at: s.created_at,
        user: {
          id: s.user_id,
          name: s.name,
          email: s.email,
          role: s.role,
          avatarColor: s.avatarColor,
        },
      })),
    };
  });
}

export function getDocumentById(documentId: string, userId: string): Document | null {
  const db = getDb();
  const perm = getEffectivePermission(userId, documentId);
  if (!perm) return null;

  const doc = db.prepare(`
    SELECT d.id, d.title, d.content_html, d.content_json, d.owner_id, d.created_at, d.updated_at,
           u.name as owner_name, u.email as owner_email, u.role as owner_role, u.avatar_color as owner_avatar
    FROM documents d
    JOIN users u ON d.owner_id = u.id
    WHERE d.id = ?
  `).get(documentId) as {
    id: string;
    title: string;
    content_html: string;
    content_json: string;
    owner_id: string;
    created_at: string;
    updated_at: string;
    owner_name: string;
    owner_email: string;
    owner_role: string;
    owner_avatar: string;
  } | undefined;

  if (!doc) return null;

  const shares = db.prepare(`
    SELECT s.id, s.document_id, s.user_id, s.permission, s.created_at,
           u.name, u.email, u.role, u.avatar_color as avatarColor
    FROM document_shares s
    JOIN users u ON s.user_id = u.id
    WHERE s.document_id = ?
  `).all(documentId) as Array<{
    id: string;
    document_id: string;
    user_id: string;
    permission: 'edit' | 'view';
    created_at: string;
    name: string;
    email: string;
    role: string;
    avatarColor: string;
  }>;

  const attachments = db.prepare(`
    SELECT id, document_id, filename, file_type, file_size, data_url, created_at
    FROM document_attachments
    WHERE document_id = ?
    ORDER BY created_at DESC
  `).all(documentId) as DocumentAttachment[];

  return {
    id: doc.id,
    title: doc.title,
    content_html: doc.content_html,
    content_json: doc.content_json,
    owner_id: doc.owner_id,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    currentUserPermission: perm,
    owner: {
      id: doc.owner_id,
      name: doc.owner_name,
      email: doc.owner_email,
      role: doc.owner_role,
      avatarColor: doc.owner_avatar,
    },
    shares: shares.map((s) => ({
      id: s.id,
      document_id: s.document_id,
      user_id: s.user_id,
      permission: s.permission,
      created_at: s.created_at,
      user: {
        id: s.user_id,
        name: s.name,
        email: s.email,
        role: s.role,
        avatarColor: s.avatarColor,
      },
    })),
    attachments,
  };
}

export function createDocument(params: {
  id?: string;
  title?: string;
  content_html?: string;
  content_json?: string;
  owner_id: string;
}): Document {
  const db = getDb();
  const id = params.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const title = (params.title || 'Untitled document').trim();
  const content_html = params.content_html || '<p></p>';
  const content_json = params.content_json || '{}';
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO documents (id, title, content_html, content_json, owner_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, content_html, content_json, params.owner_id, now, now);

  return getDocumentById(id, params.owner_id)!;
}

export function updateDocument(
  documentId: string,
  userId: string,
  data: { title?: string; content_html?: string; content_json?: string }
): Document | null {
  const perm = getEffectivePermission(userId, documentId);
  if (perm !== 'owner' && perm !== 'edit') {
    return null; // Not authorized
  }

  const db = getDb();
  const current = db.prepare('SELECT title, content_html, content_json FROM documents WHERE id = ?').get(documentId) as {
    title: string;
    content_html: string;
    content_json: string;
  } | undefined;

  if (!current) return null;

  const newTitle = data.title !== undefined ? data.title.trim() : current.title;
  const newHtml = data.content_html !== undefined ? data.content_html : current.content_html;
  const newJson = data.content_json !== undefined ? data.content_json : current.content_json;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE documents
    SET title = ?, content_html = ?, content_json = ?, updated_at = ?
    WHERE id = ?
  `).run(newTitle, newHtml, newJson, now, documentId);

  return getDocumentById(documentId, userId);
}

export function deleteDocument(documentId: string, userId: string): boolean {
  const perm = getEffectivePermission(userId, documentId);
  if (perm !== 'owner') {
    return false; // Only owners can delete
  }

  const db = getDb();
  const res = db.prepare('DELETE FROM documents WHERE id = ?').run(documentId);
  return res.changes > 0;
}

export function addOrUpdateShare(
  documentId: string,
  requestingUserId: string,
  targetUserId: string,
  permission: 'edit' | 'view'
): DocumentShare | null {
  const perm = getEffectivePermission(requestingUserId, documentId);
  if (perm !== 'owner') {
    return null; // Only owners can manage shares
  }

  const db = getDb();
  const shareId = `share-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO document_shares (id, document_id, user_id, permission, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(document_id, user_id) DO UPDATE SET permission = excluded.permission
  `).run(shareId, documentId, targetUserId, permission, now);

  const targetUser = getUserById(targetUserId);
  return {
    id: shareId,
    document_id: documentId,
    user_id: targetUserId,
    permission,
    created_at: now,
    user: targetUser,
  };
}

export function removeShare(documentId: string, requestingUserId: string, targetUserId: string): boolean {
  const perm = getEffectivePermission(requestingUserId, documentId);
  if (perm !== 'owner') {
    return false; // Only owner can revoke
  }

  const db = getDb();
  const res = db.prepare('DELETE FROM document_shares WHERE document_id = ? AND user_id = ?').run(documentId, targetUserId);
  return res.changes > 0;
}

export function addAttachment(params: {
  documentId: string;
  userId: string;
  filename: string;
  file_type: string;
  file_size: number;
  data_url: string;
}): DocumentAttachment | null {
  const perm = getEffectivePermission(params.userId, params.documentId);
  if (perm !== 'owner' && perm !== 'edit') {
    return null;
  }

  const db = getDb();
  const id = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO document_attachments (id, document_id, filename, file_type, file_size, data_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, params.documentId, params.filename, params.file_type, params.file_size, params.data_url, now);

  return {
    id,
    document_id: params.documentId,
    filename: params.filename,
    file_type: params.file_type,
    file_size: params.file_size,
    data_url: params.data_url,
    created_at: now,
  };
}

export function deleteAttachment(attachmentId: string, userId: string): boolean {
  const db = getDb();
  const att = db.prepare('SELECT document_id FROM document_attachments WHERE id = ?').get(attachmentId) as { document_id: string } | undefined;
  if (!att) return false;

  const perm = getEffectivePermission(userId, att.document_id);
  if (perm !== 'owner' && perm !== 'edit') {
    return false;
  }

  const res = db.prepare('DELETE FROM document_attachments WHERE id = ?').run(attachmentId);
  return res.changes > 0;
}
