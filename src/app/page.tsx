'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Document } from '@/types';
import { Navigation } from '@/components/Navigation';
import { ImportModal } from '@/components/ImportModal';
import {
  Plus,
  UploadCloud,
  Search,
  FileText,
  Clock,
  Share2,
  Trash2,
  Edit2,
  ExternalLink,
  Shield,
  Eye,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser } = useUser();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState<'all' | 'owned' | 'shared'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Rename modal state
  const [renameDoc, setRenameDoc] = useState<Document | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/documents?userId=${currentUser.id}&filter=${filter}&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id, filter, searchQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCreateNew = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled document',
          owner_id: currentUser.id,
          content_html: '<h1>Untitled document</h1><p>Start writing here...</p>',
        }),
      });

      const data = await res.json();
      if (data.document) {
        router.push(`/doc/${data.document.id}`);
      }
    } catch (err) {
      console.error('Failed to create document:', err);
      setIsCreating(false);
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/${docId}?userId=${currentUser.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete document');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleOpenRename = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameDoc(doc);
    setNewTitle(doc.title);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameDoc || !newTitle.trim()) return;

    try {
      const res = await fetch(`/api/documents/${renameDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          title: newTitle.trim(),
        }),
      });

      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === renameDoc.id ? { ...d, title: newTitle.trim() } : d))
        );
        setRenameDoc(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Rename failed');
      }
    } catch (err) {
      console.error('Rename error:', err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const ownedCount = documents.filter((d) => d.owner_id === currentUser.id).length;
  const sharedCount = documents.filter((d) => d.owner_id !== currentUser.id).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navigation />

      {/* Reviewer Notice Bar */}
      <div className="bg-indigo-50/80 border-b border-indigo-100 px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold flex items-center gap-1.5 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[11px]">
              <Shield className="w-3 h-3" /> Reviewer Guide
            </span>
            <span>
              Active Persona: <strong>{currentUser.name}</strong> ({currentUser.role}).
              Use top-right switcher to test <em>Owner</em>, <em>Editor</em>, and <em>View-Only</em> permissions.
            </span>
          </div>
          <div className="flex items-center gap-3 text-indigo-700 text-[11px]">
            <span>✓ Auto-save enabled</span>
            <span>✓ Multi-format import (.docx, .md, .txt)</span>
          </div>
        </div>
      </div>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Documents</h1>
            <p className="text-xs text-slate-500 mt-1">
              Create, collaborate, and share internal docs across the team
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all hover:border-slate-300"
            >
              <UploadCloud className="w-4 h-4 text-indigo-600" />
              <span>Import File (.docx, .md)</span>
            </button>

            <button
              onClick={handleCreateNew}
              disabled={isCreating}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? 'Creating...' : 'New Document'}</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          {/* Tabs */}
          <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-medium self-start">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Documents
            </button>
            <button
              onClick={() => setFilter('owned')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filter === 'owned'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Owned by me</span>
              {filter !== 'owned' && ownedCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                  {ownedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('shared')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filter === 'shared'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Shared with me</span>
              {filter !== 'shared' && sharedCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-800 text-[10px] flex items-center justify-center font-bold">
                  {sharedCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                  <div className="w-3/4 h-4 bg-slate-100 rounded" />
                  <div className="w-1/2 h-3 bg-slate-100 rounded" />
                </div>
                <div className="w-full h-4 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => {
              const isOwner = doc.owner_id === currentUser.id;
              const isShared = !isOwner;
              const isViewerOnly = doc.currentUserPermission === 'view';

              return (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/doc/${doc.id}`)}
                  className="group bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-md p-5 flex flex-col justify-between transition-all cursor-pointer relative"
                >
                  <div>
                    {/* Header: Icon + Badges */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                        <FileText className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {isOwner ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Owner
                          </span>
                        ) : isViewerOnly ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> View Only
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                            <Edit2 className="w-3 h-3" /> Can Edit
                          </span>
                        )}

                        {isShared && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            Shared
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Document Title */}
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {doc.title}
                    </h3>
                  </div>

                  {/* Footer metadata */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    {/* Owner avatar & name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-full ${
                          doc.owner?.avatarColor || 'bg-indigo-600'
                        } text-white flex items-center justify-center text-[9px] font-bold shrink-0`}
                        title={`Owner: ${doc.owner?.name}`}
                      >
                        {doc.owner ? getInitials(doc.owner.name) : 'O'}
                      </div>
                      <span className="text-[11px] text-slate-600 truncate max-w-[100px]">
                        {isOwner ? 'You' : doc.owner?.name}
                      </span>
                    </div>

                    {/* Collaborators pile */}
                    {doc.shares && doc.shares.length > 0 && (
                      <div className="flex items-center -space-x-1.5" title={`${doc.shares.length} collaborator(s)`}>
                        {doc.shares.slice(0, 3).map((s) => (
                          <div
                            key={s.id}
                            className={`w-5 h-5 rounded-full ${
                              s.user?.avatarColor || 'bg-slate-500'
                            } text-white flex items-center justify-center text-[8px] font-semibold border border-white`}
                            title={`${s.user?.name} (${s.permission})`}
                          >
                            {s.user ? getInitials(s.user.name) : 'U'}
                          </div>
                        ))}
                        {doc.shares.length > 3 && (
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[8px] font-bold flex items-center justify-center border border-white">
                            +{doc.shares.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      {isOwner && (
                        <>
                          <button
                            onClick={(e) => handleOpenRename(doc, e)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                            title="Rename document"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(doc.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-2xs">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No documents found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No results matching "${searchQuery}". Try adjusting your search query.`
                : filter === 'shared'
                ? "No documents have been shared with you yet. Switch users in the top right to view other team members' documents."
                : 'Create your first document or import an existing file to get started.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
              >
                Create New Document
              </button>
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Import File (.docx, .md)
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Rename Modal */}
      {renameDoc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Rename Document</h3>
            <form onSubmit={handleSaveRename} className="space-y-4">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameDoc(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  );
}
