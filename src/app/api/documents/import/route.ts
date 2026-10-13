import { NextRequest, NextResponse } from 'next/server';
import { parseDocumentFile } from '@/lib/fileParser';
import { createDocument, getUserById } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = (formData.get('userId') as string) || 'alice';
    const action = (formData.get('action') as string) || 'create'; // 'create' | 'parse'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = file.name || 'imported-document.txt';

    const parsed = await parseDocumentFile(buffer, filename, file.type);

    if (action === 'parse') {
      // Just return parsed content for insertion into current editor
      return NextResponse.json({ parsed });
    }

    // Default: create a new document
    const newDoc = createDocument({
      title: parsed.title,
      content_html: parsed.html,
      content_json: '{}',
      owner_id: userId,
    });

    return NextResponse.json({ document: newDoc, parsed }, { status: 201 });
  } catch (error) {
    console.error('Failed to import file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import document' },
      { status: 500 }
    );
  }
}
