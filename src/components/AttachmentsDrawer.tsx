'use client';

import React, { useState, useRef } from 'react';
import { Document, DocumentAttachment } from '@/types';
import { useUser } from '@/context/UserContext';
import {
  X,
  Paperclip,
  Download,
  Trash2,
  UploadCloud,
  File,
  Image,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AttachmentsDrawerProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUpdated: (doc: Document) => void;
}

export function AttachmentsDrawer({
  document,
  isOpen,
  onClose,
  onDocumentUpdated,
}: AttachmentsDrawerProps) {
  const { currentUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const canEdit =
    document.currentUserPermission === 'owner' ||
    document.currentUserPermission === 'edit';

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4 text-emerald-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-rose-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('csv'))
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    return <File className="w-4 h-4 text-indigo-500" />;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds maximum size of 10MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', currentUser.id);

      const res = await fetch(`/api/documents/${document.id}/attachments`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload attachment');

      // Refresh document details
      const docRes = await fetch(`/api/documents/${document.id}?userId=${currentUser.id}`);
      const docData = await docRes.json();
      if (docData.document) {
        onDocumentUpdated(docData.document);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    setError(null);
    try {
      const res = await fetch(
        `/api/documents/${document.id}/attachments?attachmentId=${attachmentId}&userId=${currentUser.id}`,
        { method: 'DELETE' }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete attachment');

      const docRes = await fetch(`/api/documents/${document.id}?userId=${currentUser.id}`);
      const docData = await docRes.json();
      if (docData.document) {
        onDocumentUpdated(docData.document);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deletion failed');
    }
  };

  const handleDownload = (att: DocumentAttachment) => {
    const link = window.document.createElement('a');
    link.href = att.data_url;
    link.download = att.filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-end z-50 animate-in fade-in duration-200">
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Paperclip className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Document Attachments</h3>
              <p className="text-xs text-slate-500">
                {document.attachments?.length || 0} associated files
              </p>
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
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Button */}
          {canEdit && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 p-4 rounded-xl flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading attachment...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-indigo-500 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-indigo-900">
                      Upload New Attachment
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      PDF, PNG, JPG, CSV, ZIP up to 10MB
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* List of Attachments */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Attached Files
            </h4>

            {document.attachments && document.attachments.length > 0 ? (
              <div className="space-y-2.5">
                {document.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-xs flex items-center justify-between gap-3 group transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        {getFileIcon(att.file_type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {att.filename}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatFileSize(att.file_size)} • {new Date(att.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDownload(att)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete attachment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <Paperclip className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">No attachments yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Attach reference specs, design assets, or spreadsheets to this document.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
