import { NextRequest, NextResponse } from 'next/server';
import { requestLiveTrips } from '@/lib/mmbus-api';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const NO_STORE = { 'Cache-Control': 'no-store' };

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const fromCity = params.get('from_city')?.trim() ?? '';
  const toCity = params.get('to_city')?.trim() ?? '';
  const date = params.get('date') ?? '';
  const seatsText = params.get('seats') ?? '1';
  const seats = Number(seatsText);
  const refreshValue = params.get('refresh') ?? 'false';
  const parsedDate = DATE.test(date) ? new Date(`${date}T00:00:00.000Z`) : null;

  if (fromCity.length < 2 || fromCity.length > 80 || toCity.length < 2 || toCity.length > 80) {
    return errorResponse('Choose valid origin and destination cities.', 400);
  }
  if (fromCity.toLocaleLowerCase() === toCity.toLocaleLowerCase()) {
    return errorResponse('Origin and destination must be different.', 400);
  }
  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    return errorResponse('Choose a valid departure date.', 400);
  }
  if (!Number.isInteger(seats) || seats < 1 || seats > 10) {
    return errorResponse('Passenger count must be between 1 and 10.', 400);
  }
  if (refreshValue !== 'true' && refreshValue !== 'false') {
    return errorResponse('Invalid refresh option.', 400);
  }

  try {
    const response = await requestLiveTrips({ fromCity, toCity, date, seats, refresh: refreshValue === 'true' }, AbortSignal.timeout(12000));
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return errorResponse('The live trip provider returned an invalid response.', 502);
    }

    if (!response.ok) {
      const detail = data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string' ? data.detail : '';
      const message = response.status < 500 && detail ? detail : 'The live trip provider is temporarily unavailable.';
      return errorResponse(message, response.status >= 500 ? 502 : response.status);
    }

    return NextResponse.json({ data, retrievedAt: new Date().toISOString(), freshness: 'unspecified' }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof Error && error.message.includes('MMBUS_API_BASE_URL')) {
      return errorResponse('The live trip provider is not configured.', 503);
    }
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    return errorResponse(timedOut ? 'The live trip search timed out. Please retry.' : 'Unable to reach the live trip provider.', 502);
  }
}
