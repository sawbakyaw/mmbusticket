import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: { reference: string } }) {
  const { rows } = await pool.query(
    `SELECT id, booking_reference, trip_id, passenger_name, passenger_phone, passenger_email, seat_numbers,
            total_amount, payment_method, payment_status, is_foreigner, notes, booked_at, created_at
     FROM bookings WHERE booking_reference = $1 LIMIT 1`, [params.reference.toUpperCase()],
  );
  if (!rows[0]) return NextResponse.json({ booking: null, trip: null });
  const { rows: trips } = await pool.query(
    `SELECT t.*, to_jsonb(o) AS operators, to_jsonb(b) AS buses,
            jsonb_build_object('id', r.id, 'from_city_id', r.from_city_id, 'to_city_id', r.to_city_id,
              'from_city', to_jsonb(fc), 'to_city', to_jsonb(tc)) AS routes
     FROM trips t JOIN operators o ON o.id = t.operator_id JOIN buses b ON b.id = t.bus_id
     JOIN routes r ON r.id = t.route_id JOIN cities fc ON fc.id = r.from_city_id JOIN cities tc ON tc.id = r.to_city_id
     WHERE t.id = $1 LIMIT 1`, [rows[0].trip_id],
  );
  return NextResponse.json({ booking: rows[0], trip: trips[0] ?? null });
}
