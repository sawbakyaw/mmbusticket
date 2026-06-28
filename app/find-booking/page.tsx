'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { supabase } from '@/lib/supabase';
import { Booking } from '@/lib/types';
import {
  Search, Ticket, AlertCircle, Bus, MapPin, Clock,
  Download, Phone, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';

export default function FindBookingPage() {
  const router = useRouter();
  const [searchType, setSearchType] = useState<'reference' | 'phone'>('reference');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError(null);
    setBookings([]);

    try {
      let query;

      if (searchType === 'reference') {
        query = supabase
          .from('bookings')
          .select('*')
          .eq('booking_reference', searchValue.trim().toUpperCase());
      } else {
        query = supabase
          .from('bookings')
          .select('*')
          .eq('passenger_phone', searchValue.trim())
          .order('booked_at', { ascending: false })
          .limit(5);
      }

      const { data, error: err } = await query;

      if (err) throw err;

      if (!data || data.length === 0) {
        setError('No bookings found. Please check your information and try again.');
      } else {
        setBookings(data);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <Ticket className="h-16 w-16 text-teal-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-3">Find Your Booking</h1>
            <p className="text-slate-400">
              Retrieve your e-ticket using your booking reference or phone number
            </p>
          </div>

          {/* Search Type Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setSearchType('reference');
                setSearchValue('');
                setError(null);
                setBookings([]);
              }}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                searchType === 'reference'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              By Reference
            </button>
            <button
              onClick={() => {
                setSearchType('phone');
                setSearchValue('');
                setError(null);
                setBookings([]);
              }}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                searchType === 'phone'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              By Phone
            </button>
          </div>

          {/* Search Form */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-8">
            <form onSubmit={handleSearch}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {searchType === 'reference' ? 'Booking Reference' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={searchType === 'reference' ? 'MMT-XXXXXXXX' : '09 123 456 789'}
                    className="w-full input-dark rounded-xl px-4 py-3 text-lg"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !searchValue.trim()}
                  className="w-full btn-primary py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Find Booking
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-8">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {bookings.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Found {bookings.length} booking{bookings.length > 1 ? 's' : ''}
              </h2>

              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-slate-400">Booking Reference</p>
                      <p className="text-xl font-bold text-orange-500 font-mono">
                        {booking.booking_reference}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      booking.payment_status === 'paid'
                        ? 'bg-teal-500/20 text-teal-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {booking.payment_status === 'paid' ? 'Confirmed' : 'Pending'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-slate-400">Passenger</p>
                      <p className="text-white font-medium">{booking.passenger_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Seats</p>
                      <p className="text-white font-medium">{booking.seat_numbers?.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Date</p>
                      <p className="text-white">{format(new Date(booking.booked_at), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Total</p>
                      <p className="text-white font-bold">MMK {formatPrice(booking.total_amount)}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/confirmation/${booking.booking_reference}`}
                      className="flex-1 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium text-center transition-colors"
                    >
                      View Ticket
                    </Link>
                    {booking.payment_status !== 'paid' && (
                      <Link
                        href={`/payment/${booking.booking_reference}`}
                        className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-center transition-colors"
                      >
                        Complete Payment
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Help Link */}
          <div className="mt-8 text-center">
            <p className="text-slate-400 mb-2">Can't find your booking?</p>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
            >
              <Phone className="h-4 w-4" />
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
