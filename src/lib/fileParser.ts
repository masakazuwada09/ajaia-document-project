import mammoth from 'mammoth';
import { marked } from 'marked';

export interface ParsedDocumentFile {
  title: string;
  html: string;
  rawText: string;
}

export async function parseDocumentFile(
  buffer: Buffer,
  filename: string,
  _mimeType?: string
): Promise<ParsedDocumentFile> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const baseName = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const formattedTitle = baseName.charAt(0).toUpperCase() + baseName.slice(1);

  if (ext === 'docx') {
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value || '<p>Empty Word document</p>';
    const textResult = await mammoth.extractRawText({ buffer });
    return {
      title: formattedTitle || 'Imported Word Document',
      html,
      rawText: textResult.value || '',
    };
  }

  const rawText = buffer.toString('utf-8');

  if (ext === 'md' || ext === 'markdown') {
    // Check if first line is a title (# Title)
    let title = formattedTitle;
    const firstLineMatch = rawText.match(/^#\s+(.+)$/m);
    if (firstLineMatch) {
      title = firstLineMatch[1].trim();
    }

    const html = await marked.parse(rawText);
    return {
      title: title || 'Imported Markdown Document',
      html: String(html),
      rawText,
    };
  }

  if (ext === 'html' || ext === 'htm') {
    return {
      title: formattedTitle || 'Imported HTML Document',
      html: rawText,
      rawText: rawText.replace(/<[^>]+>/g, ' '),
    };
  }

  // Fallback: Plain text (.txt or other text formats)
  const paragraphs = rawText
    .split(/\r?\n\r?\n/)
    .filter((p) => p.trim().length > 0)
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\r?\n/g, '<br/>')}</p>`)
    .join('');

  return {
    title: formattedTitle || 'Imported Text Document',
    html: paragraphs || '<p></p>',
    rawText,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
