import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, pool } from '@/lib/db';

const paymentMethods = new Set(['kbzpay', 'wave', 'cbpay', 'mpu', 'visa', 'master']);

export async function POST(request: NextRequest, { params }: { params: { reference: string } }) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'DATABASE_URL is not configured.' }, { status: 503 });
  const body = await request.json();
  const method = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : '';
  const transactionRef = typeof body.transactionRef === 'string' ? body.transactionRef.trim() : '';
  if (!paymentMethods.has(method) || transactionRef.length < 3 || transactionRef.length > 120) {
    return NextResponse.json({ error: 'Enter a valid payment method and transaction reference.' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: bookings } = await client.query(
      `SELECT id FROM bookings WHERE booking_reference = $1 AND payment_status IN ('pending', 'failed') AND status <> 'cancelled' FOR UPDATE`,
      [params.reference.toUpperCase()],
    );
    if (!bookings[0]) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Pending booking not found.' }, { status: 404 });
    }
    const bookingId = bookings[0].id;
    await client.query('UPDATE bookings SET payment_method = $1, payment_status = \'pending\' WHERE id = $2', [method, bookingId]);

    const { rows: pendingPayments } = await client.query(
      `SELECT id, transaction_ref FROM payments WHERE booking_id = $1 AND payment_status = 'pending'
       ORDER BY created_at DESC, id DESC LIMIT 1 FOR UPDATE`, [bookingId],
    );
    if (pendingPayments[0]?.transaction_ref) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'A payment submission is already awaiting verification.' }, { status: 409 });
    }
    if (pendingPayments[0]) {
      await client.query('UPDATE payments SET payment_method = $1, transaction_ref = $2 WHERE id = $3', [method, transactionRef, pendingPayments[0].id]);
    } else {
      await client.query('INSERT INTO payments (booking_id, payment_method, transaction_ref) VALUES ($1, $2, $3)', [bookingId, method, transactionRef]);
    }

    await client.query('COMMIT');
    return NextResponse.json({ ok: true, paymentStatus: 'pending', message: 'Payment submitted and awaiting verification.' });
  } catch {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'Unable to submit payment for verification.' }, { status: 500 });
  } finally {
    client.release();
  }
}
