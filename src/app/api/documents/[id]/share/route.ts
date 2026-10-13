import { NextRequest, NextResponse } from 'next/server';
import { addOrUpdateShare, removeShare, getEffectivePermission } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { requestingUserId = 'alice', targetUserId, permission } = body;

    if (!targetUserId || !permission || (permission !== 'edit' && permission !== 'view')) {
      return NextResponse.json({ error: 'targetUserId and valid permission (edit/view) are required' }, { status: 400 });
    }

    const perm = getEffectivePermission(requestingUserId, id);
    if (perm !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Only the document owner can manage sharing permissions' },
        { status: 403 }
      );
    }

    const share = addOrUpdateShare(id, requestingUserId, targetUserId, permission);
    if (!share) {
      return NextResponse.json({ error: 'Failed to update share permission' }, { status: 400 });
    }

    return NextResponse.json({ share }, { status: 200 });
  } catch (error) {
    console.error('Failed to update share:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const requestingUserId = searchParams.get('requestingUserId') || 'alice';
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId query parameter is required' }, { status: 400 });
    }

    const perm = getEffectivePermission(requestingUserId, id);
    if (perm !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Only the document owner can revoke access' },
        { status: 403 }
      );
    }

    const removed = removeShare(id, requestingUserId, targetUserId);
    if (!removed) {
      return NextResponse.json({ error: 'Share record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Share access revoked successfully' });
  } catch (error) {
    console.error('Failed to revoke share:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
