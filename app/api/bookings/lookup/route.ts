import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const reference = typeof body.reference === 'string' ? body.reference.trim().toUpperCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (!reference && !phone) return NextResponse.json({ error: 'Enter a booking reference or phone number.' }, { status: 400 });
  const phoneSearch = !reference;
  const values = phoneSearch ? [phone] : [reference];
  const condition = phoneSearch ? 'passenger_phone = $1' : 'booking_reference = $1';
  const { rows } = await pool.query(
    `SELECT id, booking_reference, passenger_name, seat_numbers, total_amount, payment_status, booked_at, trip_id
     FROM bookings WHERE ${condition} ORDER BY booked_at DESC LIMIT 5`, values,
  );
  if (!rows.length) return NextResponse.json({ bookings: [] });
  return NextResponse.json({ bookings: rows });
}
