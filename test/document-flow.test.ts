import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDb,
  getAllUsers,
  createDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
  addOrUpdateShare,
  removeShare,
  getEffectivePermission,
  listDocuments,
  addAttachment,
} from '../src/lib/db';
import { parseDocumentFile } from '../src/lib/fileParser';

describe('Ajaia Docs - Core Data & Access Control Engine', () => {
  beforeEach(() => {
    // Ensure DB is initialized
    getDb();
  });

  it('initializes and verifies pre-seeded team members', () => {
    const users = getAllUsers();
    expect(users.length).toBeGreaterThanOrEqual(4);

    const userIds = users.map((u) => u.id);
    expect(userIds).toContain('alice');
    expect(userIds).toContain('bob');
    expect(userIds).toContain('charlie');
    expect(userIds).toContain('diana');
  });

  it('creates, saves, and reopens documents with full fidelity', () => {
    const testTitle = 'Sprint 42 Architecture Blueprint';
    const testHtml = '<h1>Blueprint</h1><p>High performance doc editor.</p>';

    const newDoc = createDocument({
      title: testTitle,
      content_html: testHtml,
      owner_id: 'alice',
    });

    expect(newDoc).toBeDefined();
    expect(newDoc.id).toBeDefined();
    expect(newDoc.title).toBe(testTitle);
    expect(newDoc.content_html).toBe(testHtml);
    expect(newDoc.owner_id).toBe('alice');

    // Reopen document
    const retrieved = getDocumentById(newDoc.id, 'alice');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe(testTitle);
    expect(retrieved?.currentUserPermission).toBe('owner');
  });

  it('updates document content and title with debounced save semantics', () => {
    const doc = createDocument({
      title: 'Initial Title',
      content_html: '<p>Draft</p>',
      owner_id: 'bob',
    });

    const updated = updateDocument(doc.id, 'bob', {
      title: 'Final Title v2',
      content_html: '<p>Revised draft with <strong>bold</strong> points.</p>',
    });

    expect(updated).not.toBeNull();
    expect(updated?.title).toBe('Final Title v2');
    expect(updated?.content_html).toContain('<strong>bold</strong>');
  });

  it('strictly enforces ownership and permissions on document mutations', () => {
    // Alice creates a private doc
    const privateDoc = createDocument({
      title: 'Alice Confidential Notes',
      content_html: '<p>Top secret</p>',
      owner_id: 'alice',
    });

    // Bob tries to access without being shared -> forbidden
    const bobAccess = getDocumentById(privateDoc.id, 'bob');
    expect(bobAccess).toBeNull();
    expect(getEffectivePermission('bob', privateDoc.id)).toBeNull();

    // Bob tries to update -> returns null (forbidden)
    const unauthorizedUpdate = updateDocument(privateDoc.id, 'bob', {
      title: 'Hacked Title',
    });
    expect(unauthorizedUpdate).toBeNull();

    // Alice shares with Bob as VIEW only
    const share = addOrUpdateShare(privateDoc.id, 'alice', 'bob', 'view');
    expect(share).not.toBeNull();
    expect(share?.permission).toBe('view');

    // Bob can now view
    const bobDoc = getDocumentById(privateDoc.id, 'bob');
    expect(bobDoc).not.toBeNull();
    expect(bobDoc?.currentUserPermission).toBe('view');

    // But Bob CANNOT edit as a viewer
    const bobEditAttempt = updateDocument(privateDoc.id, 'bob', {
      content_html: '<p>Illegal edit</p>',
    });
    expect(bobEditAttempt).toBeNull();

    // Alice upgrades Bob to EDIT permission
    addOrUpdateShare(privateDoc.id, 'alice', 'bob', 'edit');
    expect(getEffectivePermission('bob', privateDoc.id)).toBe('edit');

    // Bob can now edit
    const bobSuccessfulEdit = updateDocument(privateDoc.id, 'bob', {
      content_html: '<p>Bob authorized edits</p>',
    });
    expect(bobSuccessfulEdit).not.toBeNull();
    expect(bobSuccessfulEdit?.content_html).toBe('<p>Bob authorized edits</p>');

    // Bob tries to delete -> forbidden (only owner can delete)
    const bobDeleteAttempt = deleteDocument(privateDoc.id, 'bob');
    expect(bobDeleteAttempt).toBe(false);

    // Alice revokes Bob's share
    const revokeSuccess = removeShare(privateDoc.id, 'alice', 'bob');
    expect(revokeSuccess).toBe(true);
    expect(getEffectivePermission('bob', privateDoc.id)).toBeNull();
  });

  it('filters dashboard documents between owned and shared correctly', () => {
    // Alice lists docs
    const ownedDocs = listDocuments('alice', 'owned');
    expect(ownedDocs.every((d) => d.owner_id === 'alice')).toBe(true);

    const sharedDocs = listDocuments('alice', 'shared');
    expect(sharedDocs.every((d) => d.owner_id !== 'alice')).toBe(true);
  });

  it('supports document attachments', () => {
    const doc = createDocument({
      title: 'Attachment Test Doc',
      owner_id: 'alice',
    });

    const attachment = addAttachment({
      documentId: doc.id,
      userId: 'alice',
      filename: 'spec.pdf',
      file_type: 'application/pdf',
      file_size: 1024,
      data_url: 'data:application/pdf;base64,JVBERi0xLjQK...',
    });

    expect(attachment).not.toBeNull();
    expect(attachment?.filename).toBe('spec.pdf');

    const reopened = getDocumentById(doc.id, 'alice');
    expect(reopened?.attachments?.length).toBe(1);
    expect(reopened?.attachments?.[0].filename).toBe('spec.pdf');
  });
});

describe('File Ingestion & Parsing Workflow', () => {
  it('parses markdown documents with headings and formatting into rich text HTML', async () => {
    const mdContent = `# Project Kickoff\n\nWelcome to the team! Here is our plan:\n- Item 1\n- Item 2\n\n**Important:** Launch on time.`;
    const buffer = Buffer.from(mdContent, 'utf-8');

    const result = await parseDocumentFile(buffer, 'project-kickoff.md');
    expect(result.title).toBe('Project Kickoff');
    expect(result.html).toContain('Welcome to the team!');
    expect(result.html).toContain('<ul>');
    expect(result.html).toContain('<strong>Important:</strong>');
  });

  it('parses plain text files into structured paragraphs', async () => {
    const txtContent = `Paragraph one of document.\n\nParagraph two with details.`;
    const buffer = Buffer.from(txtContent, 'utf-8');

    const result = await parseDocumentFile(buffer, 'notes.txt');
    expect(result.title).toBe('Notes');
    expect(result.html).toContain('<p>Paragraph one of document.</p>');
    expect(result.html).toContain('<p>Paragraph two with details.</p>');
  });
});
