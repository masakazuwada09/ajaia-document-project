'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  FileCode,
  Undo,
  Redo,
  RemoveFormatting,
  Minus,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

export function EditorToolbar({ editor, disabled }: EditorToolbarProps) {
  if (!editor) return null;

  const currentHeading = editor.isActive('heading', { level: 1 })
    ? '1'
    : editor.isActive('heading', { level: 2 })
    ? '2'
    : editor.isActive('heading', { level: 3 })
    ? '3'
    : 'p';

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'p') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(val, 10) as 1 | 2 | 3;
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const btnClass = (active: boolean) =>
    `p-1.5 rounded-md transition-colors text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed ${
      active
        ? 'bg-indigo-100 text-indigo-700 font-semibold'
        : 'hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-1.5 shadow-2xs no-print">
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          className={btnClass(false)}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          className={btnClass(false)}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Style selector */}
      <div className="pr-2 border-r border-slate-200">
        <select
          value={currentHeading}
          onChange={handleHeadingChange}
          disabled={disabled}
          className="text-xs font-medium border border-slate-200 rounded-md px-2.5 py-1.5 bg-slate-50 text-slate-800 hover:bg-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        >
          <option value="p">Normal text</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
      </div>

      {/* Font formatting */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          className={btnClass(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          className={btnClass(editor.isActive('italic'))}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={disabled}
          className={btnClass(editor.isActive('underline'))}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          className={btnClass(editor.isActive('strike'))}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={disabled}
          className={btnClass(editor.isActive('code'))}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          className={btnClass(editor.isActive('bulletList'))}
          title="Bulleted List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          className={btnClass(editor.isActive('orderedList'))}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          disabled={disabled}
          className={btnClass(editor.isActive('taskList'))}
          title="Task List / Checklist"
        >
          <CheckSquare className="w-4 h-4" />
        </button>
      </div>

      {/* Blocks & Extras */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
          className={btnClass(editor.isActive('blockquote'))}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          disabled={disabled}
          className={btnClass(editor.isActive('codeBlock'))}
          title="Code Block"
        >
          <FileCode className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
          className={btnClass(false)}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Clear Formatting */}
      <div>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          disabled={disabled}
          className={btnClass(false)}
          title="Clear Formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
