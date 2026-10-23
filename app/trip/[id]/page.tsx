'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { database } from '@/lib/db-client';
import { Trip, Seat, Operator, Bus as BusType, City, Route, SeatLock } from '@/lib/types';
import { format } from 'date-fns';
import {
  Bus, MapPin, Clock, ArrowLeft, CheckCircle2, AlertCircle,
  Wifi, Wind, Zap, Users, Armchair, Lock, Timer
} from 'lucide-react';

interface SeatWithLock extends Seat {
  lock?: SeatLock;
}

interface TripDetails {
  trip: Trip;
  operator: Operator;
  bus: BusType;
  fromCity: City;
  toCity: City;
}

// Session ID for seat locking
const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  let sessionId = sessionStorage.getItem('bus_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('bus_session_id', sessionId);
  }
  return sessionId;
};

function SeatSelectionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = params.id as string;
  const seatsParam = parseInt(searchParams.get('seats') || '1');
  const isForeigner = searchParams.get('foreigner') === 'true';

  const [loading, setLoading] = useState(true);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [seats, setSeats] = useState<SeatWithLock[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [seatLocks, setSeatLocks] = useState<SeatLock[]>([]);
  const [lockingSeat, setLockingSeat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = getSessionId();

  // Fetch trip details and seats
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch trip with details
        const { data: tripData, error: tripError } = await database
          .from('trips')
          .select(`
            *,
            operators (*),
            buses (*),
            routes!inner (
              id,
              from_city_id,
              to_city_id
            )
          `)
          .eq('id', tripId)
          .maybeSingle();

        if (tripError || !tripData) {
          setError('Trip not found');
          setLoading(false);
          return;
        }

        // Fetch cities
        const route = tripData.routes as any;
        const { data: cities } = await database
          .from('cities')
          .select('*')
          .in('id', [route.from_city_id, route.to_city_id]);

        const fromCity = cities?.find(c => c.id === route.from_city_id);
        const toCity = cities?.find(c => c.id === route.to_city_id);

        setTripDetails({
          trip: tripData,
          operator: tripData.operators as Operator,
          bus: tripData.buses as BusType,
          fromCity: fromCity!,
          toCity: toCity!,
        });

        const availabilityResponse = await fetch(`/api/trips/${encodeURIComponent(tripId)}/seats`);
        const availability = await availabilityResponse.json();
        if (!availabilityResponse.ok) throw new Error('Unable to load seats');
        setSeats(availability.seats || []);
        setSeatLocks(availability.locks || []);
      } catch (err) {
        console.error('Error fetching trip:', err);
        setError('Failed to load trip details');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;
    const refreshSeats = async () => {
      const response = await fetch(`/api/trips/${encodeURIComponent(tripId)}/seats`);
      if (!response.ok) return;
      const availability = await response.json();
      setSeats(availability.seats || []);
      setSeatLocks(availability.locks || []);
    };
    const refreshInterval = setInterval(refreshSeats, 3000);
    return () => clearInterval(refreshInterval);
  }, [tripId]);

  // Lock a seat
  const lockSeat = async (seat: Seat) => {
    if (selectedSeats.length >= seatsParam && !selectedSeats.find(s => s.id === seat.id)) {
      return; // Already selected max seats
    }

    if (lockingSeat) return; // Already processing

    setLockingSeat(seat.id);
    setError(null);

    try {
      if (selectedSeats.find(s => s.id === seat.id)) {
        const response = await fetch('/api/seats/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seatId: seat.id, sessionId }),
        });
        if (!response.ok) throw new Error('Failed to release seat');
        setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
        setLockingSeat(null);
        return;
      }

      const response = await fetch('/api/seats/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId: seat.id, tripId, sessionId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to reserve seat');
      setSelectedSeats(prev => [...prev, seat]);
    } catch (err) {
      console.error('Error locking seat:', err);
      setError('Failed to select seat. Please try again.');
    } finally {
      setLockingSeat(null);
    }
  };

  // Continue to passenger details
  const handleContinue = () => {
    if (selectedSeats.length !== seatsParam) {
      setError(`Please select ${seatsParam} seat${seatsParam > 1 ? 's' : ''}`);
      return;
    }

    // Store selected seats in sessionStorage
    sessionStorage.setItem('selected_seats', JSON.stringify(selectedSeats.map(s => s.seat_number)));
    router.push(`/passenger/${tripId}?seats=${seatsParam}&foreigner=${isForeigner}`);
  };

  // Helper to check if seat is locked by current session
  const isLockedByMe = (seat: Seat) => {
    return selectedSeats.some(s => s.id === seat.id);
  };

  // Helper to check if seat is locked by someone else
  const isLockedByOther = (seat: Seat) => {
    const lock = seatLocks.find(l => l.seat_id === seat.id);
    return Boolean(lock && !isLockedByMe(seat));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  const getTotalPrice = () => {
    if (!tripDetails || selectedSeats.length === 0) return 0;
    const pricePerSeat = isForeigner && tripDetails.trip.foreigner_price
      ? tripDetails.trip.foreigner_price
      : tripDetails.trip.base_price;
    return pricePerSeat * selectedSeats.length;
  };

  const pricePerSeat = tripDetails
    ? (isForeigner && tripDetails.trip.foreigner_price
        ? tripDetails.trip.foreigner_price
        : tripDetails.trip.base_price)
    : 0;

  // Render bus layout
  const renderBusLayout = () => {
    if (seats.length === 0) {
      return (
        <div className="text-center py-12 text-slate-400">
          No seat data available
        </div>
      );
    }

    const rows = Array.from(new Set(seats.map(s => s.row_number)));
    const columns = Array.from(new Set(seats.map(s => s.column_number))).sort((a, b) => a - b);

    return (
      <div className="flex flex-col items-center gap-2">
        {/* Driver area */}
        <div className="w-full max-w-md bg-slate-800/50 rounded-t-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center">
              <Bus className="h-5 w-5 text-slate-400" />
            </div>
            <span className="text-xs text-slate-400">Driver</span>
          </div>
          <div className="text-xs text-slate-500">Door</div>
        </div>

        {/* Seat rows */}
        <div className="w-full max-w-md bg-slate-800/20 rounded-xl p-4">
          {rows.map((row) => {
            const rowSeats = seats.filter(s => s.row_number === row).sort((a, b) => a.column_number - b.column_number);
            const isLastRow = !seats.some(s => s.row_number === row + 1);

            return (
              <div key={row} className="flex justify-center gap-2 mb-2">
                {/* Left seats (columns 1, 2 usually) */}
                <div className="flex gap-1">
                  {rowSeats.filter(s => s.column_number <= 2).map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => lockSeat(seat)}
                      disabled={
                        seat.status === 'booked' ||
                        isLockedByOther(seat) ||
                        lockingSeat !== null
                      }
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all
                        ${seat.status === 'booked' ? 'seat-booked' : ''}
                        ${isLockedByOther(seat) ? 'seat-locked' : ''}
                        ${isLockedByMe(seat) ? 'seat-selected' : ''}
                        ${seat.status === 'available' && !isLockedByMe(seat) && !isLockedByOther(seat) ? 'seat-available' : ''}
                        ${lockingSeat === seat.id ? 'ring-2 ring-orange-500 animate-pulse-soft' : ''}
                      `}
                      title={`Seat ${seat.seat_number} - ${seat.seat_type}`}
                    >
                      {seat.seat_number}
                    </button>
                  ))}
                </div>

                {/* Aisle */}
                <div className="w-6 flex items-center justify-center">
                  {isLastRow && <span className="text-slate-500">|</span>}
                </div>

                {/* Right seats (columns 3, 4 usually) */}
                <div className="flex gap-1">
                  {rowSeats.filter(s => s.column_number > 2).map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => lockSeat(seat)}
                      disabled={
                        seat.status === 'booked' ||
                        isLockedByOther(seat) ||
                        lockingSeat !== null
                      }
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all
                        ${seat.status === 'booked' ? 'seat-booked' : ''}
                        ${isLockedByOther(seat) ? 'seat-locked' : ''}
                        ${isLockedByMe(seat) ? 'seat-selected' : ''}
                        ${seat.status === 'available' && !isLockedByMe(seat) && !isLockedByOther(seat) ? 'seat-available' : ''}
                        ${lockingSeat === seat.id ? 'ring-2 ring-orange-500 animate-pulse-soft' : ''}
                      `}
                      title={`Seat ${seat.seat_number} - ${seat.seat_type}`}
                    >
                      {seat.seat_number}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-700 border border-slate-600" />
            <span className="text-xs text-slate-400">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-500" />
            <span className="text-xs text-slate-400">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-900/50 border border-red-800" />
            <span className="text-xs text-slate-400">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-600/50 border border-amber-500" />
            <span className="text-xs text-slate-400">Locked</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (error && !tripDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">{error}</h1>
        <Link href="/" className="btn-primary px-6 py-2 rounded-lg">
          Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <Link
            href={`/search?from=${tripDetails?.fromCity.name}&to=${tripDetails?.toCity.name}&date=${format(new Date(tripDetails?.trip.departure_time || new Date()), 'yyyy-MM-dd')}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search results
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trip Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trip Summary Card */}
              <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-start gap-4 mb-6">
                  {tripDetails?.operator?.logo_url ? (
                    <img
                      src={tripDetails.operator.logo_url}
                      alt={tripDetails.operator.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-500 to-teal-500 flex items-center justify-center">
                      <Bus className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">{tripDetails?.operator?.name}</h2>
                    <p className="text-slate-400">{tripDetails?.bus?.bus_type}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {tripDetails?.bus?.amenities?.map((amenity, i) => (
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
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-3xl font-bold text-white">
                      {format(new Date(tripDetails?.trip.departure_time || ''), 'hh:mm a')}
                    </div>
                    <div className="text-sm text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {tripDetails?.fromCity?.name}
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-sm text-slate-500">
                      {tripDetails?.trip.arrival_time && (
                        <>
                          {Math.round((new Date(tripDetails.trip.arrival_time).getTime() - new Date(tripDetails.trip.departure_time).getTime()) / (1000 * 60 * 60))}h
                        </>
                      )}
                    </div>
                    <div className="mx-3 flex-1 h-px bg-gradient-to-r from-orange-500/50 to-teal-500/50" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">
                      {format(new Date(tripDetails?.trip.arrival_time || ''), 'hh:mm a')}
                    </div>
                    <div className="text-sm text-slate-400 flex items-center justify-end gap-1">
                      <MapPin className="h-3 w-3" />
                      {tripDetails?.toCity?.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seat Selection */}
              <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Armchair className="h-5 w-5 text-orange-500" />
                    Select Your Seats ({selectedSeats.length}/{seatsParam})
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <Timer className="h-4 w-4" />
                    <span>Lock expires in 10 minutes</span>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-300 text-sm">
                    {error}
                  </div>
                )}

                {renderBusLayout()}
              </div>
            </div>

            {/* Booking Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-white mb-4">Booking Summary</h3>

                <div className="space-y-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Route</span>
                    <span>{tripDetails?.fromCity?.name} - {tripDetails?.toCity?.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Date</span>
                    <span>{format(new Date(tripDetails?.trip.departure_time || ''), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Passenger Type</span>
                    <span>{isForeigner ? 'Foreign' : 'Local'}</span>
                  </div>

                  <div className="border-t border-slate-700/50 pt-4">
                    <div className="flex justify-between text-slate-300 mb-2">
                      <span>Selected Seats</span>
                      <span>
                        {selectedSeats.length > 0
                          ? selectedSeats.map(s => s.seat_number).join(', ')
                          : 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-700/50 pt-4">
                    <div className="flex justify-between text-slate-400 mb-2">
                      <span>Price per seat</span>
                      <span>MMK {formatPrice(pricePerSeat)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 mb-2">
                      <span>Number of seats</span>
                      <span>{selectedSeats.length}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-700/50 pt-4">
                    <div className="flex justify-between text-white">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-orange-500">
                        MMK {formatPrice(getTotalPrice())}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleContinue}
                    disabled={selectedSeats.length !== seatsParam}
                    className="w-full btn-primary py-4 rounded-xl text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    {selectedSeats.length === seatsParam
                      ? 'Continue to Passenger Details'
                      : `Select ${seatsParam - selectedSeats.length} more seat${seatsParam - selectedSeats.length > 1 ? 's' : ''}`}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
                    <Lock className="h-3 w-3" />
                    Seats locked for 10 minutes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function TripPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    }>
      <SeatSelectionPage />
    </Suspense>
  );
}
