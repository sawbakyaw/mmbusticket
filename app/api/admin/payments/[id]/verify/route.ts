import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-server';
import { isDatabaseConfigured, pool } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'DATABASE_URL is not configured.' }, { status: 503 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!['admin', 'super_admin'].includes(user.role)) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });

  if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: 'Invalid payment ID.' }, { status: 400 });
  const body = await request.json();
  const status = body.status;
  if (!['verified', 'rejected'].includes(status)) return NextResponse.json({ error: 'Choose verified or rejected.' }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT p.id, p.booking_id FROM payments p
       JOIN bookings b ON b.id = p.booking_id
       WHERE p.id = $1 AND p.payment_status = 'pending' AND b.status <> 'cancelled'
         AND p.id = (SELECT latest.id FROM payments latest WHERE latest.booking_id = p.booking_id ORDER BY latest.created_at DESC, latest.id DESC LIMIT 1)
       FOR UPDATE OF p, b`, [params.id],
    );
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Pending payment not found.' }, { status: 404 });
    }
    await client.query(
      'UPDATE payments SET payment_status = $1, verified_at = now(), verified_by = $2 WHERE id = $3',
      [status, user.id, params.id],
    );
    await client.query(
      `UPDATE bookings SET payment_status = $1, status = CASE WHEN $1 = 'paid' THEN 'confirmed' ELSE status END
       WHERE id = $2`, [status === 'verified' ? 'paid' : 'failed', rows[0].booking_id],
    );
    await client.query('COMMIT');
    return NextResponse.json({ ok: true, paymentStatus: status });
  } catch {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'Unable to verify payment.' }, { status: 500 });
  } finally {
    client.release();
  }
}
