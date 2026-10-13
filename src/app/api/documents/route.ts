import { NextRequest, NextResponse } from 'next/server';
import { listDocuments, createDocument, getUserById } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'alice';
    const filter = (searchParams.get('filter') as 'all' | 'owned' | 'shared') || 'all';
    const search = searchParams.get('q') || '';

    const docs = listDocuments(userId, filter, search);
    return NextResponse.json({ documents: docs });
  } catch (error) {
    console.error('Failed to list documents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content_html, content_json, owner_id } = body;

    const actualOwnerId = owner_id || 'alice';
    const user = getUserById(actualOwnerId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    const doc = createDocument({
      title: title || 'Untitled document',
      content_html: content_html || '<p></p>',
      content_json: content_json || '{}',
      owner_id: actualOwnerId,
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error('Failed to create document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
