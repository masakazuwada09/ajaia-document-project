import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/db';

export async function GET() {
  try {
    const users = getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Failed to get users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
