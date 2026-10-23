'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { database } from '@/lib/db-client';
import { Trip, Operator, Bus as BusType, City } from '@/lib/types';
import { format } from 'date-fns';
import {
  Bus, MapPin, ArrowLeft, CheckCircle2, User, Phone, Mail,
  CreditCard, FileText, AlertCircle, Lock
} from 'lucide-react';

interface TripDetails {
  trip: Trip;
  operator: Operator;
  bus: BusType;
  fromCity: City;
  toCity: City;
}

function PassengerFormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tripId = params.id as string;
  const seatsParam = parseInt(searchParams.get('seats') || '1');
  const isForeigner = searchParams.get('foreigner') === 'true';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Form state
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerNrc, setPassengerNrc] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('bus_session_id') || '' : '';

  // Fetch trip details
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch trip with details
        const { data: tripData } = await database
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

        if (!tripData) {
          router.push('/');
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

        // Calculate price
        const pricePerSeat = isForeigner && tripData.foreigner_price
          ? tripData.foreigner_price
          : tripData.base_price;
        setTotalPrice(pricePerSeat);

        // Get selected seats from sessionStorage
        const storedSeats = sessionStorage.getItem('selected_seats');
        if (storedSeats) {
          const seats = JSON.parse(storedSeats);
          setSelectedSeats(seats);
          setTotalPrice(pricePerSeat * seats.length);
        }
      } catch (err) {
        console.error('Error fetching trip:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [tripId, isForeigner, router]);

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!passengerName.trim()) {
      newErrors.name = 'Passenger name is required';
    }

    if (!passengerPhone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{7,15}$/.test(passengerPhone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!isForeigner && !passengerNrc.trim()) {
      newErrors.nrc = 'NRC number is required for local travellers';
    }

    if (passengerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passengerEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !tripDetails) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          sessionId,
          seatNumbers: selectedSeats,
          passengerName,
          passengerPhone,
          passengerEmail: passengerEmail || null,
          passengerNrc: passengerNrc || null,
          isForeigner,
          notes: notes || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create booking');
      router.push(`/payment/${result.booking.booking_reference}`);
    } catch (err) {
      console.error('Error creating booking:', err);
      setErrors({ submit: 'Failed to create booking. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
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
            href={`/trip/${tripId}?seats=${seatsParam}&foreigner=${isForeigner}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to seat selection
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Passenger Form */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <User className="h-6 w-6 text-orange-500" />
                  Passenger Details
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Passenger Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      placeholder="Enter passenger's full name"
                      className={`w-full input-dark rounded-xl px-4 py-3 text-lg ${
                        errors.name ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Phone className="h-4 w-4 inline mr-2" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      placeholder="09 123 456 789"
                      className={`w-full input-dark rounded-xl px-4 py-3 ${
                        errors.phone ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      We'll send booking confirmation and e-ticket to this number via SMS
                    </p>
                  </div>

                  {/* Email (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Mail className="h-4 w-4 inline mr-2" />
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={passengerEmail}
                      onChange={(e) => setPassengerEmail(e.target.value)}
                      placeholder="passenger@email.com"
                      className={`w-full input-dark rounded-xl px-4 py-3 ${
                        errors.email ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* NRC Number (Required for locals) */}
                  {!isForeigner && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <FileText className="h-4 w-4 inline mr-2" />
                        NRC Number *
                      </label>
                      <input
                        type="text"
                        value={passengerNrc}
                        onChange={(e) => setPassengerNrc(e.target.value)}
                        placeholder="1/ABC(N)123456"
                        className={`w-full input-dark rounded-xl px-4 py-3 ${
                          errors.nrc ? 'border-red-500' : ''
                        }`}
                      />
                      {errors.nrc && (
                        <p className="text-red-400 text-sm mt-1">{errors.nrc}</p>
                      )}
                    </div>
                  )}

                  {/* Foreign Traveller Notice */}
                  {isForeigner && (
                    <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                      <p className="text-teal-300 text-sm">
                        <AlertCircle className="h-4 w-4 inline mr-2" />
                        Foreign travellers may need to present Immigration Form C and travel permission at checkpoints.
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Any special requests or dietary requirements..."
                      className="w-full input-dark rounded-xl px-4 py-3 resize-none"
                    />
                  </div>

                  {errors.submit && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <p className="text-red-400 text-sm">{errors.submit}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-primary py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        Continue to Payment
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Booking Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 sticky top-24">
                <h3 className="text-lg font-semibold text-white mb-4">Booking Summary</h3>

                <div className="space-y-4">
                  {/* Trip Info */}
                  <div className="pb-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3 mb-3">
                      {tripDetails?.operator?.logo_url ? (
                        <img
                          src={tripDetails.operator.logo_url}
                          alt={tripDetails.operator.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-teal-500 flex items-center justify-center">
                          <Bus className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{tripDetails?.operator?.name}</p>
                        <p className="text-xs text-slate-400">{tripDetails?.bus?.bus_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Route</span>
                      <span className="text-white">
                        {tripDetails?.fromCity?.name} - {tripDetails?.toCity?.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-slate-400">Date</span>
                      <span className="text-white">
                        {format(new Date(tripDetails?.trip.departure_time || ''), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-slate-400">Departure</span>
                      <span className="text-white">
                        {format(new Date(tripDetails?.trip.departure_time || ''), 'hh:mm a')}
                      </span>
                    </div>
                  </div>

                  {/* Seats */}
                  <div className="pb-4 border-b border-slate-700/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Seats</span>
                      <span className="text-white font-medium">
                        {selectedSeats.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-slate-400">Passenger Type</span>
                      <span className="text-white">{isForeigner ? 'Foreign' : 'Local'}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Total Amount</span>
                      <span className="text-2xl font-bold text-orange-500">
                        MMK {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-slate-500 text-xs pt-2">
                    <Lock className="h-3 w-3" />
                    Secure checkout
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

export default function PassengerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    }>
      <PassengerFormPage />
    </Suspense>
  );
}
