import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'DATABASE_URL is not configured.' }, { status: 503 });
  const body = await request.json();
  const tripId = typeof body.tripId === 'string' ? body.tripId : '';
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  const seatNumbers = Array.isArray(body.seatNumbers) ? body.seatNumbers : [];
  const passengerName = typeof body.passengerName === 'string' ? body.passengerName.trim() : '';
  const passengerPhone = typeof body.passengerPhone === 'string' ? body.passengerPhone.trim() : '';
  const passengerEmail = typeof body.passengerEmail === 'string' ? body.passengerEmail.trim() : null;
  const passengerNrc = typeof body.passengerNrc === 'string' ? body.passengerNrc.trim() : null;
  const isForeigner = body.isForeigner === true;
  const notes = typeof body.notes === 'string' ? body.notes.trim() : null;
  if (!/^[0-9a-f-]{36}$/i.test(tripId) || sessionId.length < 12 || sessionId.length > 100 ||
      seatNumbers.length < 1 || seatNumbers.length > 8 || seatNumbers.some((seat: unknown) => typeof seat !== 'string' || seat.length > 12) ||
      !passengerName || passengerName.length > 120 || !/^[0-9]{7,15}$/.test(passengerPhone.replace(/[\s-]/g, '')) ||
      (passengerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passengerEmail)) || (passengerNrc && passengerNrc.length > 100) ||
      (notes && notes.length > 1000) || (!isForeigner && !passengerNrc)) {
    return NextResponse.json({ error: 'Booking details are incomplete or invalid.' }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      'SELECT create_guest_booking($1, $2, $3::text[], $4, $5, $6, $7, $8, $9) AS booking',
      [tripId, sessionId, seatNumbers, passengerName, passengerPhone, passengerEmail, passengerNrc, isForeigner, notes],
    );
    return NextResponse.json({ booking: rows[0].booking }, { status: 201 });
  } catch (error: any) {
    const message = error.code === 'P0001' ? error.message : error.code === '22023' ? error.message : 'Unable to create booking.';
    const status = error.code === 'P0001' ? 409 : error.code === '22023' ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
