import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const tripId = typeof body.tripId === 'string' ? body.tripId : '';
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  const seatNumbers = Array.isArray(body.seatNumbers) ? body.seatNumbers.filter((value: unknown) => typeof value === 'string').slice(0, 8) : [];
  const passengerName = typeof body.passengerName === 'string' ? body.passengerName.trim() : '';
  const passengerPhone = typeof body.passengerPhone === 'string' ? body.passengerPhone.trim() : '';
  const isForeigner = body.isForeigner === true;
  if (!tripId || !sessionId || !seatNumbers.length || !passengerName || !/^[0-9]{7,15}$/.test(passengerPhone.replace(/[\s-]/g, '')) || (!isForeigner && !String(body.passengerNrc || '').trim())) {
    return NextResponse.json({ error: 'Booking details are incomplete or invalid.' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT clean_expired_locks()');
    const { rows: tripRows } = await client.query('SELECT * FROM trips WHERE id = $1 AND status = \'scheduled\' FOR UPDATE', [tripId]);
    if (!tripRows[0]) throw new Error('Trip is not available.');
    const trip = tripRows[0];
    const { rows: lockedSeats } = await client.query(
      `SELECT s.id, s.seat_number FROM seats s JOIN seat_locks l ON l.seat_id = s.id
       WHERE s.trip_id = $1 AND s.seat_number = ANY($2::text[]) AND l.session_id = $3 AND l.expires_at > now()
       FOR UPDATE OF s, l`, [tripId, seatNumbers, sessionId],
    );
    if (lockedSeats.length !== seatNumbers.length) throw new Error('One or more selected seats are no longer reserved for you.');
    const seatPrice = isForeigner && trip.foreigner_price ? Number(trip.foreigner_price) : Number(trip.base_price);
    const totalAmount = seatPrice * seatNumbers.length;
    const { rows: bookingRows } = await client.query(
      `INSERT INTO bookings (trip_id, operator_id, passenger_name, passenger_phone, passenger_email, passenger_nrc, seat_numbers, total_amount, payment_method, payment_status, is_foreigner, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending','pending',$9,$10) RETURNING id, booking_reference, trip_id, passenger_name, passenger_phone, seat_numbers, total_amount, payment_method, payment_status, is_foreigner, booked_at, created_at`,
      [tripId, trip.operator_id, passengerName, passengerPhone, body.passengerEmail || null, isForeigner ? null : body.passengerNrc || null, seatNumbers, totalAmount, isForeigner, body.notes || null],
    );
    await client.query("UPDATE seats SET status = 'booked' WHERE trip_id = $1 AND seat_number = ANY($2::text[])", [tripId, seatNumbers]);
    await client.query('DELETE FROM seat_locks WHERE trip_id = $1 AND session_id = $2 AND seat_id = ANY($3::uuid[])', [tripId, sessionId, lockedSeats.map(row => row.id)]);
    await client.query('UPDATE trips SET available_seats = GREATEST(available_seats - $2, 0) WHERE id = $1', [tripId, seatNumbers.length]);
    await client.query('COMMIT');
    return NextResponse.json({ booking: bookingRows[0] }, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: error.message === 'Trip is not available.' || error.message.startsWith('One or more') ? error.message : 'Unable to create booking.' }, { status: error.message === 'Trip is not available.' || error.message.startsWith('One or more') ? 409 : 500 });
  } finally {
    client.release();
  }
}
