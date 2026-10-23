import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (typeof body.tripId !== 'string' || typeof body.seatId !== 'string' || typeof body.sessionId !== 'string' || body.sessionId.length > 100) {
    return NextResponse.json({ error: 'Invalid seat lock request.' }, { status: 400 });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT clean_expired_locks()');
    const { rows: seatRows } = await client.query("SELECT id FROM seats WHERE id = $1 AND trip_id = $2 AND status = 'available' FOR UPDATE", [body.seatId, body.tripId]);
    if (!seatRows[0]) throw new Error('Seat is no longer available.');
    const { rows } = await client.query(
      `INSERT INTO seat_locks (seat_id, trip_id, session_id, expires_at)
       VALUES ($1, $2, $3, now() + interval '10 minutes')
       ON CONFLICT (seat_id) DO UPDATE SET session_id = EXCLUDED.session_id, locked_at = now(), expires_at = EXCLUDED.expires_at
       WHERE seat_locks.session_id = EXCLUDED.session_id
       RETURNING *`, [body.seatId, body.tripId, body.sessionId],
    );
    if (!rows[0]) throw new Error('Seat is locked by another passenger.');
    await client.query("UPDATE seats SET status = 'locked' WHERE id = $1", [body.seatId]);
    await client.query('COMMIT');
    return NextResponse.json({ lock: rows[0] });
  } catch (error: any) {
    await client.query('ROLLBACK');
    const conflict = error.message.includes('Seat is no longer') || error.message.includes('Seat is locked');
    return NextResponse.json({ error: conflict ? error.message : 'Unable to lock seat.' }, { status: conflict ? 409 : 500 });
  } finally {
    client.release();
  }
}
