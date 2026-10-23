import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';

export async function GET() {
  try {
    return NextResponse.json({ user: await getCurrentUser() });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
