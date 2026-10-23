import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { reference: string } }) {
  const body = await request.json();
  const method = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : '';
  if (!method || method.length > 60) return NextResponse.json({ error: 'Choose a valid payment method.' }, { status: 400 });
  const { rows } = await pool.query(
    `UPDATE bookings SET payment_method = $1 WHERE booking_reference = $2 AND payment_status = 'pending'
     RETURNING id, booking_reference, payment_status`, [method, params.reference.toUpperCase()],
  );
  if (!rows[0]) return NextResponse.json({ error: 'Pending booking not found.' }, { status: 404 });
  return NextResponse.json({ booking: rows[0], message: 'Payment remains pending until it is verified by the payment provider.' });
}
