'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { SearchForm } from '@/components/search-form';
import { supabase } from '@/lib/supabase';
import { Trip, Operator, Bus as BusType, City, Route } from '@/lib/types';
import { useLanguage } from '@/hooks/use-language';
import { format } from 'date-fns';
import { Clock, MapPin, Users, Wifi, Wind, Zap, Filter, ChevronDown, Bus, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface TripResult {
  trip: Trip;
  operator: Operator;
  bus: BusType;
  fromCity: City;
  toCity: City;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || 'Yangon';
  const to = searchParams.get('to') || 'Mandalay';
  const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const seats = parseInt(searchParams.get('seats') || '1');
  const isForeigner = searchParams.get('foreigner') === 'true';
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<TripResult[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<TripResult[]>([]);
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [operatorFilter, setOperatorFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchTrips() {
      setLoading(true);
      try {
        // Get cities first
        const { data: cities } = await supabase
          .from('cities')
          .select('*');

        const fromCity = cities?.find(c => c.name === from);
        const toCity = cities?.find(c => c.name === to);

        if (!fromCity || !toCity) {
          setLoading(false);
          return;
        }

        // Get route
        const { data: routes } = await supabase
          .from('routes')
          .select('*')
          .eq('from_city_id', fromCity.id)
          .eq('to_city_id', toCity.id);

        if (!routes || routes.length === 0) {
          setLoading(false);
          return;
        }

        const routeIds = routes.map(r => r.id);

        // Get trips for the selected date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: tripsData } = await supabase
          .from('trips')
          .select('*')
          .in('route_id', routeIds)
          .gte('departure_time', startOfDay.toISOString())
          .lte('departure_time', endOfDay.toISOString())
          .eq('status', 'scheduled');

        if (!tripsData || tripsData.length === 0) {
          setLoading(false);
          return;
        }

        // Get operators and buses
        const operatorIds = Array.from(new Set(tripsData.map(t => t.operator_id)));
        const busIds = Array.from(new Set(tripsData.map(t => t.bus_id)));

        const { data: operators } = await supabase
          .from('operators')
          .select('*')
          .in('id', operatorIds);

        const { data: buses } = await supabase
          .from('buses')
          .select('*')
          .in('id', busIds);

        const results: TripResult[] = tripsData.map(trip => ({
          trip,
          operator: operators?.find(o => o.id === trip.operator_id)!,
          bus: buses?.find(b => b.id === trip.bus_id)!,
          fromCity,
          toCity,
        })).filter(r => r.operator && r.bus);

        setTrips(results);
        setFilteredTrips(results);
      } catch (error) {
        console.error('Error fetching trips:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrips();
  }, [from, to, date]);

  // Apply filters
  useEffect(() => {
    let filtered = [...trips];

    // Time filter
    if (timeFilter !== 'all') {
      filtered = filtered.filter(({ trip }) => {
        const hour = new Date(trip.departure_time).getHours();
        switch (timeFilter) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 18;
          case 'evening':
            return hour >= 18 || hour < 6;
          default:
            return true;
        }
      });
    }

    // Operator filter
    if (operatorFilter !== 'all') {
      filtered = filtered.filter(({ operator }) => operator?.id === operatorFilter);
    }

    setFilteredTrips(filtered);
  }, [timeFilter, operatorFilter, trips]);

  const uniqueOperators = Array.from(new Map(trips.map(t => [t.operator?.id, t.operator])).values());

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'hh:mm a');
  };

  const calculateDuration = (departure: string, arrival: string) => {
    const diff = new Date(arrival).getTime() - new Date(departure).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getPrice = (trip: Trip) => {
    return isForeigner && trip.foreigner_price ? trip.foreigner_price : trip.base_price;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Search Summary */}
      <div className="bg-slate-900/60 border-b border-slate-700/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                {from}
                <ArrowRight className="h-4 w-4 text-slate-500" />
                <MapPin className="h-5 w-5 text-teal-500" />
                {to}
              </h1>
              <p className="text-slate-400 mt-1">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')} • {seats} seat{seats > 1 ? 's' : ''} •
                {isForeigner ? ' Foreign' : ' Local'} Traveller
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-orange-500">{filteredTrips.length}</span>
              <p className="text-slate-400 text-sm">trips found</p>
            </div>
          </div>

          {/* Compact Search Form */}
          <SearchForm
            initialFrom={from}
            initialTo={to}
            initialDate={date}
            initialSeats={seats}
            initialForeigner={isForeigner}
            compact
          />
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <div className="lg:w-64 shrink-0">
              <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full flex items-center justify-between text-white font-medium mb-4 lg:pointer-events-none"
                >
                  <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform lg:hidden ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                  {/* Time Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Departure Time
                    </h4>
                    <div className="space-y-2">
                      {[
                        { value: 'all', label: 'Any Time', sublabel: '24 Hours' },
                        { value: 'morning', label: 'Morning', sublabel: 'Until 12 PM' },
                        { value: 'afternoon', label: 'Afternoon', sublabel: '12 PM - 6 PM' },
                        { value: 'evening', label: 'Evening/Night', sublabel: 'After 6 PM' },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                            timeFilter === option.value
                              ? 'bg-orange-500/10 border border-orange-500/30'
                              : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="timeFilter"
                            value={option.value}
                            checked={timeFilter === option.value}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            timeFilter === option.value
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-slate-500'
                          }`}>
                            {timeFilter === option.value && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full m-auto" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm text-white">{option.label}</span>
                            <p className="text-xs text-slate-400">{option.sublabel}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Operator Filter */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <Bus className="h-4 w-4" />
                      Bus Operator
                    </h4>
                    <select
                      value={operatorFilter}
                      onChange={(e) => setOperatorFilter(e.target.value)}
                      className="w-full input-dark rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="all">All Operators</option>
                      {uniqueOperators.map((op) => (
                        <option key={op?.id} value={op?.id}>
                          {op?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Results */}
            <div className="flex-1">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-900/60 rounded-xl border border-slate-700/50 p-5 animate-pulse">
                      <div className="h-4 bg-slate-700 rounded w-1/4 mb-4" />
                      <div className="h-6 bg-slate-700 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-slate-700 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : filteredTrips.length === 0 ? (
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-12 text-center">
                  <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No trips found</h3>
                  <p className="text-slate-400 mb-6">
                    No trips match your filters. Try adjusting your search criteria.
                  </p>
                  <button
                    onClick={() => {
                      setTimeFilter('all');
                      setOperatorFilter('all');
                    }}
                    className="btn-primary px-6 py-2 rounded-lg text-sm"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTrips.map(({ trip, operator, bus, fromCity, toCity }) => (
                    <Link
                      key={trip.id}
                      href={`/trip/${trip.id}?seats=${seats}&foreigner=${isForeigner}`}
                      className="trip-card block"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Operator Info */}
                        <div className="flex items-start gap-4 md:w-1/3">
                          {operator?.logo_url ? (
                            <img
                              src={operator.logo_url}
                              alt={operator.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-teal-500 flex items-center justify-center">
                              <Bus className="h-6 w-6 text-white" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-white">{operator?.name}</h3>
                            <p className="text-sm text-slate-400">{bus?.bus_type}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-xs">
                                <CheckCircle2 className="h-3 w-3" />
                                Instant
                              </span>
                              {trip.available_seats < 10 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 text-xs">
                                  {trip.available_seats} left
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Departure/Arrival */}
                        <div className="flex-1 flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                              {formatTime(trip.departure_time)}
                            </div>
                            <div className="text-xs text-slate-400">{fromCity.name}</div>
                          </div>

                          <div className="flex-1 flex items-center gap-2">
                            <div className="h-px flex-1 bg-gradient-to-r from-orange-500/50 to-teal-500/50" />
                            <div className="text-xs text-slate-400 whitespace-nowrap">
                              {calculateDuration(trip.departure_time, trip.arrival_time || '')}
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-teal-500/50 to-orange-500/50" />
                          </div>

                          <div className="text-center">
                            <div className="text-2xl font-bold text-white">
                              {formatTime(trip.arrival_time || '')}
                            </div>
                            <div className="text-xs text-slate-400">{toCity.name}</div>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-sm text-slate-400">MMK</div>
                          <div className="text-3xl font-bold text-orange-500">
                            {formatPrice(getPrice(trip))}
                          </div>
                          <div className="text-xs text-slate-400">per seat</div>
                        </div>
                      </div>

                      {/* Amenities */}
                      {bus?.amenities && bus.amenities.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                          <div className="flex flex-wrap gap-2">
                            {bus.amenities.map((amenity, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800/50 text-xs text-slate-300"
                              >
                                {amenity === 'AC' && <Wind className="h-3 w-3" />}
                                {amenity === 'WiFi' && <Wifi className="h-3 w-3" />}
                                {amenity === 'USB Charging' && <Zap className="h-3 w-3" />}
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Important Notes */}
                      {trip.notes && (
                        <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <p className="text-xs text-amber-200">{trip.notes}</p>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
