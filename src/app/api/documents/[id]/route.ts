import { NextRequest, NextResponse } from 'next/server';
import { getDocumentById, updateDocument, deleteDocument, getEffectivePermission } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'alice';

    const perm = getEffectivePermission(userId, id);
    if (!perm) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view this document' },
        { status: 403 }
      );
    }

    const doc = getDocumentById(id, userId);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error('Failed to get document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { userId = 'alice', title, content_html, content_json } = body;

    const perm = getEffectivePermission(userId, id);
    if (!perm || (perm !== 'owner' && perm !== 'edit')) {
      return NextResponse.json(
        { error: 'Forbidden: You have view-only access or lack edit permissions' },
        { status: 403 }
      );
    }

    const updated = updateDocument(id, userId, {
      title,
      content_html,
      content_json,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update document' }, { status: 400 });
    }

    return NextResponse.json({ document: updated });
  } catch (error) {
    console.error('Failed to update document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'alice';

    const perm = getEffectivePermission(userId, id);
    if (perm !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Only the document owner can delete this document' },
        { status: 403 }
      );
    }

    const success = deleteDocument(id, userId);
    if (!success) {
      return NextResponse.json({ error: 'Document not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Failed to delete document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
