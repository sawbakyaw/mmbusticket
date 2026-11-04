export interface LiveTripSearch {
  fromCity: string;
  toCity: string;
  date: string;
  seats: number;
  refresh: boolean;
}

export function getLiveTripsUrl(search: LiveTripSearch) {
  const baseUrl = process.env.MMBUS_API_BASE_URL?.trim();
  if (!baseUrl) throw new Error('MMBUS_API_BASE_URL is not configured.');

  let url: URL;
  try {
    url = new URL(`${baseUrl.replace(/\/+$/, '')}/api/trips`);
  } catch {
    throw new Error('MMBUS_API_BASE_URL must be a valid URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('MMBUS_API_BASE_URL must use HTTP or HTTPS.');
  }

  url.searchParams.set('from_city', search.fromCity);
  url.searchParams.set('to_city', search.toCity);
  url.searchParams.set('date', search.date);
  url.searchParams.set('seats', String(search.seats));
  if (search.refresh) url.searchParams.set('refresh', 'true');
  return url;
}

export async function requestLiveTrips(search: LiveTripSearch, signal: AbortSignal) {
  return fetch(getLiveTripsUrl(search), { cache: 'no-store', signal });
}
