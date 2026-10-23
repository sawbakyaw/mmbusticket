import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'DATABASE_URL is not configured.' }, { status: 503 });
  const body = await request.json();
  const reference = typeof body.reference === 'string' ? body.reference.trim().toUpperCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.replace(/[\s-]/g, '') : '';
  if (!/^MMB-[A-F0-9]{32}$/.test(reference) || !/^[0-9]{7,15}$/.test(phone)) {
    return NextResponse.json({ error: 'Enter a valid booking reference and phone number.' }, { status: 400 });
  }
  const { rows } = await pool.query(
    `SELECT b.id, b.booking_reference, b.passenger_name, b.seat_numbers, b.total_amount,
            b.payment_status, b.booked_at, b.trip_id
     FROM bookings b
     WHERE b.booking_reference = $1 AND (
       b.passenger_phone = $2 OR EXISTS (
         SELECT 1 FROM passengers p WHERE p.booking_id = b.id AND p.phone_number = $2
       )
     ) LIMIT 1`, [reference, phone],
  );
  return NextResponse.json({ bookings: rows });
}
