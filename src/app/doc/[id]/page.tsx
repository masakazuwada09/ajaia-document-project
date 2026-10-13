'use client';

import React, { useState, useEffect, useCallback, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Document } from '@/types';
import { Navigation } from '@/components/Navigation';
import { DocumentEditor } from '@/components/DocumentEditor';
import { ShareModal } from '@/components/ShareModal';
import { AttachmentsDrawer } from '@/components/AttachmentsDrawer';
import { ImportModal } from '@/components/ImportModal';
import {
  Lock,
  ArrowLeft,
  ShieldAlert,
  Loader2,
  FileQuestion,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

function DocumentPageContent({ id }: { id: string }) {
  const router = useRouter();
  const { currentUser, users, setCurrentUser } = useUser();

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const fetchDocument = useCallback(async () => {
    setIsLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/documents/${id}?userId=${currentUser.id}`);
      const data = await res.json();

      if (res.status === 403) {
        setErrorStatus(403);
        setErrorMessage(data.error || 'Access Denied: You do not have permission to access this document.');
        return;
      }

      if (res.status === 404) {
        setErrorStatus(404);
        setErrorMessage('Document not found or has been deleted.');
        return;
      }

      if (data.document) {
        setDocument(data.document);
      }
    } catch (err) {
      console.error('Failed to load document:', err);
      setErrorStatus(500);
      setErrorMessage('Failed to load document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [id, currentUser.id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleTitleChange = async (newTitle: string) => {
    if (!document) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          title: newTitle,
        }),
      });

      const data = await res.json();
      if (res.ok && data.document) {
        setDocument(data.document);
      }
    } catch (err) {
      console.error('Failed to update title:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveContent = async (html: string, json: string) => {
    if (!document || document.currentUserPermission === 'view') return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          content_html: html,
          content_json: json,
        }),
      });

      const data = await res.json();
      if (res.ok && data.document) {
        setDocument((prev) =>
          prev
            ? {
                ...prev,
                content_html: data.document.content_html,
                content_json: data.document.content_json,
                updated_at: data.document.updated_at,
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed to save document content:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInsertImportedContent = async (importedHtml: string) => {
    if (!document) return;
    const combined = `${document.content_html}<hr/><p><strong>Imported Content:</strong></p>${importedHtml}`;
    await handleSaveContent(combined, '{}');
    fetchDocument();
  };

  // If loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading document...</p>
        </div>
      </div>
    );
  }

  // 403 Forbidden Access Screen (Demonstrates access control explicitly)
  if (errorStatus === 403) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Lock className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              403: Access Restricted
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {errorMessage}
            </p>

            <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <span>Reviewer Permission Check</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                You are currently signed in as <strong>{currentUser.name}</strong> ({currentUser.email}).
                This document is private or has not been shared with your account.
              </p>
              <div className="pt-2 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 mb-1.5 uppercase font-semibold">
                  Quick switch persona to test authorized access:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setCurrentUser(u)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        u.id === currentUser.id
                          ? 'bg-slate-300 text-slate-700 cursor-default'
                          : 'bg-white border border-slate-200 hover:border-indigo-400 text-indigo-700'
                      }`}
                    >
                      {u.name.split(' ')[0]} ({u.role.split(' ')[0]})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 404 Not Found
  if (errorStatus === 404 || !document) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
            <FileQuestion className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900">Document Not Found</h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">{errorMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70">
      <Navigation
        document={document}
        onTitleChange={handleTitleChange}
        isSaving={isSaving}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenAttachments={() => setIsAttachmentsOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
      />

      <DocumentEditor
        document={document}
        onSaveContent={handleSaveContent}
        isSaving={isSaving}
      />

      {/* Share Modal */}
      <ShareModal
        document={document}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        onDocumentUpdated={(updated) => setDocument(updated)}
      />

      {/* Attachments Drawer */}
      <AttachmentsDrawer
        document={document}
        isOpen={isAttachmentsOpen}
        onClose={() => setIsAttachmentsOpen(false)}
        onDocumentUpdated={(updated) => setDocument(updated)}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        currentDocumentId={document.id}
        onContentImported={handleInsertImportedContent}
      />
    </div>
  );
}

export default function DocumentPage({ params }: PageProps) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <DocumentPageContent id={id} />
    </Suspense>
  );
}
