'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { supabase } from '@/lib/supabase';
import { Booking, Trip } from '@/lib/types';
import { format } from 'date-fns';
import {
  CreditCard, Building2, Smartphone, ArrowLeft, CheckCircle2,
  AlertCircle, Bus, MapPin, Clock, Lock, Copy, Check
} from 'lucide-react';

const paymentMethods = [
  { id: 'kbzpay', name: 'KBZPay', icon: Smartphone, color: 'bg-purple-500' },
  { id: 'wave', name: 'WaveMoney', icon: Smartphone, color: 'bg-blue-500' },
  { id: 'cbpay', name: 'CBPay', icon: Smartphone, color: 'bg-orange-500' },
  { id: 'mpu', name: ' MPU Card', icon: CreditCard, color: 'bg-green-600' },
  { id: 'visa', name: 'VISA', icon: CreditCard, color: 'bg-blue-700' },
  { id: 'master', name: 'MASTER', icon: CreditCard, color: 'bg-red-600' },
];

function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const bookingReference = params.reference as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('booking_reference', bookingReference)
          .maybeSingle();

        if (error || !data) {
          router.push('/');
          return;
        }

        setBooking(data);

        // Fetch trip details
        if (data.trip_id) {
          const { data: tripData } = await supabase
            .from('trips')
            .select(`
              *,
              operators (*),
              routes (
                from_city_id,
                to_city_id
              )
            `)
            .eq('id', data.trip_id)
            .maybeSingle();
          setTrip(tripData);
        }
      } catch (err) {
        console.error('Error fetching booking:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [bookingReference, router]);

  const handlePayment = async () => {
    if (!selectedPayment || !booking) return;

    setProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update booking status
    const { error } = await supabase
      .from('bookings')
      .update({
        payment_method: selectedPayment,
        payment_status: 'paid',
        payment_reference: `PAY-${Date.now()}`,
      })
      .eq('id', booking.id);

    if (error) {
      console.error('Error updating booking:', error);
      setProcessing(false);
      return;
    }

    // Navigate to confirmation
    router.push(`/confirmation/${bookingReference}`);
  };

  const copyReference = () => {
    navigator.clipboard.writeText(bookingReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-teal-400 text-sm">Select Seats</span>
            </div>
            <div className="w-20 h-px bg-teal-500" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-teal-400 text-sm">Passenger Details</span>
            </div>
            <div className="w-20 h-px bg-slate-600" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-medium">
                3
              </div>
              <span className="text-orange-400 text-sm">Payment</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Methods */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-500" />
                Select Payment Method
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${
                      selectedPayment === method.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-10 h-10 ${method.color} rounded-lg flex items-center justify-center`}>
                      <method.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className={`font-medium ${
                      selectedPayment === method.id ? 'text-orange-400' : 'text-slate-300'
                    }`}>
                      {method.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Payment Instructions */}
              {selectedPayment && (
                <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <h4 className="font-medium text-white mb-2">Payment Instructions</h4>
                  <p className="text-sm text-slate-400">
                    Click "Complete Payment" to simulate payment processing. In production, you would be redirected to {paymentMethods.find(m => m.id === selectedPayment)?.name} to complete the transaction securely.
                  </p>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={!selectedPayment || processing}
                className="w-full btn-primary py-4 rounded-xl text-lg font-semibold mt-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    Complete Payment
                  </>
                )}
              </button>
            </div>

            {/* Booking Summary */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Booking Summary</h2>

              {/* Booking Reference */}
              <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Booking Reference</p>
                    <p className="text-xl font-bold text-orange-500 font-mono">{bookingReference}</p>
                  </div>
                  <button
                    onClick={copyReference}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-teal-400" />
                    ) : (
                      <Copy className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Trip Details */}
              <div className="space-y-4 pb-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Passenger</span>
                  <span className="text-white font-medium">{booking?.passenger_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Phone</span>
                  <span className="text-white">{booking?.passenger_phone}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Seats</span>
                  <span className="text-white font-medium">{booking?.seat_numbers?.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Date</span>
                  <span className="text-white">
                    {trip && format(new Date(trip.departure_time), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Departure</span>
                  <span className="text-white">
                    {trip && format(new Date(trip.departure_time), 'hh:mm a')}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-300 text-lg">Total Amount</span>
                  <span className="text-3xl font-bold text-orange-500">
                    MMK {formatPrice(booking?.total_amount || 0)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  This is a demo. No actual payment will be processed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PaymentPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    }>
      <PaymentPage />
    </Suspense>
  );
}
