'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format, isValid, parseISO } from 'date-fns';
import { AlertCircle, ArrowRight, Bus, Clock3, RefreshCw } from 'lucide-react';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { SearchForm } from '@/components/search-form';

interface LiveTripResponse {
  retrievedAt: string;
  freshness: string;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || 'Yangon';
  const to = searchParams.get('to') || 'Mandalay';
  const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const requestedSeats = Number(searchParams.get('seats') || '1');
  const seats = Number.isInteger(requestedSeats) && requestedSeats >= 1 && requestedSeats <= 10 ? requestedSeats : 1;
  const isForeigner = searchParams.get('foreigner') === 'true';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [response, setResponse] = useState<LiveTripResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const lastRefreshKey = useRef(0);
  const validDate = parseISO(date);
  const displayDate = isValid(validDate) ? format(validDate, 'EEEE, MMMM d, yyyy') : date;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const manualRefresh = refreshKey > lastRefreshKey.current;
    lastRefreshKey.current = refreshKey;
    const params = new URLSearchParams({
      from_city: from,
      to_city: to,
      date,
      seats: String(seats),
    });
    if (manualRefresh) params.set('refresh', 'true');

    setLoading(true);
    setError('');
    fetch(`/api/live-trips?${params.toString()}`, { signal: controller.signal })
      .then(async result => {
        const body = await result.json();
        if (!result.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Unable to search live trips.');
        return body as LiveTripResponse;
      })
      .then(result => {
        if (active) setResponse(result);
      })
      .catch(reason => {
        if (active && reason.name !== 'AbortError') {
          setError(reason instanceof Error ? reason.message : 'Unable to search live trips.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [from, to, date, seats, refreshKey]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="bg-slate-900/60 border-b border-slate-700/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bus className="h-5 w-5 text-orange-500" />
                {from}<ArrowRight className="h-4 w-4 text-slate-500" />{to}
              </h1>
              <p className="text-slate-400 mt-1">{displayDate} · {seats} seat{seats === 1 ? '' : 's'} · {isForeigner ? 'Foreign' : 'Local'} traveller</p>
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey(value => value + 1)}
              disabled={loading}
              className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh from source
            </button>
          </div>
          <SearchForm initialFrom={from} initialTo={to} initialDate={date} initialSeats={seats} initialForeigner={isForeigner} compact />
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <section className="max-w-4xl mx-auto bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 sm:p-8" aria-live="polite">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-8 text-slate-300">
                <RefreshCw className="h-5 w-5 animate-spin text-teal-400" />
                Searching the MM-Bus trip source…
              </div>
            ) : error ? (
              <div className="text-center py-5">
                <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-white mb-2">Live results are unavailable</h2>
                <p className="text-slate-300">{error}</p>
                <button type="button" onClick={() => setRefreshKey(value => value + 1)} className="btn-primary mt-5 px-5 py-2.5 rounded-lg">
                  Retry search
                </button>
              </div>
            ) : (
              <div className="text-center py-5">
                <Clock3 className="h-9 w-9 text-teal-400 mx-auto mb-3" />
                <h2 className="text-xl font-semibold text-white mb-2">Provider response received</h2>
                <p className="text-slate-300">The live API does not currently document its trip response fields. Trip records are withheld until the response can be mapped without guessing.</p>
              </div>
            )}
            <div className="mt-5 border-t border-slate-700/50 pt-4 text-center text-sm text-slate-400">
              {response ? (
                <>
                  <p>Last checked {format(new Date(response.retrievedAt), 'MMM d, yyyy · h:mm a')}</p>
                  <p className="mt-1">Source freshness: not reported by the API. Cached status is unknown.</p>
                </>
              ) : (
                <p>Results are requested from the source when you search; cached status is not available until the API responds.</p>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>}>
      <SearchResults />
    </Suspense>
  );
}
