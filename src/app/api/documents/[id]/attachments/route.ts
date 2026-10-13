import { NextRequest, NextResponse } from 'next/server';
import { addAttachment, deleteAttachment, getEffectivePermission } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = (formData.get('userId') as string) || 'alice';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const perm = getEffectivePermission(userId, id);
    if (!perm || (perm !== 'owner' && perm !== 'edit')) {
      return NextResponse.json(
        { error: 'Forbidden: You must be an owner or editor to attach files' },
        { status: 403 }
      );
    }

    // Limit attachment size to 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/octet-stream';
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    const attachment = addAttachment({
      documentId: id,
      userId,
      filename: file.name,
      file_type: mimeType,
      file_size: file.size,
      data_url: dataUrl,
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Failed to save attachment' }, { status: 500 });
    }

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload attachment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, _context: RouteContext) {
  try {
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('attachmentId');
    const userId = searchParams.get('userId') || 'alice';

    if (!attachmentId) {
      return NextResponse.json({ error: 'attachmentId parameter is required' }, { status: 400 });
    }

    const success = deleteAttachment(attachmentId, userId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete attachment or access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'Attachment deleted' });
  } catch (error) {
    console.error('Failed to delete attachment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
