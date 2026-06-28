'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { supabase } from '@/lib/supabase';
import { Booking, Trip, Operator, City, Bus as BusType } from '@/lib/types';
import { format } from 'date-fns';
import {
  CheckCircle2, Download, Mail, Phone, MapPin, Clock,
  Bus, User, Ticket, Share2, Home, Copy, Check
} from 'lucide-react';

interface TripWithDetails extends Trip {
  operators: Operator;
  buses: BusType;
  fromCity: City;
  toCity: City;
}

function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const bookingReference = params.reference as string;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('bookings')
          .select('*')
          .eq('booking_reference', bookingReference)
          .maybeSingle();

        if (!data) {
          router.push('/');
          return;
        }

        setBooking(data);

        // Fetch trip with all details
        if (data.trip_id) {
          const { data: tripData } = await supabase
            .from('trips')
            .select(`
              *,
              operators (*),
              buses (*)
            `)
            .eq('id', data.trip_id)
            .maybeSingle();

          if (tripData && tripData.routes) {
            const route = tripData.routes as any;
            const { data: cities } = await supabase
              .from('cities')
              .select('*')
              .in('id', [route.from_city_id, route.to_city_id]);

            const fromCity = cities?.find(c => c.id === route.from_city_id);
            const toCity = cities?.find(c => c.id === route.to_city_id);

            setTrip({
              ...tripData,
              operators: tripData.operators as Operator,
              buses: tripData.buses as BusType,
              fromCity: fromCity!,
              toCity: toCity!,
            } as TripWithDetails);
          }
        }
      } catch (err) {
        console.error('Error fetching booking:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [bookingReference, router]);

  const copyReference = () => {
    navigator.clipboard.writeText(bookingReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTicket = () => {
    // Create printable ticket content
    const ticketContent = `
MM-BusTicket Pro - E-TICKET
============================

Booking Reference: ${booking?.booking_reference}

Passenger: ${booking?.passenger_name}
Phone: ${booking?.passenger_phone}
Email: ${booking?.passenger_email || 'N/A'}

Trip Details:
${trip?.operators?.name}
${trip?.fromCity?.name} → ${trip?.toCity?.name}
Date: ${trip ? format(new Date(trip.departure_time), 'EEEE, MMMM d, yyyy') : ''}
Departure: ${trip ? format(new Date(trip.departure_time), 'hh:mm a') : ''}

Seats: ${booking?.seat_numbers?.join(', ')}
Total Paid: MMK ${booking?.total_amount?.toLocaleString()}

Please arrive at the bus station 45 minutes before departure.
Present this e-ticket and valid ID to board.

Need help? Call: 09 777 111 811
    `;

    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${bookingReference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareTicket = async () => {
    const shareText = `
My Bus Ticket (${bookingReference})
${trip?.fromCity?.name} → ${trip?.toCity?.name}
${trip ? format(new Date(trip.departure_time), 'MMM d, yyyy hh:mm a') : ''}
Seats: ${booking?.seat_numbers?.join(', ')}
Booked via MM-BusTicket Pro
    `;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Bus Ticket',
          text: shareText,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Ticket details copied to clipboard!');
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

      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Success Banner */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/25">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-slate-400">
              Your e-ticket has been sent to {booking?.passenger_phone}
            </p>
          </div>

          {/* E-Ticket Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bus className="h-6 w-6 text-white" />
                <span className="text-white font-bold text-lg">MM-BusTicket Pro</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-orange-200">Booking Reference</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono font-bold">{bookingReference}</span>
                  <button
                    onClick={copyReference}
                    className="p-1 hover:bg-orange-400 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <Copy className="h-4 w-4 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Operator & Trip */}
              <div className="flex items-center gap-4">
                {trip?.operators?.logo_url ? (
                  <img
                    src={trip.operators.logo_url}
                    alt={trip.operators.name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-orange-500 to-teal-500 flex items-center justify-center">
                    <Bus className="h-7 w-7 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-white">{trip?.operators?.name}</h2>
                  <p className="text-slate-400 text-sm">{trip?.buses?.bus_type || 'Express Bus'}</p>
                </div>
              </div>

              {/* Route */}
              <div className="flex items-center gap-4 py-4 px-4 bg-slate-800/50 rounded-xl">
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-white">
                    {trip ? format(new Date(trip.departure_time), 'hh:mm') : '--:--'}
                  </p>
                  <p className="text-sm text-slate-400">{trip?.fromCity?.name}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-px bg-gradient-to-r from-orange-500 to-teal-500" />
                  <div className="my-2 px-3 py-1 bg-slate-900 rounded-full text-xs text-slate-400">
                    Direct
                  </div>
                  <div className="w-24 h-px bg-gradient-to-r from-teal-500 to-orange-500" />
                </div>
                <div className="text-center flex-1">
                  <p className="text-2xl font-bold text-white">
                    {trip?.arrival_time ? format(new Date(trip.arrival_time), 'hh:mm') : '--:--'}
                  </p>
                  <p className="text-sm text-slate-400">{trip?.toCity?.name}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3 text-slate-300">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className="text-lg">
                  {trip ? format(new Date(trip.departure_time), 'EEEE, MMMM d, yyyy') : ''}
                </span>
              </div>

              {/* Divider with dots */}
              <div className="relative py-2">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-950 rounded-full border-l-2 border-slate-700" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-950 rounded-full border-r-2 border-slate-700" />
                <div className="border-t-2 border-dashed border-slate-700" />
              </div>

              {/* Passenger & Seats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" /> Passenger
                  </p>
                  <p className="text-white font-medium">{booking?.passenger_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Ticket className="h-3 w-3" /> Seats
                  </p>
                  <p className="text-white font-medium">{booking?.seat_numbers?.join(', ')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </p>
                  <p className="text-white">{booking?.passenger_phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Passenger Type</p>
                  <p className="text-white">{booking?.is_foreigner ? 'Foreign Traveller' : 'Local Traveller'}</p>
                </div>
              </div>

              {/* Total Paid */}
              <div className="flex items-center justify-between py-4 px-4 bg-gradient-to-r from-orange-500/10 to-teal-500/10 rounded-xl border border-orange-500/20">
                <span className="text-slate-300 font-medium">Total Paid</span>
                <span className="text-2xl font-bold text-orange-500">
                  MMK {formatPrice(booking?.total_amount || 0)}
                </span>
              </div>

              {/* Important Info */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <h4 className="font-medium text-amber-400 mb-2">Important Information</h4>
                <ul className="text-sm text-amber-200 space-y-1">
                  <li>Please arrive at the bus station 45 minutes before departure.</li>
                  <li>Present this e-ticket and valid ID to board.</li>
                  <li>{booking?.is_foreigner ? 'Ensure you have Immigration Form C ready.' : 'NRC is required for verification.'}</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-3 p-4 border-t border-slate-700/50 bg-slate-800/30">
              <button
                onClick={downloadTicket}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
              >
                <Download className="h-5 w-5 text-teal-400" />
                <span className="text-xs text-slate-300">Download</span>
              </button>
              <button
                onClick={shareTicket}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
              >
                <Share2 className="h-5 w-5 text-teal-400" />
                <span className="text-xs text-slate-300">Share</span>
              </button>
              <Link
                href="/"
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
              >
                <Home className="h-5 w-5 text-teal-400" />
                <span className="text-xs text-slate-300">Home</span>
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="mt-8 text-center">
            <p className="text-slate-400 mb-2">Need help with your booking?</p>
            <a
              href="tel:09777111811"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span className="font-medium">09 777 111 811</span>
            </a>
            <span className="text-slate-600 mx-2">|</span>
            <Link href="/help" className="text-teal-400 hover:text-teal-300 transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ConfirmationPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    }>
      <ConfirmationPage />
    </Suspense>
  );
}
