import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const { name } = await request.json();
  if (name !== 'clean_expired_locks') return NextResponse.json({ error: 'Unknown database function.' }, { status: 404 });
  await pool.query('SELECT clean_expired_locks()');
  return NextResponse.json({ data: null });
}
