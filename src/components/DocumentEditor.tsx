'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Document } from '@/types';
import { EditorToolbar } from './EditorToolbar';
import { Eye, Clock, Type, AlignLeft } from 'lucide-react';

interface DocumentEditorProps {
  document: Document;
  onSaveContent: (html: string, json: string) => Promise<void>;
  isSaving: boolean;
}

export function DocumentEditor({
  document,
  onSaveContent,
  isSaving,
}: DocumentEditorProps) {
  const isViewOnly = document.currentUserPermission === 'view';
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Underline,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Placeholder.configure({
      placeholder: 'Type something, or type "/" for commands...',
    }),
  ], []);

  const editor = useEditor({
    extensions,
    content: document.content_html || '<p></p>',
    editable: !isViewOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (isViewOnly) return;

      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);

      // Debounced auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const html = editor.getHTML();
        const json = JSON.stringify(editor.getJSON());
        onSaveContent(html, json);
      }, 700);
    },
  });

  // Keep editor editable state in sync if user / permission changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isViewOnly);
    }
  }, [editor, isViewOnly]);

  // Update initial counts
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(text.length);
    }
  }, [editor]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-100/70">
      {/* View Only Banner */}
      {isViewOnly && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-medium text-amber-800 shadow-2xs no-print">
          <Eye className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>View-Only Mode:</strong> You are viewing this document with read-only access granted by {document.owner?.name}. Editing is disabled.
          </span>
        </div>
      )}

      {/* Editor Toolbar */}
      <EditorToolbar editor={editor} disabled={isViewOnly} />

      {/* Canvas Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center">
        {/* Document Sheet (Standard 8.5 x 11 in page feel) */}
        <div className="w-full max-w-[816px] min-h-[1056px] bg-white rounded-lg shadow-lg border border-slate-200/80 px-8 sm:px-16 py-12 mb-16 transition-all print-page">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-between text-xs text-slate-500 shadow-2xs no-print">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
            {wordCount} words
          </span>
          <span className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-slate-400" />
            {charCount} characters
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {readingTimeMinutes} min read
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-indigo-600 font-medium">Saving changes...</span>
          ) : isViewOnly ? (
            <span className="text-amber-700 font-medium">Read-only</span>
          ) : (
            <span className="text-slate-400">All changes saved to storage</span>
          )}
        </div>
      </div>
    </div>
  );
}
