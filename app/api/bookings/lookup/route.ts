import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const reference = typeof body.reference === 'string' ? body.reference.trim().toUpperCase() : '';
  if (!/^MMB-[A-F0-9]{32}$/.test(reference)) return NextResponse.json({ error: 'Enter a valid booking reference.' }, { status: 400 });
  const { rows } = await pool.query(
    `SELECT id, booking_reference, passenger_name, seat_numbers, total_amount, payment_status, booked_at, trip_id
     FROM bookings WHERE booking_reference = $1 LIMIT 1`, [reference],
  );
  if (!rows.length) return NextResponse.json({ bookings: [] });
  return NextResponse.json({ bookings: rows });
}
