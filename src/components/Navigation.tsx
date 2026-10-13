'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Document } from '@/types';
import { UserSwitcher } from './UserSwitcher';
import { ExportMenu } from './ExportMenu';
import {
  FileText,
  Share2,
  Paperclip,
  UploadCloud,
  Check,
  Loader2,
  ChevronLeft,
  Users,
} from 'lucide-react';

interface NavigationProps {
  document?: Document;
  onTitleChange?: (newTitle: string) => void;
  isSaving?: boolean;
  onOpenShare?: () => void;
  onOpenAttachments?: () => void;
  onOpenImport?: () => void;
}

export function Navigation({
  document,
  onTitleChange,
  isSaving,
  onOpenShare,
  onOpenAttachments,
  onOpenImport,
}: NavigationProps) {
  const [title, setTitle] = useState(document?.title || '');
  const isViewOnly = document?.currentUserPermission === 'view';

  useEffect(() => {
    if (document?.title) {
      setTitle(document.title);
    }
  }, [document?.title]);

  const handleTitleBlur = () => {
    if (onTitleChange && title.trim() && title !== document?.title) {
      onTitleChange(title.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-4 z-40 no-print">
      {/* Left side: Brand + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/"
          className="flex items-center gap-2 group shrink-0"
          title="Back to all documents"
        >
          {document ? (
            <div className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </div>
          ) : null}
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition-colors">
            <FileText className="w-4.5 h-4.5" />
          </div>
          {!document && (
            <span className="font-bold text-slate-900 tracking-tight text-base hidden sm:inline">
              Ajaia<span className="text-indigo-600 font-semibold">Docs</span>
            </span>
          )}
        </Link>

        {document && (
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              {isViewOnly ? (
                <span className="text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md px-1">
                  {title}
                </span>
              ) : (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Untitled document"
                  className="text-sm font-semibold text-slate-900 hover:bg-slate-100 focus:bg-white rounded-md px-2 py-0.5 border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden transition-all truncate max-w-xs sm:max-w-md"
                />
              )}

              {/* Save status pill */}
              <div className="hidden md:flex items-center text-[11px] text-slate-500 gap-1 px-1.5 py-0.5 rounded">
                {isSaving ? (
                  <>
                    <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-slate-400">Saved</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side: Action buttons & User switcher */}
      <div className="flex items-center gap-2 shrink-0">
        {document && (
          <>
            {/* Import file into doc */}
            <button
              onClick={onOpenImport}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
              title="Import file into document"
            >
              <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
              <span>Import</span>
            </button>

            {/* Attachments drawer trigger */}
            <button
              onClick={onOpenAttachments}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
              title="View or upload attachments"
            >
              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Files</span>
              {document.attachments && document.attachments.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                  {document.attachments.length}
                </span>
              )}
            </button>

            {/* Export Menu */}
            <ExportMenu document={document} />

            {/* Share button */}
            <button
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              title="Share document with team members"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
              {document.shares && document.shares.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-indigo-800 text-[10px]">
                  {document.shares.length}
                </span>
              )}
            </button>
          </>
        )}

        {/* User Switcher (Reviewer Persona Switcher) */}
        <UserSwitcher />
      </div>
    </header>
  );
}
