import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'DATABASE_URL is not configured.' }, { status: 503 });
  const body = await request.json();
  if (typeof body.seatId !== 'string' || typeof body.sessionId !== 'string') return NextResponse.json({ error: 'Invalid seat unlock request.' }, { status: 400 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('DELETE FROM seat_locks WHERE seat_id = $1 AND session_id = $2 RETURNING seat_id', [body.seatId, body.sessionId]);
    if (rows[0]) await client.query("UPDATE seats SET status = 'available' WHERE id = $1 AND status = 'locked'", [body.seatId]);
    await client.query('COMMIT');
    return NextResponse.json({ ok: true });
  } catch {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'Unable to unlock seat.' }, { status: 500 });
  } finally {
    client.release();
  }
}
