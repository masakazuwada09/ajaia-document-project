'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Document } from '@/types';
import { Download, FileText, FileCode, Printer, ChevronDown } from 'lucide-react';

interface ExportMenuProps {
  document: Document;
}

export function ExportMenu({ document }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    window.document.addEventListener('mousedown', handleClickOutside);
    return () => window.document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = filename;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleExportMarkdown = () => {
    // Basic HTML to Markdown converter
    const safeTitle = document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    let md = `# ${document.title}\n\n`;

    const tempDiv = window.document.createElement('div');
    tempDiv.innerHTML = document.content_html;

    const convertNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const children = Array.from(el.childNodes).map(convertNode).join('');

      switch (tag) {
        case 'h1':
          return `\n# ${children}\n\n`;
        case 'h2':
          return `\n## ${children}\n\n`;
        case 'h3':
          return `\n### ${children}\n\n`;
        case 'strong':
        case 'b':
          return `**${children}**`;
        case 'em':
        case 'i':
          return `*${children}*`;
        case 'u':
          return `<u>${children}</u>`;
        case 'p':
          return `${children}\n\n`;
        case 'ul':
          return `\n${children}\n`;
        case 'ol':
          return `\n${children}\n`;
        case 'li':
          return `- ${children}\n`;
        case 'blockquote':
          return `> ${children}\n\n`;
        case 'code':
          return `\`${children}\``;
        case 'pre':
          return `\n\`\`\`\n${children}\n\`\`\`\n\n`;
        default:
          return children;
      }
    };

    md += Array.from(tempDiv.childNodes).map(convertNode).join('');
    downloadFile(`${safeTitle}.md`, md, 'text/markdown');
  };

  const handleExportHtml = () => {
    const safeTitle = document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeXml(document.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; line-height: 1.6; }
    h1 { font-size: 2.2rem; }
    blockquote { border-left: 4px solid #6366f1; margin: 0; padding-left: 1rem; color: #64748b; font-style: italic; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
  </style>
</head>
<body>
  <h1>${escapeXml(document.title)}</h1>
  ${document.content_html}
</body>
</html>`;
    downloadFile(`${safeTitle}.html`, html, 'text/html');
  };

  const handleExportTxt = () => {
    const safeTitle = document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const tempDiv = window.document.createElement('div');
    tempDiv.innerHTML = document.content_html;
    const txt = `${document.title}\n\n${tempDiv.innerText || tempDiv.textContent || ''}`;
    downloadFile(`${safeTitle}.txt`, txt, 'text/plain');
  };

  const handlePrint = () => {
    setIsOpen(false);
    window.print();
  };

  function escapeXml(unsafe: string) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case "'":
          return '&apos;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
        <span>Export</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            onClick={handleExportMarkdown}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-purple-600" />
            <span>Markdown (.md)</span>
          </button>
          <button
            onClick={handleExportHtml}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            <span>HTML Document (.html)</span>
          </button>
          <button
            onClick={handleExportTxt}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Plain Text (.txt)</span>
          </button>
          <div className="border-t border-slate-100 my-1" />
          <button
            onClick={handlePrint}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span>Print or PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}
