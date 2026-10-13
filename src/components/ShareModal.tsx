'use client';

import React, { useState } from 'react';
import { Document, User } from '@/types';
import { useUser } from '@/context/UserContext';
import {
  X,
  Share2,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Shield,
  Eye,
  Edit3,
  Lock,
} from 'lucide-react';

interface ShareModalProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUpdated: (doc: Document) => void;
}

export function ShareModal({
  document,
  isOpen,
  onClose,
  onDocumentUpdated,
}: ShareModalProps) {
  const { currentUser, users } = useUser();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<'edit' | 'view'>('edit');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOwner = document.owner_id === currentUser.id;

  // Available users to add (not owner and not already shared)
  const sharedUserIds = new Set(document.shares?.map((s) => s.user_id) || []);
  const availableUsers = users.filter(
    (u) => u.id !== document.owner_id && !sharedUserIds.has(u.id)
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${document.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestingUserId: currentUser.id,
          targetUserId: selectedUserId,
          permission: selectedPermission,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to share document');
      }

      // Refresh document details
      const docRes = await fetch(`/api/documents/${document.id}?userId=${currentUser.id}`);
      const docData = await docRes.json();
      if (docData.document) {
        onDocumentUpdated(docData.document);
      }
      setSelectedUserId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sharing failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePermission = async (targetUserId: string, permission: 'edit' | 'view') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${document.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestingUserId: currentUser.id,
          targetUserId,
          permission,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update permission');
      }

      const docRes = await fetch(`/api/documents/${document.id}?userId=${currentUser.id}`);
      const docData = await docRes.json();
      if (docData.document) {
        onDocumentUpdated(docData.document);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveShare = async (targetUserId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/documents/${document.id}/share?requestingUserId=${currentUser.id}&targetUserId=${targetUserId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove share');
      }

      const docRes = await fetch(`/api/documents/${document.id}?userId=${currentUser.id}`);
      const docData = await docRes.json();
      if (docData.document) {
        onDocumentUpdated(docData.document);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Share Document</h3>
              <p className="text-xs text-slate-500 truncate max-w-xs">{document.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isOwner && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                You are currently an <strong>{document.currentUserPermission}</strong>. Only the document owner ({document.owner?.name}) can modify sharing permissions.
              </span>
            </div>
          )}

          {/* Add collaborator section (Owners only) */}
          {isOwner && (
            <form onSubmit={handleAddShare} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Add Collaborators
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  disabled={availableUsers.length === 0}
                >
                  <option value="">
                    {availableUsers.length === 0
                      ? 'All team members already have access'
                      : 'Select a team member...'}
                  </option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role}) - {user.email}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPermission}
                  onChange={(e) => setSelectedPermission(e.target.value as 'edit' | 'view')}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="edit">Can edit</option>
                  <option value="view">Can view</option>
                </select>

                <button
                  type="submit"
                  disabled={!selectedUserId || isLoading}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </form>
          )}

          {/* People with access */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              People with access
            </h4>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {/* Owner */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full ${
                      document.owner?.avatarColor || 'bg-indigo-600'
                    } text-white flex items-center justify-center text-xs font-semibold`}
                  >
                    {document.owner ? getInitials(document.owner.name) : 'O'}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-900 flex items-center gap-1.5">
                      {document.owner?.name}
                      {document.owner_id === currentUser.id && (
                        <span className="text-[10px] text-slate-500 font-normal">(you)</span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500">{document.owner?.email}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                  Owner
                </span>
              </div>

              {/* Shared users */}
              {document.shares && document.shares.length > 0 ? (
                document.shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full ${
                          share.user?.avatarColor || 'bg-slate-600'
                        } text-white flex items-center justify-center text-xs font-semibold`}
                      >
                        {share.user ? getInitials(share.user.name) : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900 flex items-center gap-1.5">
                          {share.user?.name}
                          {share.user_id === currentUser.id && (
                            <span className="text-[10px] text-slate-500 font-normal">(you)</span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500">{share.user?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <>
                          <select
                            value={share.permission}
                            onChange={(e) =>
                              handleUpdatePermission(
                                share.user_id,
                                e.target.value as 'edit' | 'view'
                              )
                            }
                            className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700"
                          >
                            <option value="edit">Can edit</option>
                            <option value="view">Can view</option>
                          </select>
                          <button
                            onClick={() => handleRemoveShare(share.user_id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                            title="Remove collaborator access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-600 font-medium px-2 py-0.5 bg-slate-100 rounded-md flex items-center gap-1">
                          {share.permission === 'edit' ? (
                            <>
                              <Edit3 className="w-3 h-3 text-emerald-600" /> Can edit
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-amber-600" /> Can view
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-1">
                  No other collaborators yet. This document is private to the owner.
                </p>
              )}
            </div>
          </div>

          {/* Copy link section */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 bg-white transition-all shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy document link</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
