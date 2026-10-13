'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
  X,
  UploadCloud,
  FileText,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If provided, allows inserting content into current editor instead of creating new doc
  onContentImported?: (html: string) => void;
  currentDocumentId?: string;
}

export function ImportModal({
  isOpen,
  onClose,
  onContentImported,
  currentDocumentId,
}: ImportModalProps) {
  const { currentUser } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'new_doc' | 'insert_current'>(
    currentDocumentId && onContentImported ? 'insert_current' : 'new_doc'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['docx', 'md', 'markdown', 'txt', 'html', 'htm'].includes(ext || '')) {
      setError('Unsupported file type. Please upload a .docx, .md, .txt, or .html file.');
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', currentUser.id);

      if (importMode === 'insert_current' && onContentImported) {
        formData.append('action', 'parse');
        const res = await fetch('/api/documents/import', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Import failed');

        onContentImported(data.parsed.html);
        onClose();
      } else {
        formData.append('action', 'create');
        const res = await fetch('/api/documents/import', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Import failed');

        onClose();
        router.push(`/doc/${data.document.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Import Document File</h3>
              <p className="text-xs text-slate-500">Convert .docx, .md, or .txt to editable doc</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Selector (if inside editor) */}
          {currentDocumentId && onContentImported && (
            <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setImportMode('insert_current')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  importMode === 'insert_current'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Insert into Current Doc
              </button>
              <button
                type="button"
                onClick={() => setImportMode('new_doc')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                  importMode === 'new_doc'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create as New Doc
              </button>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.md,.markdown,.txt,.html,.htm"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-xs font-semibold text-slate-900 truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose another
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-800">
                  Click to browse or drag and drop
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports Microsoft Word (<code>.docx</code>), Markdown (<code>.md</code>), or Text (<code>.txt</code>)
                </p>
              </div>
            )}
          </div>

          {/* Supported Types Badges */}
          <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
              <FileText className="w-3 h-3" /> Word (.docx)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
              <FileCode className="w-3 h-3" /> Markdown (.md)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
              <FileText className="w-3 h-3" /> Text (.txt)
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Converting & Importing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>
                    {importMode === 'insert_current' ? 'Insert into Document' : 'Create & Open Document'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
