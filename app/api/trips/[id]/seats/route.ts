import { NextResponse } from 'next/server';
import { isDatabaseConfigured, pool } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'DATABASE_URL is not configured.' }, { status: 503 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: expiredLocks } = await client.query(
      'DELETE FROM seat_locks WHERE trip_id = $1 AND expires_at <= now() RETURNING seat_id', [params.id],
    );
    if (expiredLocks.length) {
      await client.query("UPDATE seats SET status = 'available' WHERE id = ANY($1::uuid[]) AND status = 'locked'", [expiredLocks.map(row => row.seat_id)]);
    }
    const [seats, locks] = await Promise.all([
      client.query('SELECT * FROM seats WHERE trip_id = $1 ORDER BY row_number, column_number', [params.id]),
      client.query('SELECT id, seat_id, trip_id, locked_at, expires_at, created_at FROM seat_locks WHERE trip_id = $1 AND expires_at > now()', [params.id]),
    ]);
    await client.query('COMMIT');
    return NextResponse.json({ seats: seats.rows, locks: locks.rows });
  } catch {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'Unable to load seat availability.' }, { status: 500 });
  } finally {
    client.release();
  }
}
