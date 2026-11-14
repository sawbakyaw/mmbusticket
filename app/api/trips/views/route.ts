import { createHash, randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, pool } from '@/lib/db';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VIEWER_COOKIE = 'trip_viewer';

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'DATABASE_URL is not configured.' }, { status: 503 });

  const routeIds = (request.nextUrl.searchParams.get('routeIds') || '').split(',').filter(Boolean);
  if (!routeIds.length || routeIds.length > 100 || routeIds.some(id => !UUID.test(id))) {
    return NextResponse.json({ error: 'Provide valid route IDs.' }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT trips.route_id, count(trip_views.trip_id)::int AS views
       FROM trips
       LEFT JOIN trip_views ON trip_views.trip_id = trips.id
       WHERE trips.route_id = ANY($1::uuid[])
       GROUP BY trips.route_id`,
      [routeIds],
    );
    return NextResponse.json({ counts: Object.fromEntries(rows.map(row => [row.route_id, row.views])) });
  } catch {
    return NextResponse.json({ error: 'Unable to load trip views.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: 'DATABASE_URL is not configured.' }, { status: 503 });

  let body: { tripId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  if (typeof body.tripId !== 'string' || !UUID.test(body.tripId)) {
    return NextResponse.json({ error: 'Provide a valid trip ID.' }, { status: 400 });
  }

  const existingViewerId = request.cookies.get(VIEWER_COOKIE)?.value;
  const viewerId = existingViewerId && UUID.test(existingViewerId) ? existingViewerId : randomUUID();
  const viewerHash = createHash('sha256').update(`${viewerId}:${body.tripId}`).digest('hex');

  try {
    const { rows } = await pool.query(
      `INSERT INTO trip_views (trip_id, visitor_hash)
       SELECT id, $2 FROM trips WHERE id = $1
       ON CONFLICT (trip_id, visitor_hash) DO NOTHING
       RETURNING trip_id`,
      [body.tripId, viewerHash],
    );
    if (!rows.length) {
      const { rowCount } = await pool.query('SELECT id FROM trips WHERE id = $1', [body.tripId]);
      if (!rowCount) return NextResponse.json({ error: 'Trip not found.' }, { status: 404 });
    }

    const response = NextResponse.json({ counted: rows.length > 0 });
    if (!existingViewerId || !UUID.test(existingViewerId)) {
      response.cookies.set(VIEWER_COOKIE, viewerId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return response;
  } catch {
    return NextResponse.json({ error: 'Unable to record trip view.' }, { status: 500 });
  }
}
